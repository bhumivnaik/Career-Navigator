const axios = require("axios");
const db = require("../config/db");

const {
    detectTechnologies,
    skillCategoryMap
} = require("../utils/githubTechnologyDetector");


const GITHUB_API = "https://api.github.com";


// ============================================================
// GitHub headers
// ============================================================

const githubHeaders = () => {

    return {
        Accept: "application/vnd.github+json",

        "X-GitHub-Api-Version": "2026-03-10",

        ...(process.env.GITHUB_TOKEN
            ? {
                Authorization:
                    `Bearer ${process.env.GITHUB_TOKEN}`
            }
            : {})
    };
};


// ============================================================
// Get username from GitHub URL
// ============================================================

const extractUsername = (githubUrl) => {

    if (!githubUrl) {
        return null;
    }

    try {

        const url = new URL(githubUrl);

        if (url.hostname !== "github.com") {
            return null;
        }

        const parts = url.pathname
            .split("/")
            .filter(Boolean);

        return parts[0] || null;

    } catch (error) {

        return null;
    }
};


// ============================================================
// Get repositories
// ============================================================

const getRepositories = async (username) => {

    let page = 1;

    const repositories = [];

    while (true) {

        const response = await axios.get(
            `${GITHUB_API}/users/${username}/repos`,
            {
                headers: githubHeaders(),

                params: {
                    per_page: 100,
                    page: page,
                    type: "owner"
                }
            }
        );


        repositories.push(
            ...response.data
        );


        if (response.data.length < 100) {
            break;
        }

        page++;
    }


    return repositories;
};


// ============================================================
// Get repository languages
// ============================================================

const getRepositoryLanguages = async (
    owner,
    repo
) => {

    try {

        const response = await axios.get(
            `${GITHUB_API}/repos/${owner}/${repo}/languages`,
            {
                headers: githubHeaders()
            }
        );

        return response.data;

    } catch (error) {

        console.error(
            `Failed to get languages for ${repo}`
        );

        return {};
    }
};


// ============================================================
// Get repository file
// ============================================================

const getRepositoryFile = async (
    owner,
    repo,
    filePath
) => {

    try {

        const response = await axios.get(
            `${GITHUB_API}/repos/${owner}/${repo}/contents/${filePath}`,
            {
                headers: githubHeaders()
            }
        );


        if (
            response.data.type !== "file" ||
            !response.data.content
        ) {
            return null;
        }


        return Buffer
            .from(
                response.data.content,
                "base64"
            )
            .toString("utf-8");

    } catch (error) {

        // File doesn't exist
        if (
            error.response &&
            error.response.status === 404
        ) {
            return null;
        }

        console.error(
            `Failed to read ${filePath} from ${repo}`
        );

        return null;
    }
};


// ============================================================
// Find .csproj file
// ============================================================

const getCsprojFile = async (
    owner,
    repo
) => {

    try {

        const response = await axios.get(
            `${GITHUB_API}/repos/${owner}/${repo}/git/trees/HEAD`,
            {
                headers: githubHeaders(),

                params: {
                    recursive: 1
                }
            }
        );


        const csprojFile =
            response.data.tree.find(
                file =>
                    file.type === "blob" &&
                    file.path
                        .toLowerCase()
                        .endsWith(".csproj")
            );


        if (!csprojFile) {
            return null;
        }


        return await getRepositoryFile(
            owner,
            repo,
            csprojFile.path
        );

    } catch (error) {

        return null;
    }
};


// ============================================================
// Detect technologies in one repository
// ============================================================

