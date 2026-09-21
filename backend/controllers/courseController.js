const axios = require("axios");
const cheerio = require("cheerio");

const db = require("../config/db");

//Add
const addCourse = (req, res) => {
    const userId = req.user.user_id;
    const { course_name, provider, description, completion_date, certificate_url, skill_ids } = req.body;

    const addsql = `insert into user_courses (user_id, course_name, provider, description, completion_date, certificate_url)
    values (?,?,?,?,?,?)`;

    db.query(addsql, [userId, course_name, provider, description, completion_date, certificate_url],
        async (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Failed to add course" });
            }

            const courseId = result.insertId;
            if (!skill_ids || skill_ids.length === 0) {
                return res.status(201).json({
                    message: "Course added successfully",
                    course_id: courseId
                });
            }

            const courseskillsql = `insert into course_skills (course_id, skill_id) values ?`;
            const skillValues = skill_ids.map(skillId =>
                [courseId, skillId]
            );

            db.query(courseskillsql, [skillValues], (err) => {

                if (err) {
                    return res.status(500).json({
                        message: "Course added but skills could not be added"
                    });
                }

                // Add source records
                const sourceValues = skill_ids.map(skillId => [
                    userId,
                    skillId,
                    "course",
                    courseId
                ]);

                const sourceSql = `
        INSERT IGNORE INTO user_skill_sources
        (
            user_id,
            skill_id,
            source_type,
            source_record_id
        )
        VALUES ?
    `;

                db.query(sourceSql, [sourceValues], (err) => {

                    if (err) {
                        console.error(
                            "ADD COURSE SOURCES ERROR:",
                            err
                        );

                        return res.status(500).json({
                            message:
                                "Course added but skill sources could not be added"
                        });
                    }

                    // Add skills to user_skills
                    const userSkillValues = skill_ids.map(skillId => [
                        userId,
                        skillId
                    ]);

                    const userSkillsSql = `
            INSERT IGNORE INTO user_skills
            (user_id, skill_id)
            VALUES ?
        `;

                    db.query(userSkillsSql, [userSkillValues], (err) => {

                        if (err) {
                            console.error(
                                "ADD COURSE USER SKILLS ERROR:",
                                err
                            );

                            return res.status(500).json({
                                message:
                                    "Course added but user skills could not be updated"
                            });
                        }

                        res.status(201).json({
                            message:
                                "Course and skills added successfully",
                            course_id: courseId
                        });

                    });

                });

            });
        }
    )
}

//Get
const getCourse = (req, res) => {
    const userId = req.user.user_id;

    const getsql = `
    SELECT
        uc.*,
        COALESCE(
            GROUP_CONCAT(cs.skill_id),
            ''
        ) AS skill_ids
    FROM user_courses uc
    LEFT JOIN course_skills cs
        ON uc.course_id = cs.course_id
    WHERE uc.user_id = ?
    GROUP BY uc.course_id
`;

    db.query(getsql, [userId], (err, result) => {

        if (err) {
            console.error("GET COURSE ERROR:", err);

            return res.status(500).json({
                message: "Failed to get course"
            });
        }

        const formattedResult = result.map(course => ({
            ...course,
            skill_ids: course.skill_ids
                ? course.skill_ids.split(",").map(Number)
                : []
        }));

        res.json(formattedResult);
    });

}

//Delete
// Delete
const delCourse = (req, res) => {

    const userId = req.user.user_id;
    const courseId = req.params.id;

    // Get skills belonging to this course
    const getSkillsSql = `
        SELECT skill_id
        FROM course_skills
        WHERE course_id = ?
    `;

    db.query(
        getSkillsSql,
        [courseId],
        (err, skillRows) => {

            if (err) {
                console.error("GET COURSE SKILLS ERROR:", err);

                return res.status(500).json({
                    message: "Failed to delete course"
                });
            }

            const oldSkillIds = skillRows.map(
                row => row.skill_id
            );

            // Delete skill source records
            const deleteSourcesSql = `
                DELETE FROM user_skill_sources
                WHERE user_id = ?
                AND source_type = 'course'
                AND source_record_id = ?
            `;

            db.query(
                deleteSourcesSql,
                [userId, courseId],
                (err) => {

                    if (err) {
                        console.error(
                            "DELETE COURSE SOURCES ERROR:",
                            err
                        );

                        return res.status(500).json({
                            message: "Failed to delete course"
                        });
                    }

                    // Delete course
                    const delsql = `
                        DELETE FROM user_courses
                        WHERE course_id = ?
                        AND user_id = ?
                    `;

                    db.query(
                        delsql,
                        [courseId, userId],
                        (err) => {

                            if (err) {
                                return res.status(500).json({
                                    message:
                                        "Failed to delete course"
                                });
                            }

                            // Remove skills from user_skills
                            // only if no other source provides them
                            if (oldSkillIds.length === 0) {
                                return res.json({
                                    message:
                                        "Course deleted successfully"
                                });
                            }

                            const cleanupSql = `
                                DELETE FROM user_skills
                                WHERE user_id = ?
                                AND skill_id IN (?)
                                AND NOT EXISTS (
                                    SELECT 1
                                    FROM user_skill_sources
                                    WHERE user_skill_sources.user_id = ?
                                    AND user_skill_sources.skill_id =
                                        user_skills.skill_id
                                )
                            `;

                            db.query(
                                cleanupSql,
                                [
                                    userId,
                                    oldSkillIds,
                                    userId
                                ],
                                (err) => {

                                    if (err) {
                                        console.error(
                                            "CLEAN COURSE SKILLS ERROR:",
                                            err
                                        );

                                        return res.status(500).json({
                                            message:
                                                "Course deleted but skill cleanup failed"
                                        });
                                    }

                                    res.json({
                                        message:
                                            "Course deleted successfully"
                                    });

                                }
                            );

                        }
                    );

                }
            );

        }
    );
};

