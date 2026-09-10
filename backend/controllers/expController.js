const db = require("../config/db");

// Add
const addExp = (req, res) => {
    const userId = req.user.user_id;

    const {
        experience_type,
        job_title,
        company_name,
        description,
        start_date,
        end_date,
        skill_ids
    } = req.body;

    const addsql = `
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
    `;

    db.query(
        addsql,
        [
            userId,
            experience_type,
            job_title,
            company_name,
            description,
            start_date,
            end_date || null
        ],
        (err, result) => {

            if (err) {
                console.error("ADD EXPERIENCE ERROR:", err);
                return res.status(500).json({
                    message: "Failed to add experience",
                    error: err.message
                });
            }

            const expId = result.insertId;

            if (!skill_ids || skill_ids.length === 0) {
                return res.status(201).json({
                    message: "Experience added successfully",
                    experience_id: expId
                });
            }

            const skillValues = skill_ids.map(skillId => [
                expId,
                skillId
            ]);

            const expskillsql = `
                INSERT INTO experience_skills
                (experience_id, skill_id)
                VALUES ?
            `;

            db.query(
                expskillsql,
                [skillValues],
                (err) => {

                    if (err) {
                        console.error(
                            "ADD EXPERIENCE SKILLS ERROR:",
                            err
                        );

                        return res.status(500).json({
                            message:
                                "Experience added but skills could not be added"
                        });
                    }

                    // Add source records
                    const sourceValues = skill_ids.map(skillId => [
                        userId,
                        skillId,
                        "experience",
                        expId
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

                    db.query(
                        sourceSql,
                        [sourceValues],
                        (err) => {

                            if (err) {
                                console.error(
                                    "ADD EXPERIENCE SOURCES ERROR:",
                                    err
                                );

                                return res.status(500).json({
                                    message:
                                        "Experience added but skill sources could not be added"
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

                            db.query(
                                userSkillsSql,
                                [userSkillValues],
                                (err) => {

                                    if (err) {
                                        console.error(
                                            "ADD EXPERIENCE USER SKILLS ERROR:",
                                            err
                                        );

                                        return res.status(500).json({
                                            message:
                                                "Experience added but user skills could not be updated"
                                        });
                                    }

                                    res.status(201).json({
                                        message:
                                            "Experience and skills added successfully",
                                        experience_id: expId
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


// Get
const getExp = (req, res) => {
    const userId = req.user.user_id;

    const getsql = `
        SELECT
            ue.*,
            COALESCE(
                GROUP_CONCAT(es.skill_id),
                ''
            ) AS skill_ids
        FROM user_experience ue
        LEFT JOIN experience_skills es
            ON ue.experience_id = es.experience_id
        WHERE ue.user_id = ?
        GROUP BY ue.experience_id
    `;

    db.query(getsql, [userId], (err, result) => {

        if (err) {
            return res.status(500).json({
                message: "Failed to get experience"
            });
        }

        const formattedResult = result.map(item => ({
            ...item,
            skill_ids: item.skill_ids
                ? item.skill_ids.split(",").map(Number)
                : []
        }));

        res.json(formattedResult);
    });
};


// Delete
const delExp = (req, res) => {
    const userId = req.user.user_id;
    const expId = req.params.id;

    // First get the skills connected to this experience
    const getSkillsSql = `
        SELECT skill_id
        FROM experience_skills
        WHERE experience_id = ?
    `;

    db.query(
        getSkillsSql,
        [expId],
        (err, skillRows) => {

            if (err) {
                console.error("GET EXPERIENCE SKILLS ERROR:", err);
                return res.status(500).json({
                    message: "Failed to delete experience"
                });
            }

            const oldSkillIds = skillRows.map(row => row.skill_id);

            // Remove source records
            const deleteSourcesSql = `
                DELETE FROM user_skill_sources
                WHERE user_id = ?
                AND source_type = 'experience'
                AND source_record_id = ?
            `;

            db.query(
                deleteSourcesSql,
                [userId, expId],
                (err) => {

                    if (err) {
                        console.error(
                            "DELETE EXPERIENCE SOURCES ERROR:",
                            err
                        );

                        return res.status(500).json({
                            message: "Failed to delete experience"
                        });
                    }

                    // Delete experience
                    const delsql = `
                        DELETE FROM user_experience
                        WHERE experience_id = ?
                        AND user_id = ?
                    `;

                    db.query(
                        delsql,
                        [expId, userId],
                        (err, result) => {

                            if (err) {
                                return res.status(500).json({
                                    message:
                                        "Failed to delete experience"
                                });
                            }

                            // Clean user_skills only when no other
                            // source still provides the skill
                            if (oldSkillIds.length === 0) {
                                return res.json({
                                    message:
                                        "Experience deleted successfully"
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
                                            "CLEAN EXPERIENCE SKILLS ERROR:",
                                            err
                                        );

                                        return res.status(500).json({
                                            message:
                                                "Experience deleted but skill cleanup failed"
                                        });
                                    }

                                    res.json({
                                        message:
                                            "Experience deleted successfully"
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


// Update
const putExp = (req, res) => {
    const userId = req.user.user_id;
    const expId = req.params.id;

    const {
        experience_type,
        job_title,
        company_name,
        description,
        start_date,
        end_date,
        skill_ids
    } = req.body;

    // First get old skills
    const getOldSkillsSql = `
        SELECT skill_id
        FROM experience_skills
        WHERE experience_id = ?
    `;

    db.query(
        getOldSkillsSql,
        [expId],
        (err, oldSkillRows) => {

            if (err) {
                console.error(
                    "GET OLD EXPERIENCE SKILLS ERROR:",
                    err
                );

                return res.status(500).json({
                    message: "Failed to update experience"
                });
            }

            const oldSkillIds = oldSkillRows.map(
                row => row.skill_id
            );

            // Update experience
            const putsql = `
                UPDATE user_experience
                SET
                    experience_type = ?,
                    job_title = ?,
                    company_name = ?,
                    description = ?,
                    start_date = ?,
                    end_date = ?
                WHERE experience_id = ?
                AND user_id = ?
            `;

            db.query(
                putsql,
                [
                    experience_type,
                    job_title,
                    company_name,
                    description,
                    start_date,
                    end_date || null,
                    expId,
                    userId
                ],
                (err) => {

                    if (err) {
                        return res.status(500).json({
                            message:
                                "Failed to update experience"
                        });
                    }

                    // Remove old experience skills
                    const deleteSkillsSql = `
                        DELETE FROM experience_skills
                        WHERE experience_id = ?
                    `;

                    db.query(
                        deleteSkillsSql,
                        [expId],
                        (err) => {

                            if (err) {
                                return res.status(500).json({
                                    message:
                                        "Failed to update experience skills"
                                });
                            }

                            // Remove old source records
                            const deleteSourcesSql = `
                                DELETE FROM user_skill_sources
                                WHERE user_id = ?
                                AND source_type = 'experience'
                                AND source_record_id = ?
                            `;

                            db.query(
                                deleteSourcesSql,
                                [userId, expId],
                                (err) => {

                                    if (err) {
                                        return res.status(500).json({
                                            message:
                                                "Failed to update experience sources"
                                        });
                                    }

                                    // Clean old user skills only if
                                    // no other source provides them
                                    const cleanupOldSkills = () => {

                                        if (oldSkillIds.length === 0) {
                                            return addNewSkills();
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
                                                        "CLEAN OLD EXPERIENCE SKILLS ERROR:",
                                                        err
                                                    );

                                                    return res.status(500).json({
                                                        message:
                                                            "Failed to clean old experience skills"
                                                    });
                                                }

                                                addNewSkills();
                                            }
                                        );
                                    };


                                    // Add new selected skills
                                    const addNewSkills = () => {

                                        if (
                                            !skill_ids ||
                                            skill_ids.length === 0
                                        ) {
                                            return res.json({
                                                message:
                                                    "Experience updated successfully"
                                            });
                                        }

                                        const values = skill_ids.map(
                                            skillId => [
                                                expId,
                                                skillId
                                            ]
                                        );

                                        const addSkillsSql = `
                                            INSERT INTO experience_skills
                                            (experience_id, skill_id)
                                            VALUES ?
                                        `;

                                        db.query(
                                            addSkillsSql,
                                            [values],
                                            (err) => {

                                                if (err) {
                                                    return res.status(500).json({
                                                        message:
                                                            "Failed to update experience skills"
                                                    });
                                                }

                                                // Add new source records
                                                const sourceValues =
                                                    skill_ids.map(
                                                        skillId => [
                                                            userId,
                                                            skillId,
                                                            "experience",
                                                            expId
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
                                                                    "Failed to update experience sources"
                                                            });
                                                        }

                                                        // Add to user_skills
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
                                                                        "Experience updated successfully"
                                                                });
                                                            }
                                                        );
                                                    }
                                                );
                                            }
                                        );
                                    };

                                    cleanupOldSkills();
                                }
                            );
                        }
                    );
                }
            );
        }
    );
};


module.exports = {
    addExp,
    getExp,
    delExp,
    putExp
};