const detectRepositoryTechnologies = async (owner, repo) => {

    const files = {};

    // package.json
    const packageJsonContent = await getRepositoryFile(
        owner,
        repo,
        "package.json"
    );

    if (packageJsonContent) {
        try {
            files.packageJson = JSON.parse(packageJsonContent);
        } catch (error) {
            console.error(`Invalid package.json in repository: ${repo}`);
            files.packageJson = null;
        }
    } else {
        files.packageJson = null;
    }

    // Python
    files.requirementsTxt = await getRepositoryFile(
        owner,
        repo,
        "requirements.txt"
    );

    // Flutter
    files.pubspecYaml = await getRepositoryFile(
        owner,
        repo,
        "pubspec.yaml"
    );

    // Java / Spring
    files.pomXml = await getRepositoryFile(
        owner,
        repo,
        "pom.xml"
    );

    // Android / Gradle
    files.buildGradle = await getRepositoryFile(
        owner,
        repo,
        "build.gradle"
    );

    // Rust
    files.cargoToml = await getRepositoryFile(
        owner,
        repo,
        "Cargo.toml"
    );

    // C# / .NET
    files.csproj = await getCsprojFile(
        owner,
        repo
    );

    // Detect technologies from all available files
    const technologies = detectTechnologies(files);

    console.log(
        `Detected technologies in ${repo}:`,
        technologies
    );

    return technologies;
};


// ============================================================
// Find or create skill
// ============================================================

const findOrCreateSkill = (
    skillName
) => {

    return new Promise(
        (resolve, reject) => {

            const selectSql = `
                SELECT skill_id, skill_name, category
                FROM skills
                WHERE skill_name = ?
            `;


            db.query(
                selectSql,
                [skillName],
                (err, result) => {

                    if (err) {
                        return reject(err);
                    }


                    if (result.length > 0) {

                        return resolve(
                            result[0]
                        );
                    }


                    const category =
                        skillCategoryMap[skillName]
                        || "Other";


                    const insertSql = `
                        INSERT INTO skills
                        (skill_name, category)
                        VALUES (?, ?)
                    `;


                    db.query(
                        insertSql,
                        [
                            skillName,
                            category
                        ],
                        (err, result) => {

                            if (err) {
                                return reject(err);
                            }


                            resolve({
                                skill_id:
                                    result.insertId,

                                skill_name:
                                    skillName,

                                category
                            });
                        }
                    );
                }
            );
        }
    );
};


// ============================================================
// Add skill to user
// ============================================================

const addSkillToUser = (
    userId,
    skillId
) => {

    return new Promise(
        (resolve, reject) => {

            const sql = `
                INSERT IGNORE INTO user_skills
                (user_id, skill_id)
                VALUES (?, ?)
            `;


            db.query(
                sql,
                [
                    userId,
                    skillId
                ],
                (err, result) => {

                    if (err) {
                        return reject(err);
                    }

                    resolve(result);
                }
            );
        }
    );
};


// ============================================================
// MAIN GITHUB SYNC
// ============================================================

