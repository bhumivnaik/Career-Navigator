const db = require("../config/db").promise();

const verifySkill = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { skill_id, repository_url } = req.body;

        if (!skill_id || !repository_url) {
            return res.status(400).json({
                message: "skill_id and repository_url are required"
            });
        }

        if (!repository_url.startsWith("https://github.com/")) {
            return res.status(400).json({
                message: "Please provide a valid GitHub repository URL"
            });
        }

        // --------------------------------------------------
        // 1. GET SKILL
        // --------------------------------------------------

        const [skills] = await db.query(
            `SELECT skill_id, skill_name
             FROM skills
             WHERE skill_id = ?`,
            [skill_id]
        );

        if (skills.length === 0) {
            return res.status(404).json({
                message: "Skill not found"
            });
        }

        const skillName = skills[0].skill_name;

        console.log("\n=================================");
        console.log("SKILL VERIFICATION STARTED");
        console.log("Skill:", skillName);
        console.log("Repository:", repository_url);
        console.log("=================================\n");

        // --------------------------------------------------
        // 2. PARSE GITHUB URL
        // --------------------------------------------------

        const repoInfo = parseGithubUrl(repository_url);

        if (!repoInfo) {
            return res.status(400).json({
                message: "Invalid GitHub repository URL"
            });
        }

        const { owner, repo } = repoInfo;

        console.log("GitHub owner:", owner);
        console.log("GitHub repo:", repo);

        // --------------------------------------------------
        // 3. GET REPOSITORY INFORMATION
        // --------------------------------------------------

        const repository = await githubRequest(
            `https://api.github.com/repos/${owner}/${repo}`
        );

        // --------------------------------------------------
        // 4. GET REPOSITORY TREE
        // --------------------------------------------------

        const treeResponse = await githubRequest(
            `https://api.github.com/repos/${owner}/${repo}/git/trees/${repository.default_branch}?recursive=1`
        );

        const files = treeResponse.tree
            .filter(item => item.type === "blob")
            .map(item => item.path);

        console.log("Total files:", files.length);

        // Limit files so huge repositories don't overwhelm AI
        const relevantFiles = selectRelevantFiles(
            files,
            skillName
        );

        console.log(
            "Relevant files:",
            relevantFiles.length
        );

        // --------------------------------------------------
        // 5. GET FILE CONTENT
        // --------------------------------------------------

        const fileContents = [];

        for (const filePath of relevantFiles) {
            try {
                const content = await getGithubFile(
                    owner,
                    repo,
                    filePath,
                    repository.default_branch
                );

                if (content) {
                    fileContents.push({
                        path: filePath,
                        content
                    });
                }
            } catch (error) {
                console.log(
                    "Could not read:",
                    filePath
                );
            }
        }

        console.log(
            "Files successfully read:",
            fileContents.length
        );

        // --------------------------------------------------
        // 6. BASIC DETERMINISTIC EVIDENCE
        // --------------------------------------------------

        const packageFiles = fileContents.filter(
            file =>
                file.path === "package.json" ||
                file.path.endsWith("/package.json")
        );

        const dependencies = [];

        for (const file of packageFiles) {
            try {
                const packageJson = JSON.parse(
                    file.content
                );

                dependencies.push(
                    ...Object.keys(
                        packageJson.dependencies || {}
                    ),
                    ...Object.keys(
                        packageJson.devDependencies || {}
                    )
                );
            } catch (error) {
                // Ignore invalid package.json
            }
        }

        // --------------------------------------------------
        // 7. PREPARE AI EVIDENCE
        // --------------------------------------------------

        const evidence = {
            repository: {
                name: repository.name,
                description: repository.description,
                language: repository.language,
                default_branch: repository.default_branch
            },

            dependencies: [
                ...new Set(dependencies)
            ],

            files: fileContents.map(file => ({
                path: file.path,
                content: truncate(
                    file.content,
                    1200
                )
            }))
        };

        // --------------------------------------------------
        // 8. GRoq VERIFICATION
        // --------------------------------------------------

        const aiResult = await analyzeWithGroq(
            skillName,
            evidence
        );

        console.log("\nAI RESULT:");
        console.log(aiResult);

        // --------------------------------------------------
        // 9. SAVE VERIFICATION
        // --------------------------------------------------

        await db.query(
            `INSERT INTO skill_verifications
            (
                user_id,
                skill_id,
                repository_url,
                verification_status,
                confidence,
                evidence
            )
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                userId,
                skill_id,
                repository_url,
                aiResult.verified
                    ? "verified"
                    : "rejected",
                aiResult.confidence,
                aiResult.evidence
            ]
        );

        // --------------------------------------------------
        // 10. IF VERIFIED → ADD TO USER SKILLS
        // --------------------------------------------------

        if (aiResult.verified) {

            await db.query(
                `INSERT IGNORE INTO user_skills
                (user_id, skill_id)
                VALUES (?, ?)`,
                [userId, skill_id]
            );

            console.log(
                "SKILL ADDED TO USER_SKILLS"
            );
        }

        // --------------------------------------------------
        // 11. SEND RESPONSE
        // --------------------------------------------------

        return res.json({
            verified: aiResult.verified,
            confidence: aiResult.confidence,
            evidence: aiResult.evidence,
            skill_id,
            skill_name: skillName,
            repository_url
        });

    } catch (error) {

        console.error(
            "\nSKILL VERIFICATION ERROR:",
            error
        );

        return res.status(500).json({
            message: "Skill verification failed",
            error: error.message
        });
    }
};


// ======================================================
// GITHUB URL PARSER
// ======================================================

function parseGithubUrl(url) {

    try {

        const parsed = new URL(url);

        if (parsed.hostname !== "github.com") {
            return null;
        }

        const parts = parsed.pathname
            .split("/")
            .filter(Boolean);

        if (parts.length < 2) {
            return null;
        }

        return {
            owner: parts[0],
            repo: parts[1].replace(".git", "")
        };

    } catch (error) {
        return null;
    }
}


// ======================================================
// GITHUB REQUEST
// ======================================================

async function githubRequest(url) {

    const response = await fetch(url, {
        headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
            "User-Agent": "Career-Navigator"
        }
    });

    if (!response.ok) {

        const text = await response.text();

        throw new Error(
            `GitHub API ${response.status}: ${text}`
        );
    }

    return response.json();
}


// ======================================================
// GET FILE
// ======================================================

async function getGithubFile(
    owner,
    repo,
    path,
    branch
) {
    const url =
        `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`;

    const response = await fetch(url, {
        headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
            "User-Agent": "Career-Navigator"
        }
    });

    if (!response.ok) {
        const text = await response.text();

        throw new Error(
            `GitHub API ${response.status}: ${text}`
        );
    }

    const data = await response.json();

    if (!data.content) {
        throw new Error(
            `No file content returned for ${path}`
        );
    }

    // GitHub returns file content as Base64
    return Buffer.from(
        data.content.replace(/\n/g, ""),
        "base64"
    ).toString("utf-8");
}


// ======================================================
// SELECT RELEVANT FILES
// ======================================================

function selectRelevantFiles(files, skillName) {

    const ignored = [
        "node_modules/",
        ".git/",
        "dist/",
        "build/",
        ".next/",
        "coverage/",
        "vendor/",
        "target/",
        "bin/",
        "obj/",
        "__pycache__/",
        ".venv/",
        "venv/"
    ];

    const validFiles = files.filter(file => {

        const lower = file.toLowerCase();

        return !ignored.some(folder =>
            lower.includes(folder)
        );

    });

    const lowerSkill = skillName.toLowerCase();

    const priority = [];

    // =========================================================
    // ALWAYS INCLUDE IMPORTANT CONFIGURATION FILES
    // =========================================================

    const configFiles = validFiles.filter(file => {

        const lower = file.toLowerCase();

        return (
            lower === "package.json" ||
            lower.endsWith("/package.json") ||

            lower === "tsconfig.json" ||
            lower.endsWith("/tsconfig.json") ||

            lower === "vite.config.js" ||
            lower === "vite.config.ts" ||

            lower === "next.config.js" ||
            lower === "next.config.ts" ||

            lower === "webpack.config.js" ||

            lower === "requirements.txt" ||
            lower.endsWith("/requirements.txt") ||

            lower === "pubspec.yaml" ||
            lower.endsWith("/pubspec.yaml") ||

            lower === "composer.json" ||
            lower.endsWith("/composer.json")
        );

    });

    priority.push(...configFiles);


    // =========================================================
    // HTML
    // =========================================================

    if (
        lowerSkill.includes("html") ||
        lowerSkill.includes("web development") ||
        lowerSkill.includes("frontend")
    ) {

        priority.push(
            ...validFiles.filter(file => {

                const lower = file.toLowerCase();

                return (
                    lower.endsWith(".html") ||
                    lower.endsWith(".htm") ||
                    lower.endsWith(".jsx") ||
                    lower.endsWith(".tsx")
                );

            })
        );

    }


    // =========================================================
    // CSS
    // =========================================================

    if (
        lowerSkill.includes("css") ||
        lowerSkill.includes("frontend") ||
        lowerSkill.includes("web development")
    ) {

        priority.push(
            ...validFiles.filter(file => {

                const lower = file.toLowerCase();

                return (
                    lower.endsWith(".css") ||
                    lower.endsWith(".scss") ||
                    lower.endsWith(".sass") ||
                    lower.endsWith(".less") ||
                    lower.endsWith(".jsx") ||
                    lower.endsWith(".tsx") ||
                    lower.endsWith(".html")
                );

            })
        );

    }


    // =========================================================
    // JAVASCRIPT
    // =========================================================

    if (
        lowerSkill.includes("javascript") ||
        lowerSkill === "js"
    ) {

        priority.push(
            ...validFiles.filter(file => {

                const lower = file.toLowerCase();

                return (
                    lower.endsWith(".js") ||
                    lower.endsWith(".jsx") ||
                    lower.endsWith(".mjs") ||
                    lower.endsWith(".cjs")
                );

            })
        );

    }


    // =========================================================
    // TYPESCRIPT
    // =========================================================

    if (
        lowerSkill.includes("typescript") ||
        lowerSkill === "ts"
    ) {

        priority.push(
            ...validFiles.filter(file => {

                const lower = file.toLowerCase();

                return (
                    lower.endsWith(".ts") ||
                    lower.endsWith(".tsx") ||
                    lower.endsWith(".mts") ||
                    lower.endsWith(".cts")
                );

            })
        );

    }


    // =========================================================
    // REACT
    // =========================================================

    if (
        lowerSkill === "react" ||
        lowerSkill.includes("react.js") ||
        lowerSkill.includes("reactjs")
    ) {

        priority.push(
            ...validFiles.filter(file => {

                const lower = file.toLowerCase();

                return (
                    lower.endsWith(".jsx") ||
                    lower.endsWith(".tsx") ||
                    lower.endsWith(".js") ||
                    lower.endsWith(".ts")
                );

            })
        );

    }


    // =========================================================
    // REACT NATIVE
    // =========================================================

    if (
        lowerSkill.includes("react native") ||
        lowerSkill.includes("reactnative")
    ) {

        priority.push(
            ...validFiles.filter(file => {

                const lower = file.toLowerCase();

                return (
                    lower.endsWith(".jsx") ||
                    lower.endsWith(".tsx") ||
                    lower.endsWith(".js") ||
                    lower.endsWith(".ts")
                );

            })
        );

    }


    // =========================================================
    // NEXT.JS
    // =========================================================

    if (
        lowerSkill.includes("next.js") ||
        lowerSkill.includes("nextjs") ||
        lowerSkill === "next"
    ) {

        priority.push(
            ...validFiles.filter(file => {

                const lower = file.toLowerCase();

                return (
                    lower.endsWith(".js") ||
                    lower.endsWith(".jsx") ||
                    lower.endsWith(".ts") ||
                    lower.endsWith(".tsx")
                );

            })
        );

    }


    // =========================================================
    // NODE.JS
    // =========================================================

    if (
        lowerSkill.includes("node.js") ||
        lowerSkill.includes("nodejs") ||
        lowerSkill === "node"
    ) {

        priority.push(
            ...validFiles.filter(file => {

                const lower = file.toLowerCase();

                return (
                    lower.endsWith(".js") ||
                    lower.endsWith(".mjs") ||
                    lower.endsWith(".cjs") ||
                    lower.endsWith(".ts")
                );

            })
        );

    }


    // =========================================================
    // EXPRESS.JS
    // =========================================================

    if (
        lowerSkill.includes("express")
    ) {

        priority.push(
            ...validFiles.filter(file => {

                const lower = file.toLowerCase();

                return (
                    lower.endsWith(".js") ||
                    lower.endsWith(".ts") ||
                    lower.endsWith(".mjs") ||
                    lower.endsWith(".cjs")
                );

            })
        );

    }


    // =========================================================
    // PYTHON
    // =========================================================

    if (
        lowerSkill.includes("python")
    ) {

        priority.push(
            ...validFiles.filter(file =>
                file.toLowerCase().endsWith(".py")
            )
        );

    }


    // =========================================================
    // JAVA
    // =========================================================

    if (
        lowerSkill === "java" ||
        lowerSkill.includes("java development") ||
        lowerSkill.includes("spring")
    ) {

        priority.push(
            ...validFiles.filter(file => {

                const lower = file.toLowerCase();

                return (
                    lower.endsWith(".java") ||
                    lower.endsWith(".xml") ||
                    lower.endsWith(".properties")
                );

            })
        );

    }


    // =========================================================
    // C
    // =========================================================

    if (
        lowerSkill === "c" ||
        lowerSkill.includes("c programming")
    ) {

        priority.push(
            ...validFiles.filter(file => {

                const lower = file.toLowerCase();

                return (
                    lower.endsWith(".c") ||
                    lower.endsWith(".h")
                );

            })
        );

    }


    // =========================================================
    // C++
    // =========================================================

    if (
        lowerSkill.includes("c++") ||
        lowerSkill.includes("cpp")
    ) {

        priority.push(
            ...validFiles.filter(file => {

                const lower = file.toLowerCase();

                return (
                    lower.endsWith(".cpp") ||
                    lower.endsWith(".cc") ||
                    lower.endsWith(".cxx") ||
                    lower.endsWith(".hpp") ||
                    lower.endsWith(".h")
                );

            })
        );

    }


    // =========================================================
    // PHP
    // =========================================================

    if (
        lowerSkill.includes("php")
    ) {

        priority.push(
            ...validFiles.filter(file => {

                const lower = file.toLowerCase();

                return (
                    lower.endsWith(".php") ||
                    lower.endsWith(".phtml")
                );

            })
        );

    }


    // =========================================================
    // DART / FLUTTER
    // =========================================================

    if (
        lowerSkill.includes("flutter") ||
        lowerSkill.includes("dart")
    ) {

        priority.push(
            ...validFiles.filter(file => {

                const lower = file.toLowerCase();

                return (
                    lower.endsWith(".dart") ||
                    lower.endsWith("pubspec.yaml")
                );

            })
        );

    }


    // =========================================================
    // SQL / MYSQL / DATABASE
    // =========================================================

    if (
        lowerSkill.includes("sql") ||
        lowerSkill.includes("mysql") ||
        lowerSkill.includes("database")
    ) {

        priority.push(
            ...validFiles.filter(file => {

                const lower = file.toLowerCase();

                return (
                    lower.endsWith(".sql") ||
                    lower.endsWith(".mysql") ||
                    lower.endsWith(".js") ||
                    lower.endsWith(".ts") ||
                    lower.endsWith(".php") ||
                    lower.endsWith(".py")
                );

            })
        );

    }


    // =========================================================
    // MONGODB
    // =========================================================

    if (
        lowerSkill.includes("mongodb") ||
        lowerSkill.includes("mongo")
    ) {

        priority.push(
            ...validFiles.filter(file => {

                const lower = file.toLowerCase();

                return (
                    lower.endsWith(".js") ||
                    lower.endsWith(".ts") ||
                    lower.endsWith(".jsx") ||
                    lower.endsWith(".tsx") ||
                    lower.endsWith(".py")
                );

            })
        );

    }


    // =========================================================
    // REDUX
    // =========================================================

    if (
        lowerSkill.includes("redux")
    ) {

        priority.push(
            ...validFiles.filter(file => {

                const lower = file.toLowerCase();

                return (
                    lower.endsWith(".js") ||
                    lower.endsWith(".jsx") ||
                    lower.endsWith(".ts") ||
                    lower.endsWith(".tsx")
                );

            })
        );

    }


    // =========================================================
    // GENERIC FALLBACK
    // =========================================================
    // If the database contains a skill that does not have
    // a specific rule above, still inspect common source files.

    const genericSourceFiles = validFiles.filter(file => {

        const lower = file.toLowerCase();

        return (
            lower.endsWith(".js") ||
            lower.endsWith(".jsx") ||
            lower.endsWith(".ts") ||
            lower.endsWith(".tsx") ||
            lower.endsWith(".html") ||
            lower.endsWith(".htm") ||
            lower.endsWith(".css") ||
            lower.endsWith(".scss") ||
            lower.endsWith(".sass") ||
            lower.endsWith(".py") ||
            lower.endsWith(".java") ||
            lower.endsWith(".cpp") ||
            lower.endsWith(".cc") ||
            lower.endsWith(".cxx") ||
            lower.endsWith(".c") ||
            lower.endsWith(".h") ||
            lower.endsWith(".hpp") ||
            lower.endsWith(".php") ||
            lower.endsWith(".dart") ||
            lower.endsWith(".sql") ||
            lower.endsWith(".xml") ||
            lower.endsWith(".json")
        );

    });

    priority.push(...genericSourceFiles);


    // =========================================================
    // REMOVE DUPLICATES
    // =========================================================

    const unique = [
        ...new Set(priority)
    ];


    // =========================================================
    // MAXIMUM FILES
    // =========================================================

    return unique.slice(0, 15);
}





// ======================================================
// GROQ
// ======================================================

async function analyzeWithGroq(
    skillName,
    evidence
) {

    const Groq = require("groq-sdk");

    const groq = new Groq({
        apiKey: process.env.GROQ_API_KEY
    });

    const prompt = `
You are a technical skill verification system.

A developer claims that they have implemented the following skill:

SKILL:
${skillName}

Below is evidence collected from their public GitHub repository.

REPOSITORY INFORMATION:
${JSON.stringify(
        evidence.repository,
        null,
        2
    )}

DEPENDENCIES:
${JSON.stringify(
        evidence.dependencies,
        null,
        2
    )}

SOURCE FILES:
${JSON.stringify(
        evidence.files,
        null,
        2
    )}

Your task is to determine whether the repository provides
sufficient technical evidence that the developer actually
implemented and used "${skillName}".

IMPORTANT RULES:

1. Do NOT verify the skill merely because its name appears
   in a README, comment, filename or documentation.

2. Dependencies alone are NOT enough.

3. Look for actual implementation and usage in source code.

4. The code should demonstrate meaningful use of the skill.

5. If there is insufficient evidence, return verified=false.

6. Do not assume that a skill was used simply because another
   related technology is present.

7. Be conservative. False verification is worse than rejection.

8. Base the decision only on the repository evidence provided.

Return ONLY valid JSON in this exact format:

{
    "verified": true,
    "confidence": 95,
    "evidence": "Short explanation of the actual code evidence."
}

The confidence must be a number from 0 to 100.
`;

    const response =
        await groq.chat.completions.create({

            model: "openai/gpt-oss-20b",

            messages: [
                {
                    role: "system",
                    content:
                        "You are a strict technical skill verification system."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],

            temperature: 0,

            response_format: {
                type: "json_schema",
                json_schema: {
                    name: "skill_verification",
                    strict: true,

                    schema: {
                        type: "object",

                        properties: {

                            verified: {
                                type: "boolean"
                            },

                            confidence: {
                                type: "number"
                            },

                            evidence: {
                                type: "string"
                            }

                        },

                        required: [
                            "verified",
                            "confidence",
                            "evidence"
                        ],

                        additionalProperties: false
                    }
                }
            }
        });

    const content =
        response.choices[0]?.message?.content;

    if (!content) {
        throw new Error(
            "Groq returned an empty response"
        );
    }

    return JSON.parse(content);
}


// ======================================================
// TEXT LIMIT
// ======================================================

function truncate(
    text,
    maxLength
) {

    if (!text) {
        return "";
    }

    if (text.length <= maxLength) {
        return text;
    }

    return text.substring(
        0,
        maxLength
    ) + "\n...[truncated]";
}


module.exports = {
    verifySkill
};