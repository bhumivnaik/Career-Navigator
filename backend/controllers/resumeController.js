const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { CanvasFactory } = require("pdf-parse/worker");
const { PDFParse } = require("pdf-parse");
const mammoth = require("mammoth");
const { GoogleGenAI } = require("@google/genai");

const db = require("../config/db");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const MODEL = "gemini-3.6-flash";

/* =========================================================
   UPLOAD CONFIGURATION
========================================================= */

const uploadDir = path.join(__dirname, "../uploads/resumes");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname);
        const filename = `resume_${req.user.user_id}_${Date.now()}${extension}`;

        cb(null, filename);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new Error("Only PDF and DOCX resume files are allowed."),
            false
        );
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

/* =========================================================
   DATABASE PROMISE HELPER
========================================================= */

const query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (error, results) => {
            if (error) {
                reject(error);
                return;
            }

            resolve(results);
        });
    });
};

/* =========================================================
   RESUME TEXT EXTRACTION
========================================================= */

const extractResumeText = async (filePath, mimetype) => {

    if (mimetype === "application/pdf") {

        const dataBuffer = fs.readFileSync(filePath);

        const parser = new PDFParse({
            data: dataBuffer,
            CanvasFactory
        });

        try {
            const result = await parser.getText();

            return result.text;
        } finally {
            await parser.destroy();
        }
    }

    if (
        mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {

        const result = await mammoth.extractRawText({
            path: filePath
        });

        return result.value;
    }

    throw new Error("Unsupported resume file type.");
};

/* =========================================================
   SKILL NORMALIZATION
========================================================= */

const normalizeSkillText = (value) => {
    if (!value) {
        return "";
    }

    return String(value)
        .toLowerCase()
        .replace(/\.js\b/g, "js")
        .replace(/\.ts\b/g, "ts")
        .replace(/\.net\b/g, "net")
        .replace(/c\+\+/g, "cpp")
        .replace(/c#/g, "csharp")
        .replace(/react\s*router\s*dom/g, "reactrouter")
        .replace(/react\s*router/g, "reactrouter")
        .replace(/react\s*js/g, "reactjs")
        .replace(/node\s*js/g, "nodejs")
        .replace(/express\s*js/g, "express")
        .replace(/next\s*js/g, "nextjs")
        .replace(/vue\s*js/g, "vuejs")
        .replace(/angular\s*js/g, "angular")
        .replace(/tailwind\s*css/g, "tailwindcss")
        .replace(/restful\s*api/g, "restapi")
        .replace(/rest\s*api/g, "restapi")
        .replace(/mysql\s*database/g, "mysql")
        .replace(/mongodb\s*database/g, "mongodb")
        .replace(/postgresql\s*database/g, "postgresql")
        .replace(/amazon\s*web\s*services/g, "aws")
        .replace(/google\s*cloud\s*platform/g, "gcp")
        .replace(/microsoft\s*azure/g, "azure")
        .replace(/hugging\s*face\s*transformers/g, "huggingfacetransformers")
        .replace(/machine\s*learning/g, "machinelearning")
        .replace(/deep\s*learning/g, "deeplearning")
        .replace(/natural\s*language\s*processing/g, "nlp")
        .replace(/artificial\s*intelligence/g, "ai")
        .replace(/large\s*language\s*models/g, "llms")
        .replace(/vector\s*database/g, "vectordatabases")
        .replace(/vector\s*databases/g, "vectordatabases")
        .replace(/visual\s*studio\s*code/g, "vscode")
        .replace(/visual\s*studio/g, "visualstudio")
        .replace(/source\s*control/g, "git")
        .replace(/version\s*control/g, "git")
        .replace(/[^a-z0-9]/g, "");
};

/* =========================================================
   EXPLICIT SKILL ALIASES
========================================================= */

const skillAliases = {
    "react.js": "ReactJS",
    "reactjs": "ReactJS",
    "react js": "ReactJS",

    "react router dom": "React Router",
    "react-router-dom": "React Router",
    "react router": "React Router",

    "node.js": "Node.js",
    "nodejs": "Node.js",
    "node js": "Node.js",

    "express.js": "Express.js",
    "expressjs": "Express.js",
    "express js": "Express.js",

    "next.js": "Next.js",
    "nextjs": "Next.js",

    "vue.js": "Vue.js",
    "vuejs": "Vue.js",

    "tailwind css": "Tailwind CSS",
    "tailwindcss": "Tailwind CSS",

    "rest api": "REST API",
    "restful api": "REST API",

    "machine learning": "Machine Learning",
    "deep learning": "Deep Learning",

    "artificial intelligence": "Artificial Intelligence",
    "ai": "Artificial Intelligence",

    "large language models": "LLMs",
    "large language model": "LLMs",
    "llm": "LLMs",
    "llms": "LLMs",

    "vector database": "Vector Databases",
    "vector databases": "Vector Databases",

    "hugging face transformers": "Hugging Face Transformers",

    "amazon web services": "AWS",
    "amazon aws": "AWS",

    "google cloud platform": "GCP",

    "natural language processing": "NLP",

    "visual studio code": "VS Code",

    "source control": "Git",
    "version control": "Git"
};

/* =========================================================
   MATCH AI SKILLS TO CANONICAL DATABASE SKILLS
========================================================= */

const matchSkillsToDatabase = (aiSkills, databaseSkills) => {

    const matched = [];
    const unmatched = [];

    const databaseByNormalizedName = new Map();

    for (const skill of databaseSkills) {

        const normalized = normalizeSkillText(skill.skill_name);

        if (normalized) {
            databaseByNormalizedName.set(
                normalized,
                skill
            );
        }
    }

    for (const rawSkill of aiSkills) {

        if (!rawSkill) {
            continue;
        }

        const originalName = String(rawSkill).trim();

        if (!originalName) {
            continue;
        }

        const aliasName =
            skillAliases[originalName.toLowerCase()] ||
            originalName;

        const normalized =
            normalizeSkillText(aliasName);

        const matchedSkill =
            databaseByNormalizedName.get(normalized);

        if (matchedSkill) {

            const alreadyAdded = matched.some(
                (item) => item.skill_id === matchedSkill.skill_id
            );

            if (!alreadyAdded) {

                matched.push({
                    skill_id: matchedSkill.skill_id,
                    skill_name: matchedSkill.skill_name,
                    detected_as: originalName
                });
            }

        } else {

            unmatched.push({
                skill_name: originalName
            });
        }
    }

    return {
        matched,
        unmatched
    };
};

/* =========================================================
   DATE HELPERS
========================================================= */

const normalizeDate = (value) => {

    if (!value) {
        return null;
    }

    const text = String(value).trim();

    if (!text) {
        return null;
    }

    // YYYY-MM-DD
    const fullDate = text.match(
        /^(\d{4})-(\d{1,2})-(\d{1,2})$/
    );

    if (fullDate) {

        const year = Number(fullDate[1]);
        const month = Number(fullDate[2]);
        const day = Number(fullDate[3]);

        if (
            month >= 1 &&
            month <= 12 &&
            day >= 1 &&
            day <= 31
        ) {
            return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        }
    }

    // DD/MM/YYYY
    const slashDate = text.match(
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
    );

    if (slashDate) {

        const day = Number(slashDate[1]);
        const month = Number(slashDate[2]);
        const year = Number(slashDate[3]);

        if (
            month >= 1 &&
            month <= 12 &&
            day >= 1 &&
            day <= 31
        ) {
            return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        }
    }

    // MM/YYYY
    const monthYear = text.match(
        /^(\d{1,2})\/(\d{4})$/
    );

    if (monthYear) {

        const month = Number(monthYear[1]);
        const year = Number(monthYear[2]);

        if (
            month >= 1 &&
            month <= 12
        ) {
            return `${year}-${String(month).padStart(2, "0")}-01`;
        }
    }

    // YYYY-MM
    const yearMonth = text.match(
        /^(\d{4})-(\d{1,2})$/
    );

    if (yearMonth) {

        const year = Number(yearMonth[1]);
        const month = Number(yearMonth[2]);

        if (
            month >= 1 &&
            month <= 12
        ) {
            return `${year}-${String(month).padStart(2, "0")}-01`;
        }
    }

    return null;
};

const normalizeYear = (value) => {

    if (!value) {
        return null;
    }

    const match = String(value).match(/\b(19|20)\d{2}\b/);

    if (!match) {
        return null;
    }

    return Number(match[0]);
};

/* =========================================================
   CLEAN AI OBJECT
========================================================= */

const cleanString = (value) => {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value).trim();
};

const cleanObject = (object) => {

    if (!object || typeof object !== "object") {
        return {};
    }

    const cleaned = {};

    for (const [key, value] of Object.entries(object)) {

        if (
            value !== null &&
            value !== undefined &&
            String(value).trim() !== ""
        ) {
            cleaned[key] = value;
        }
    }

    return cleaned;
};

/* =========================================================
   ANALYZE RESUME
   NO DATABASE PROFILE CHANGES HERE
========================================================= */

const analyzeResume = async (req, res) => {

    let uploadedFilePath = null;

    try {

        if (!req.file) {

            return res.status(400).json({
                message: "Please upload a PDF or DOCX resume."
            });
        }

        uploadedFilePath = req.file.path;

        /* ---------------------------------------------
           Extract resume text
        --------------------------------------------- */

        const resumeText = await extractResumeText(
            req.file.path,
            req.file.mimetype
        );

        if (
            !resumeText ||
            resumeText.trim().length < 50
        ) {

            return res.status(400).json({
                message:
                    "Could not extract enough text from the resume. Please upload a text-based PDF or DOCX file."
            });
        }

        const cleanedResumeText = resumeText
            .replace(/\r/g, "")
            .replace(/\n{3,}/g, "\n\n")
            .trim()
            .slice(0, 30000);

        /* ---------------------------------------------
           Gemini extraction
        --------------------------------------------- */

        const prompt = `
You are a resume information extraction system for a Career Navigator application.

Extract information ONLY if it is explicitly present in the resume.

NEVER invent or assume:
- skills
- companies
- job titles
- dates
- education
- projects
- courses
- certifications
- internships
- technologies
- achievements

Return ONLY valid JSON.

Use exactly this structure:

{
    "skills": [],
    "education": [],
    "projects": [],
    "experience": [],
    "internships": [],
    "courses": [],
    "certifications": []
}

Rules:

1. skills:
Extract technical and professional skills explicitly mentioned.

Return skills as strings.

2. education:
Extract education as objects using these possible fields:

{
    "degree": "",
    "field_of_study": "",
    "institution": "",
    "start_year": "",
    "end_year": ""
}

Only include values explicitly present.

3. projects:
Extract projects using:

{
    "project_name": "",
    "description": "",
    "technologies_used": "",
    "start_date": "",
    "end_date": ""
}

4. experience:
Extract full-time/job/work experience using:

{
    "job_title": "",
    "company_name": "",
    "description": "",
    "start_date": "",
    "end_date": ""
}

5. internships:
Extract internships separately using the same structure as experience:

{
    "job_title": "",
    "company_name": "",
    "description": "",
    "start_date": "",
    "end_date": ""
}

6. courses:
Extract completed courses, training programs, or learning programs using:

{
    "course_name": "",
    "provider": "",
    "description": "",
    "completion_date": "",
    "certificate_url": ""
}

7. certifications:
Extract professional or technical certifications using:

{
    "course_name": "",
    "provider": "",
    "description": "",
    "completion_date": "",
    "certificate_url": ""
}

8. Do not duplicate the same item unnecessarily.

9. If a category has no information, return an empty array.

10. Do not infer information that is not explicitly written.

11. Keep descriptions concise.

Resume text:

${cleanedResumeText}
`;

        const response = await ai.models.generateContent({
            model: MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });

        const responseText = response.text;

        if (!responseText) {
            throw new Error(
                "Gemini returned an empty response."
            );
        }

        let extractedData;

        try {

            extractedData = JSON.parse(responseText);

        } catch (error) {

            console.error(
                "Gemini returned invalid JSON:",
                responseText
            );

            throw new Error(
                "AI could not properly analyze the resume."
            );
        }

        /* ---------------------------------------------
           Load canonical skills
        --------------------------------------------- */

        const databaseSkills = await query(`
            SELECT
                skill_id,
                skill_name,
                category
            FROM skills
            ORDER BY skill_id
        `);

        const aiSkills =
            Array.isArray(extractedData.skills)
                ? extractedData.skills
                : [];

        const skillMatch =
            matchSkillsToDatabase(
                aiSkills,
                databaseSkills
            );

        /* ---------------------------------------------
           Existing user skills
        --------------------------------------------- */

        const existingUserSkills = await query(
            `
            SELECT
                us.skill_id,
                s.skill_name
            FROM user_skills us
            INNER JOIN skills s
                ON s.skill_id = us.skill_id
            WHERE us.user_id = ?
            `,
            [req.user.user_id]
        );

        const existingSkillIds = new Set(
            existingUserSkills.map(
                (item) => Number(item.skill_id)
            )
        );

        const matchedSkills =
            skillMatch.matched.map((skill) => ({
                ...skill,
                status: existingSkillIds.has(
                    Number(skill.skill_id)
                )
                    ? "existing"
                    : "new"
            }));

        /* ---------------------------------------------
           Normalize extracted sections
        --------------------------------------------- */

        const education =
            Array.isArray(extractedData.education)
                ? extractedData.education
                    .map(cleanObject)
                    .map((item) => ({
                        degree: cleanString(item.degree),
                        field_of_study: cleanString(
                            item.field_of_study
                        ),
                        institution: cleanString(
                            item.institution
                        ),
                        start_year:
                            normalizeYear(item.start_year),
                        end_year:
                            normalizeYear(item.end_year)
                    }))
                    .filter(
                        (item) => item.degree
                    )
                : [];

        const projects =
            Array.isArray(extractedData.projects)
                ? extractedData.projects
                    .map(cleanObject)
                    .map((item) => ({
                        project_name:
                            cleanString(
                                item.project_name ||
                                item.name
                            ),
                        description:
                            cleanString(
                                item.description
                            ),
                        technologies_used:
                            cleanString(
                                item.technologies_used ||
                                item.technologies
                            ),
                        start_date:
                            normalizeDate(
                                item.start_date
                            ),
                        end_date:
                            normalizeDate(
                                item.end_date
                            )
                    }))
                    .filter(
                        (item) => item.project_name
                    )
                : [];

        const experience =
            Array.isArray(extractedData.experience)
                ? extractedData.experience
                    .map(cleanObject)
                    .map((item) => ({
                        experience_type: "Job",
                        job_title:
                            cleanString(
                                item.job_title ||
                                item.title
                            ),
                        company_name:
                            cleanString(
                                item.company_name ||
                                item.company
                            ),
                        description:
                            cleanString(
                                item.description
                            ),
                        start_date:
                            normalizeDate(
                                item.start_date
                            ),
                        end_date:
                            normalizeDate(
                                item.end_date
                            )
                    }))
                    .filter(
                        (item) => item.job_title
                    )
                : [];

        const internships =
            Array.isArray(extractedData.internships)
                ? extractedData.internships
                    .map(cleanObject)
                    .map((item) => ({
                        experience_type:
                            "Internship",
                        job_title:
                            cleanString(
                                item.job_title ||
                                item.title
                            ),
                        company_name:
                            cleanString(
                                item.company_name ||
                                item.company
                            ),
                        description:
                            cleanString(
                                item.description
                            ),
                        start_date:
                            normalizeDate(
                                item.start_date
                            ),
                        end_date:
                            normalizeDate(
                                item.end_date
                            )
                    }))
                    .filter(
                        (item) => item.job_title
                    )
                : [];

        const courses =
            Array.isArray(extractedData.courses)
                ? extractedData.courses
                    .map(cleanObject)
                    .map((item) => ({
                        course_name:
                            cleanString(
                                item.course_name ||
                                item.name
                            ),
                        provider:
                            cleanString(
                                item.provider
                            ),
                        description:
                            cleanString(
                                item.description
                            ),
                        completion_date:
                            normalizeDate(
                                item.completion_date
                            ),
                        certificate_url:
                            cleanString(
                                item.certificate_url
                            )
                    }))
                    .filter(
                        (item) => item.course_name
                    )
                : [];

        const certifications =
            Array.isArray(
                extractedData.certifications
            )
                ? extractedData.certifications
                    .map(cleanObject)
                    .map((item) => ({
                        course_name:
                            cleanString(
                                item.course_name ||
                                item.name
                            ),
                        provider:
                            cleanString(
                                item.provider ||
                                item.issuing_organization
                            ),
                        description:
                            cleanString(
                                item.description
                            ),
                        completion_date:
                            normalizeDate(
                                item.completion_date
                            ),
                        certificate_url:
                            cleanString(
                                item.certificate_url
                            )
                    }))
                    .filter(
                        (item) => item.course_name
                    )
                : [];

        /* ---------------------------------------------
           Final review data
        --------------------------------------------- */

        return res.status(200).json({

            message:
                "Resume analyzed successfully.",

            filename:
                req.file.originalname,

            data: {

                skills: matchedSkills,

                unmatched_skills:
                    skillMatch.unmatched,

                education,

                projects,

                experience,

                internships,

                courses,

                certifications
            }
        });

    } catch (error) {

        console.error(
            "Resume analysis error:",
            error
        );

        return res.status(500).json({
            message:
                error.message ||
                "Failed to analyze resume."
        });

    } finally {

        if (
            uploadedFilePath &&
            fs.existsSync(uploadedFilePath)
        ) {

            try {
                fs.unlinkSync(uploadedFilePath);
            } catch (deleteError) {

                console.error(
                    "Could not delete temporary resume:",
                    deleteError
                );
            }
        }
    }
};

/* =========================================================
   DUPLICATE CHECK HELPERS
========================================================= */

const normalizeCompareText = (value) => {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
};

/* =========================================================
   IMPORT RESUME DATA
   DATABASE CHANGES HAPPEN ONLY HERE
========================================================= */

const importResume = async (req, res) => {

    const userId = req.user.user_id;

    const data = req.body || {};

    const skills =
        Array.isArray(data.skills)
            ? data.skills
            : [];

    const education =
        Array.isArray(data.education)
            ? data.education
            : [];

    const projects =
        Array.isArray(data.projects)
            ? data.projects
            : [];

    const experience =
        Array.isArray(data.experience)
            ? data.experience
            : [];

    const internships =
        Array.isArray(data.internships)
            ? data.internships
            : [];

    const courses =
        Array.isArray(data.courses)
            ? data.courses
            : [];

    const certifications =
        Array.isArray(data.certifications)
            ? data.certifications
            : [];

    const importedResults = {
        skills: [],
        education: [],
        projects: [],
        experience: [],
        internships: [],
        courses: [],
        certifications: []
    };

    const skippedResults = {
        skills: [],
        education: [],
        projects: [],
        experience: [],
        internships: [],
        courses: [],
        certifications: []
    };

    try {

        /* ---------------------------------------------
           Validate skills against canonical DB
        --------------------------------------------- */

        const validSkillIds = new Set();

        const allSkills = await query(`
            SELECT skill_id, skill_name
            FROM skills
        `);

        for (const skill of allSkills) {
            validSkillIds.add(
                Number(skill.skill_id)
            );
        }

        const validSkills = [];

        for (const skill of skills) {

            const skillId =
                Number(skill.skill_id);

            if (!validSkillIds.has(skillId)) {
                continue;
            }

            if (
                !validSkills.some(
                    (item) =>
                        Number(item.skill_id) === skillId
                )
            ) {
                validSkills.push({
                    skill_id: skillId,
                    skill_name:
                        cleanString(
                            skill.skill_name
                        )
                });
            }
        }

        /* ---------------------------------------------
           Start transaction
        --------------------------------------------- */

        await query("START TRANSACTION");

        /* ---------------------------------------------
           1. SKILLS
        --------------------------------------------- */

        for (const skill of validSkills) {

            const existing = await query(
                `
                SELECT user_skill_id
                FROM user_skills
                WHERE user_id = ?
                  AND skill_id = ?
                LIMIT 1
                `,
                [
                    userId,
                    skill.skill_id
                ]
            );

            if (existing.length > 0) {

                skippedResults.skills.push({
                    ...skill,
                    reason: "Already in profile"
                });

                continue;
            }

            await query(
                `
                INSERT INTO user_skills
                (
                    user_id,
                    skill_id
                )
                VALUES (?, ?)
                `,
                [
                    userId,
                    skill.skill_id
                ]
            );

            importedResults.skills.push(skill);
        }

        /* ---------------------------------------------
           2. EDUCATION
        --------------------------------------------- */

        for (const item of education) {

            const degree =
                cleanString(item.degree);

            if (!degree) {
                continue;
            }

            const institution =
                cleanString(item.institution);

            const startYear =
                normalizeYear(item.start_year);

            const endYear =
                normalizeYear(item.end_year);

            const existing = await query(
                `
                SELECT education_id
                FROM user_education
                WHERE user_id = ?
                  AND LOWER(degree) = LOWER(?)
                  AND LOWER(COALESCE(institution, '')) =
                      LOWER(COALESCE(?, ''))
                  AND COALESCE(start_year, 0) =
                      COALESCE(?, 0)
                  AND COALESCE(end_year, 0) =
                      COALESCE(?, 0)
                LIMIT 1
                `,
                [
                    userId,
                    degree,
                    institution,
                    startYear,
                    endYear
                ]
            );

            if (existing.length > 0) {

                skippedResults.education.push({
                    ...item,
                    reason: "Already in profile"
                });

                continue;
            }

            const result = await query(
                `
                INSERT INTO user_education
                (
                    user_id,
                    degree,
                    field_of_study,
                    institution,
                    start_year,
                    end_year
                )
                VALUES (?, ?, ?, ?, ?, ?)
                `,
                [
                    userId,
                    degree,
                    cleanString(
                        item.field_of_study
                    ) || null,
                    institution || null,
                    startYear,
                    endYear
                ]
            );

            importedResults.education.push({
                ...item,
                education_id:
                    result.insertId
            });
        }

        /* ---------------------------------------------
           3. PROJECTS
        --------------------------------------------- */

        for (const item of projects) {

            const projectName =
                cleanString(
                    item.project_name
                );

            if (!projectName) {
                continue;
            }

            const existing = await query(
                `
                SELECT project_id
                FROM user_projects
                WHERE user_id = ?
                  AND LOWER(project_name) = LOWER(?)
                LIMIT 1
                `,
                [
                    userId,
                    projectName
                ]
            );

            if (existing.length > 0) {

                skippedResults.projects.push({
                    ...item,
                    reason: "Already in profile"
                });

                continue;
            }

            const result = await query(
                `
                INSERT INTO user_projects
                (
                    user_id,
                    project_name,
                    description,
                    technologies_used,
                    start_date,
                    end_date
                )
                VALUES (?, ?, ?, ?, ?, ?)
                `,
                [
                    userId,
                    projectName,
                    cleanString(
                        item.description
                    ) || null,
                    cleanString(
                        item.technologies_used
                    ) || null,
                    normalizeDate(
                        item.start_date
                    ),
                    normalizeDate(
                        item.end_date
                    )
                ]
            );

            importedResults.projects.push({
                ...item,
                project_id:
                    result.insertId
            });
        }

        /* ---------------------------------------------
           4. EXPERIENCE
        --------------------------------------------- */

        const allExperience = [
            ...experience,
            ...internships.map((item) => ({
                ...item,
                experience_type: "Internship"
            }))
        ];

        for (const item of allExperience) {

            const experienceType =
                item.experience_type === "Internship"
                    ? "Internship"
                    : "Job";

            const jobTitle =
                cleanString(
                    item.job_title
                );

            if (!jobTitle) {
                continue;
            }

            const companyName =
                cleanString(
                    item.company_name
                );

            const startDate =
                normalizeDate(
                    item.start_date
                );

            const endDate =
                normalizeDate(
                    item.end_date
                );

            const existing = await query(
                `
                SELECT experience_id
                FROM user_experience
                WHERE user_id = ?
                  AND experience_type = ?
                  AND LOWER(job_title) = LOWER(?)
                  AND LOWER(COALESCE(company_name, '')) =
                      LOWER(COALESCE(?, ''))
                  AND COALESCE(start_date, '0000-00-00') =
                      COALESCE(?, '0000-00-00')
                LIMIT 1
                `,
                [
                    userId,
                    experienceType,
                    jobTitle,
                    companyName,
                    startDate
                ]
            );

            if (existing.length > 0) {

                const skippedItem = {
                    ...item,
                    reason: "Already in profile"
                };

                if (experienceType === "Internship") {
                    skippedResults.internships.push(
                        skippedItem
                    );
                } else {
                    skippedResults.experience.push(
                        skippedItem
                    );
                }

                continue;
            }

            const result = await query(
                `
                INSERT INTO user_experience
                (
                    user_id,
                    experience_type,
                    job_title,
                    company_name,
                    description,
                    start_date,
                    end_date
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    userId,
                    experienceType,
                    jobTitle,
                    companyName || null,
                    cleanString(
                        item.description
                    ) || null,
                    startDate,
                    endDate
                ]
            );

            const importedItem = {
                ...item,
                experience_type: experienceType,
                experience_id:
                    result.insertId
            };

            if (experienceType === "Internship") {
                importedResults.internships.push(
                    importedItem
                );
            } else {
                importedResults.experience.push(
                    importedItem
                );
            }
        }

        /* ---------------------------------------------
           5. COURSES
        --------------------------------------------- */

        for (const item of courses) {

            const courseName =
                cleanString(
                    item.course_name
                );

            if (!courseName) {
                continue;
            }

            const provider =
                cleanString(
                    item.provider
                );

            const existing = await query(
                `
                SELECT course_id
                FROM user_courses
                WHERE user_id = ?
                  AND LOWER(course_name) = LOWER(?)
                  AND LOWER(COALESCE(provider, '')) =
                      LOWER(COALESCE(?, ''))
                LIMIT 1
                `,
                [
                    userId,
                    courseName,
                    provider
                ]
            );

            if (existing.length > 0) {

                skippedResults.courses.push({
                    ...item,
                    reason: "Already in profile"
                });

                continue;
            }

            const result = await query(
                `
                INSERT INTO user_courses
                (
                    user_id,
                    course_name,
                    provider,
                    description,
                    completion_date,
                    certificate_url
                )
                VALUES (?, ?, ?, ?, ?, ?)
                `,
                [
                    userId,
                    courseName,
                    provider || null,
                    cleanString(
                        item.description
                    ) || null,
                    normalizeDate(
                        item.completion_date
                    ),
                    cleanString(
                        item.certificate_url
                    ) || null
                ]
            );

            importedResults.courses.push({
                ...item,
                course_id:
                    result.insertId
            });
        }

        /* ---------------------------------------------
           6. CERTIFICATIONS
           Stored inside user_courses
        --------------------------------------------- */

        for (const item of certifications) {

            const courseName =
                cleanString(
                    item.course_name
                );

            if (!courseName) {
                continue;
            }

            const provider =
                cleanString(
                    item.provider
                );

            const existing = await query(
                `
                SELECT course_id
                FROM user_courses
                WHERE user_id = ?
                  AND LOWER(course_name) = LOWER(?)
                  AND LOWER(COALESCE(provider, '')) =
                      LOWER(COALESCE(?, ''))
                LIMIT 1
                `,
                [
                    userId,
                    courseName,
                    provider
                ]
            );

            if (existing.length > 0) {

                skippedResults.certifications.push({
                    ...item,
                    reason: "Already in profile"
                });

                continue;
            }

            const result = await query(
                `
                INSERT INTO user_courses
                (
                    user_id,
                    course_name,
                    provider,
                    description,
                    completion_date,
                    certificate_url
                )
                VALUES (?, ?, ?, ?, ?, ?)
                `,
                [
                    userId,
                    courseName,
                    provider || null,
                    cleanString(
                        item.description
                    ) || null,
                    normalizeDate(
                        item.completion_date
                    ),
                    cleanString(
                        item.certificate_url
                    ) || null
                ]
            );

            importedResults.certifications.push({
                ...item,
                course_id:
                    result.insertId
            });
        }

        /* ---------------------------------------------
           COMMIT
        --------------------------------------------- */

        await query("COMMIT");

        return res.status(200).json({

            message:
                "Resume data imported successfully.",

            imported: importedResults,

            skipped: skippedResults
        });

    } catch (error) {

        console.error(
            "Resume import error:",
            error
        );

        try {
            await query("ROLLBACK");
        } catch (rollbackError) {
            console.error(
                "Rollback failed:",
                rollbackError
            );
        }

        return res.status(500).json({
            message:
                error.message ||
                "Failed to import resume data."
        });
    }
};

/* =========================================================
   MULTER MIDDLEWARE
========================================================= */

const uploadResume = (req, res, next) => {

    upload.single("resume")(
        req,
        res,
        (error) => {

            if (error) {

                if (
                    error instanceof
                    multer.MulterError
                ) {

                    if (
                        error.code ===
                        "LIMIT_FILE_SIZE"
                    ) {

                        return res.status(400).json({
                            message:
                                "Resume file is too large. Maximum size is 5 MB."
                        });
                    }

                    return res.status(400).json({
                        message: error.message
                    });
                }

                return res.status(400).json({
                    message:
                        error.message ||
                        "Failed to upload resume."
                });
            }

            next();
        }
    );
};

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
    uploadResume,
    analyzeResume,
    importResume
};