//Update
// Update
const putCourse = (req, res) => {

    const userId = req.user.user_id;
    const courseId = req.params.id;

    const {
        course_name,
        provider,
        description,
        completion_date,
        certificate_url,
        skill_ids
    } = req.body;

    // Get old skills first
    const getOldSkillsSql = `
        SELECT cs.skill_id
        FROM course_skills cs
        JOIN user_courses uc
            ON cs.course_id = uc.course_id
        WHERE cs.course_id = ?
        AND uc.user_id = ?
    `;

    db.query(
        getOldSkillsSql,
        [courseId, userId],
        (err, oldSkillRows) => {

            if (err) {
                console.error(
                    "GET OLD COURSE SKILLS ERROR:",
                    err
                );

                return res.status(500).json({
                    message: "Failed to update course"
                });
            }

            const oldSkillIds = oldSkillRows.map(
                row => row.skill_id
            );

            // Update course details
            const putsql = `
                UPDATE user_courses
                SET
                    course_name = ?,
                    provider = ?,
                    description = ?,
                    completion_date = ?,
                    certificate_url = ?
                WHERE course_id = ?
                AND user_id = ?
            `;

            db.query(
                putsql,
                [
                    course_name,
                    provider,
                    description,
                    completion_date,
                    certificate_url,
                    courseId,
                    userId
                ],
                (err) => {

                    if (err) {
                        return res.status(500).json({
                            message:
                                "Failed to update course"
                        });
                    }

                    // Remove old course skills
                    const deleteSkillsSql = `
                        DELETE FROM course_skills
                        WHERE course_id = ?
                    `;

                    db.query(
                        deleteSkillsSql,
                        [courseId],
                        (err) => {

                            if (err) {
                                return res.status(500).json({
                                    message:
                                        "Failed to update course skills"
                                });
                            }

                            // Remove old source records
                            const deleteSourcesSql = `
                                DELETE FROM user_skill_sources
                                WHERE user_id = ?
                                AND source_type = 'course'
                                AND source_record_id = ?
                            `;

                            db.query(
                                deleteSourcesSql,
                                [userId, courseId],
                                (err) => {

                                    if (err) {
                                        return res.status(500).json({
                                            message:
                                                "Failed to update course sources"
                                        });
                                    }

                                    // Clean old user skills
                                    const addNewSkills = () => {

                                        if (
                                            !skill_ids ||
                                            skill_ids.length === 0
                                        ) {
                                            return res.json({
                                                message:
                                                    "Course updated successfully"
                                            });
                                        }

                                        const values =
                                            skill_ids.map(
                                                skillId => [
                                                    courseId,
                                                    skillId
                                                ]
                                            );

                                        // Add new course skills
                                        const addSkillsSql = `
                                            INSERT INTO course_skills
                                            (course_id, skill_id)
                                            VALUES ?
                                        `;

                                        db.query(
                                            addSkillsSql,
                                            [values],
                                            (err) => {

                                                if (err) {
                                                    return res.status(500).json({
                                                        message:
                                                            "Failed to update course skills"
                                                    });
                                                }

                                                // Add new source records
                                                const sourceValues =
                                                    skill_ids.map(
                                                        skillId => [
                                                            userId,
                                                            skillId,
                                                            "course",
                                                            courseId
                                                        ]
                                                    );

                                                const sourceSql = `
                                                    INSERT IGNORE INTO user_skill_sources
                                                    (
                                                        user_id,
                                                        skill_id,
                                                        source_type,
                                                        source_record_id
                                                    )
                                                    VALUES ?
                                                `;

                                                db.query(
                                                    sourceSql,
                                                    [sourceValues],
                                                    (err) => {

                                                        if (err) {
                                                            return res.status(500).json({
                                                                message:
                                                                    "Failed to update course sources"
                                                            });
                                                        }

                                                        // Add new user skills
                                                        const userSkillValues =
                                                            skill_ids.map(
                                                                skillId => [
                                                                    userId,
                                                                    skillId
                                                                ]
                                                            );

                                                        const userSkillsSql = `
                                                            INSERT IGNORE INTO user_skills
                                                            (user_id, skill_id)
                                                            VALUES ?
                                                        `;

                                                        db.query(
                                                            userSkillsSql,
                                                            [userSkillValues],
                                                            (err) => {

                                                                if (err) {
                                                                    return res.status(500).json({
                                                                        message:
                                                                            "Failed to update user skills"
                                                                    });
                                                                }

                                                                res.json({
                                                                    message:
                                                                        "Course updated successfully"
                                                                });

                                                            }
                                                        );

                                                    }
                                                );

                                            }
                                        );

                                    };

                                    // No old skills
                                    if (
                                        oldSkillIds.length === 0
                                    ) {
                                        return addNewSkills();
                                    }

                                    // Remove old user skills only
                                    // when no other source provides them
                                    const cleanupSql = `
                                        DELETE FROM user_skills
                                        WHERE user_id = ?
                                        AND skill_id IN (?)
                                        AND NOT EXISTS (
                                            SELECT 1
                                            FROM user_skill_sources
                                            WHERE user_skill_sources.user_id = ?
                                            AND user_skill_sources.skill_id =
                                                user_skills.skill_id
                                        )
                                    `;

                                    db.query(
                                        cleanupSql,
                                        [
                                            userId,
                                            oldSkillIds,
                                            userId
                                        ],
                                        (err) => {

                                            if (err) {
                                                console.error(
                                                    "CLEAN OLD COURSE SKILLS ERROR:",
                                                    err
                                                );

                                                return res.status(500).json({
                                                    message:
                                                        "Failed to clean old course skills"
                                                });
                                            }

                                            addNewSkills();

                                        }
                                    );

                                }
                            );

                        }
                    );

                }
            );

        }
    );
};