const syncGithub = async (
    req,
    res
) => {

    try {

        const userId =
            req.user.user_id;


        // ----------------------------------------------------
        // Get GitHub URL from database
        // ----------------------------------------------------

        const userSql = `
            SELECT github_profile_url
            FROM users
            WHERE user_id = ?
        `;


        const userResult =
            await new Promise(
                (resolve, reject) => {

                    db.query(
                        userSql,
                        [userId],
                        (err, result) => {

                            if (err) {
                                reject(err);
                            } else {
                                resolve(result);
                            }
                        }
                    );
                }
            );


        if (
            userResult.length === 0 ||
            !userResult[0].github_profile_url
        ) {

            return res.status(400).json({
                message:
                    "GitHub profile URL is not added to your profile"
            });
        }


        const githubUrl =
            userResult[0].github_profile_url;


        const username =
            extractUsername(githubUrl);


        if (!username) {

            return res.status(400).json({
                message:
                    "Invalid GitHub profile URL"
            });
        }


        // ----------------------------------------------------
        // Get repositories
        // ----------------------------------------------------

        const repositories =
            await getRepositories(
                username
            );


        const detectedLanguages =
            new Set();

        const detectedTechnologies =
            new Set();
        const allowedLanguages = [
            "HTML",
            "CSS",
            "JavaScript",
            "TypeScript",
            "Python",
            "Java",
            "C++",
            "C#",
            "Dart",
            "Kotlin",
            "Rust",
            "Go"
        ];

        // ----------------------------------------------------
        // Analyze every repository
        // ----------------------------------------------------

        for (
            const repository
            of repositories
        ) {

            // Languages
            const languages =
                await getRepositoryLanguages(
                    username,
                    repository.name
                );




            Object.keys(languages)
                .forEach(language => {

                    if (allowedLanguages.includes(language)) {
                        detectedLanguages.add(language);
                    }

                });


            // Technologies
            const technologies =
                await detectRepositoryTechnologies(
                    username,
                    repository.name
                );


            technologies.forEach(
                technology => {

                    detectedTechnologies.add(
                        technology
                    );
                }
            );
        }


        // ----------------------------------------------------
        // Combine languages + technologies
        // ----------------------------------------------------

        const detectedSkills = [
            ...new Set([
                ...detectedLanguages,
                ...detectedTechnologies
            ])
        ];


        // ----------------------------------------------------
        // Add skills to master skills table
        // ----------------------------------------------------

        const skillRecords = [];


        for (
            const skillName
            of detectedSkills
        ) {

            const skill =
                await findOrCreateSkill(
                    skillName
                );


            skillRecords.push(skill);
        }


        // ----------------------------------------------------
        // Add skills to user's skills
        // ----------------------------------------------------

        for (
            const skill
            of skillRecords
        ) {

            await addSkillToUser(
                userId,
                skill.skill_id
            );
        }


        // ----------------------------------------------------
        // Save sync information
        // ----------------------------------------------------

        const syncSql = `
    INSERT INTO github_sync
    (
        user_id,
        github_username,
        repository_count,
        detected_languages,
        detected_technologies
    )
    VALUES (?, ?, ?, ?, ?)
`;


        await new Promise(
            (resolve, reject) => {

                db.query(
                    syncSql,
                    [
                        userId,
                        username,
                        repositories.length,
                        JSON.stringify([...detectedLanguages]),
                        JSON.stringify([...detectedTechnologies])
                    ],
                    (err, result) => {

                        if (err) {
                            reject(err);
                        } else {
                            resolve(result);
                        }
                    }
                );
            }
        );


        // ----------------------------------------------------
        // Response
        // ----------------------------------------------------

        res.json({

            message:
                "GitHub synchronized successfully",

            github_username:
                username,

            repositories:
                repositories.length,

            detected_languages:
                [...detectedLanguages],

            detected_technologies:
                [...detectedTechnologies],

            detected_skills:
                detectedSkills,

            added_skills:
                skillRecords.map(
                    skill =>
                        skill.skill_name
                )
        });


    } catch (error) {

        console.error(
            "GITHUB SYNC ERROR:",
            error
        );


        if (
            error.response &&
            error.response.status === 404
        ) {

            return res.status(404).json({
                message:
                    "GitHub user not found"
            });
        }


        res.status(500).json({
            message:
                "Failed to synchronize GitHub"
        });
    }
};

const getGithubSync = async (req, res) => {

    try {

        const userId = req.user.user_id;

        const sql = `
            SELECT
                sync_id,
                github_username,
                repository_count,
                detected_languages,
                detected_technologies,
                synced_at
            FROM github_sync
            WHERE user_id = ?
            ORDER BY synced_at DESC
            LIMIT 1
        `;

        db.query(
            sql,
            [userId],
            (err, result) => {

                if (err) {

                    console.error(
                        "GET GITHUB SYNC ERROR:",
                        err
                    );

                    return res.status(500).json({
                        message:
                            "Failed to fetch GitHub information"
                    });
                }


                if (result.length === 0) {

                    return res.json(null);
                }


                const sync = result[0];


                res.json({
                    sync_id: sync.sync_id,

                    github_username:
                        sync.github_username,

                    repository_count:
                        sync.repository_count,

                    detected_languages:
                        JSON.parse(
                            sync.detected_languages || "[]"
                        ),

                    detected_technologies:
                        JSON.parse(
                            sync.detected_technologies || "[]"
                        ),

                    synced_at:
                        sync.synced_at
                });
            }
        );

    } catch (error) {

        console.error(
            "GET GITHUB SYNC ERROR:",
            error
        );

        res.status(500).json({
            message:
                "Failed to fetch GitHub information"
        });
    }
};

module.exports = {
    syncGithub, getGithubSync
};