// ===============================
// IMPORT CREDLY CREDENTIAL
// ===============================

const importCredlyCredential = async (req, res) => {

    try {
        const userId = req.user.user_id;

        const { url } = req.body;

        if (!url) {
            return res.status(400).json({
                message: "Credly URL is required"
            });
        }


        // Check that it is actually a Credly URL
        let parsedUrl;

        try {
            parsedUrl = new URL(url);
        } catch (error) {
            return res.status(400).json({
                message: "Invalid URL"
            });
        }


        if (
            parsedUrl.hostname !== "www.credly.com" &&
            parsedUrl.hostname !== "credly.com"
        ) {
            return res.status(400).json({
                message: "Please provide a valid Credly URL"
            });
        }


        // Fetch public Credly page
        const response = await axios.get(url, {
            timeout: 10000,
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36"
            }
        });


        const html = response.data;

        const $ = cheerio.load(html);


        let credential = {
            name: "",
            issuer: "",
            recipientName: "",
            description: "",
            issuedDate: "",
            expiryDate: "",
            credentialType: "",
            level: "",
            imageUrl: "",
            skills: []
        };


        // =====================================
        // 1. Try JSON-LD structured data
        // =====================================

        $('script[type="application/ld+json"]').each(
            (index, element) => {

                try {

                    const jsonText = $(element).html();

                    if (!jsonText) {
                        return;
                    }

                    const data = JSON.parse(jsonText);

                    const objects = Array.isArray(data)
                        ? data
                        : [data];


                    for (const item of objects) {

                        if (
                            !credential.name &&
                            item.name
                        ) {
                            credential.name = item.name;
                        }

                        if (
                            !credential.description &&
                            item.description
                        ) {
                            credential.description =
                                item.description;
                        }

                        if (
                            !credential.issuer &&
                            item.issuer
                        ) {

                            if (
                                typeof item.issuer === "string"
                            ) {
                                credential.issuer =
                                    item.issuer;
                            } else {
                                credential.issuer =
                                    item.issuer.name || "";
                            }
                        }

                    }

                } catch (error) {
                    // Ignore invalid JSON-LD
                }

            }
        );


        // =====================================
        // 2. Meta tags
        // =====================================

        const metaTitle =
            $('meta[property="og:title"]').attr("content");

        const metaDescription =
            $('meta[property="og:description"]').attr("content");

        const metaImage =
            $('meta[property="og:image"]').attr("content");


        if (!credential.name && metaTitle) {
            credential.name = metaTitle;
        }

        if (
            !credential.description &&
            metaDescription
        ) {
            credential.description =
                metaDescription;
        }

        if (metaImage) {
            credential.imageUrl = metaImage;
        }


        // =====================================
        // 3. Page title fallback
        // =====================================

        if (!credential.name) {

            credential.name =
                $("title").first().text().trim();

        }


        // =====================================
        // 4. Extract visible text
        // =====================================

        const pageText = $("body")
            .text()
            .replace(/\s+/g, " ")
            .trim();


        // =====================================
        // 5. Recipient / Earner
        // =====================================

        // =====================================
        // 5. Recipient / Earner
        // =====================================

        const ogTitle =
            $('meta[property="og:title"]').attr("content");

        if (ogTitle) {

            const recipientMatch =
                ogTitle.match(
                    /was issued by .+? to (.+?)\.$/i
                );

            if (recipientMatch) {
                credential.recipientName =
                    recipientMatch[1].trim();
            }
        }

        // =====================================
        // 5. Issuer
        // =====================================
        if (!credential.issuer) {
            const issuedByMatch =
                pageText.match(
                    /Issued by\s+(.+?)(?=\s+(Skills|Type|Level|Time|Cost|Earning Criteria)|$)/i
                );

            if (issuedByMatch) {
                credential.issuer =
                    issuedByMatch[1].trim();
            }
        }


        // =====================================
        // 6. Type
        // =====================================

        const typeMatch =
            pageText.match(
                /Type\s+([A-Za-z ]+?)(?=\s+(Level|Time|Cost|Skills|Earning Criteria)|$)/i
            );

        if (typeMatch) {
            credential.credentialType =
                typeMatch[1].trim();
        }


        // =====================================
        // 7. Level
        // =====================================

        const levelMatch =
            pageText.match(
                /Level\s+([A-Za-z ]+?)(?=\s+(Time|Cost|Skills|Earning Criteria)|$)/i
            );

        if (levelMatch) {
            credential.level =
                levelMatch[1].trim();
        }


        // =====================================
        // 8. Find issued date
        // =====================================

        const issuedMatch =
            pageText.match(
                /Issued\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})/i
            );

        if (issuedMatch) {
            credential.issuedDate =
                issuedMatch[1];
        }


        // =====================================
        // 9. Find expiry date
        // =====================================

        const expiryMatch =
            pageText.match(
                /Expires\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})/i
            );

        if (expiryMatch) {
            credential.expiryDate =
                expiryMatch[1];
        }


        // =====================================
        // 10. Extract skills
        // =====================================

        const skills = [];

        $("a").each((index, element) => {

            const text =
                $(element)
                    .text()
                    .trim();

            if (!text) {
                return;
            }

            const href =
                $(element).attr("href") || "";

            if (
                href.includes("/skills/") &&
                !skills.includes(text)
            ) {
                skills.push(text);
            }

        });

        credential.skills = skills;


        // =====================================
        // Check if we actually found something
        // =====================================

        if (!credential.name) {

            return res.status(422).json({
                message:
                    "Could not extract credential information from this Credly page. Make sure the badge is public."
            });

        }

        const userSql = `
    SELECT full_name
    FROM users
    WHERE user_id = ?
`;

        const [user] = await new Promise((resolve, reject) => {

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

        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        console.log("CREDLY RECIPIENT:", credential.recipientName);
        console.log("USER NAME:", user.full_name);

        if (!credential.recipientName) {
            return res.status(422).json({
                message:
                    "Could not verify the badge recipient. Make sure the Credly badge is public and contains recipient information."
            });
        }

        const normalizeName = (name) =>
            name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

        if (
            normalizeName(credential.recipientName) !==
            normalizeName(user.full_name)
        ) {
            return res.status(403).json({
                message:
                    "This Credly credential does not appear to belong to your Career Navigator account."
            });
        }
        // =====================================
        // Return extracted data
        // =====================================

        res.json({
            success: true,
            credential: {
                ...credential,
                credentialUrl: url
            }
        });


    } catch (error) {

        console.error(
            "CREDLY IMPORT ERROR:",
            error.message
        );


        if (
            error.response &&
            error.response.status === 404
        ) {
            return res.status(404).json({
                message:
                    "Credly credential not found."
            });
        }


        return res.status(500).json({
            message:
                "Unable to read the Credly credential. Make sure the badge is public and the URL is correct."
        });

    }

};

module.exports = { addCourse, getCourse, delCourse, putCourse, importCredlyCredential };