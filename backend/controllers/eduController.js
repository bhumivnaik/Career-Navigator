const db = require("../config/db");

// =========================
// Add Education
// =========================
const addEdu = (req, res) => {

    const userId = req.user.user_id;

    const {
        degree,
        field_of_study,
        institution,
        start_year,
        end_year,
        skill_ids
    } = req.body;

    const addsql = `
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
    `;

    db.query(
        addsql,
        [
            userId,
            degree,
            field_of_study,
            institution,
            start_year,
            end_year
        ],
        (err, result) => {

            if (err) {
                console.error("ADD EDUCATION ERROR:", err);

                return res.status(500).json({
                    message: "Failed to add education"
                });
            }

            const eduId = result.insertId;

            // No skills selected
            if (!Array.isArray(skill_ids) || skill_ids.length === 0) {

                return res.status(201).json({
                    message: "Education added successfully",
                    education_id: eduId
                });

            }

            // Add education → skill relationships
            const eduskillsql = `
                INSERT INTO education_skills
                (education_id, skill_id)
                VALUES ?
            `;

            const skillValues = skill_ids.map(skillId => [
                eduId,
                skillId
            ]);

            db.query(
                eduskillsql,
                [skillValues],
                (err) => {

                    if (err) {

                        console.error(
                            "ADD EDUCATION SKILLS ERROR:",
                            err
                        );

                        return res.status(500).json({
                            message:
                                "Education added but skills could not be added"
                        });

                    }

                    // Record where each skill came from
                    const sourceValues = skill_ids.map(skillId => [
                        userId,
                        skillId,
                        "education",
                        eduId
                    ]);

                    const sourceSql = `
                        INSERT INTO user_skill_sources
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
                                    "ADD EDUCATION SOURCES ERROR:",
                                    err
                                );

                                return res.status(500).json({
                                    message:
                                        "Education added but skill sources could not be recorded"
                                });

                            }

                            // Add skills to user's acquired skill list
                            const userSkillValues = skill_ids.map(
                                skillId => [
                                    userId,
                                    skillId
                                ]
                            );

                            const userSkillSql = `
                                INSERT IGNORE INTO user_skills
                                (
                                    user_id,
                                    skill_id
                                )
                                VALUES ?
                            `;

                            db.query(
                                userSkillSql,
                                [userSkillValues],
                                (err) => {

                                    if (err) {

                                        console.error(
                                            "ADD USER SKILLS ERROR:",
                                            err
                                        );

                                        return res.status(500).json({
                                            message:
                                                "Education added but skills could not be added to user skills"
                                        });

                                    }

                                    res.status(201).json({
                                        message:
                                            "Education and skills added successfully",
                                        education_id: eduId
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


// =========================
// Get Education
// =========================
const getEdu = (req, res) => {

    const userId = req.user.user_id;

    const getsql = `
        SELECT
            ue.*,
            COALESCE(
                GROUP_CONCAT(es.skill_id),
                ''
            ) AS skill_ids
        FROM user_education ue

        LEFT JOIN education_skills es
            ON ue.education_id = es.education_id

        WHERE ue.user_id = ?

        GROUP BY ue.education_id
    `;

    db.query(
        getsql,
        [userId],
        (err, result) => {

            if (err) {

                console.error(
                    "GET EDUCATION ERROR:",
                    err
                );

                return res.status(500).json({
                    message: "Failed to get education"
                });

            }

            const formattedResult = result.map(item => ({

                ...item,

                skill_ids: item.skill_ids
                    ? item.skill_ids
                        .split(",")
                        .map(Number)
                    : []

            }));

            res.json(formattedResult);

        }
    );
};


// =========================
// Delete Education
// =========================
const delEdu = (req, res) => {

    const userId = req.user.user_id;
    const eduId = req.params.id;

    // First remove source tracking
    const deleteSourcesSql = `
        DELETE FROM user_skill_sources
        WHERE user_id = ?
        AND source_type = 'education'
        AND source_record_id = ?
    `;

    db.query(
        deleteSourcesSql,
        [userId, eduId],
        (err) => {

            if (err) {

                console.error(
                    "DELETE EDUCATION SOURCES ERROR:",
                    err
                );

                return res.status(500).json({
                    message:
                        "Failed to remove education skill sources"
                });

            }

            // Delete education itself
            const delsql = `
                DELETE FROM user_education
                WHERE education_id = ?
                AND user_id = ?
            `;

            db.query(
                delsql,
                [eduId, userId],
                (err) => {

                    if (err) {

                        console.error(
                            "DELETE EDUCATION ERROR:",
                            err
                        );

                        return res.status(500).json({
                            message:
                                "Failed to delete education"
                        });

                    }

                    res.json({
                        message:
                            "Education deleted successfully"
                    });

                }
            );

        }
    );
};


// =========================
// Update Education
// =========================
const putEdu = (req, res) => {

    const userId = req.user.user_id;
    const eduId = req.params.id;

    const {
        degree,
        field_of_study,
        institution,
        start_year,
        end_year,
        skill_ids
    } = req.body;


    // Get old skills before replacing them
    const getOldSkillsSql = `
        SELECT skill_id
        FROM user_skill_sources
        WHERE user_id = ?
        AND source_type = 'education'
        AND source_record_id = ?
    `;

    db.query(
        getOldSkillsSql,
        [userId, eduId],
        (err, oldSkills) => {

            if (err) {
                console.error(
                    "GET OLD EDUCATION SKILLS ERROR:",
                    err
                );

                return res.status(500).json({
                    message:
                        "Failed to get old education skills"
                });
            }


            const oldSkillIds = oldSkills.map(
                skill => skill.skill_id
            );


            // Update education details
            const putsql = `
                UPDATE user_education

                SET
                    degree = ?,
                    field_of_study = ?,
                    institution = ?,
                    start_year = ?,
                    end_year = ?

                WHERE education_id = ?
                AND user_id = ?
            `;

            db.query(
                putsql,
                [
                    degree,
                    field_of_study,
                    institution,
                    start_year,
                    end_year,
                    eduId,
                    userId
                ],
                (err) => {

                    if (err) {
                        console.error(
                            "UPDATE EDUCATION ERROR:",
                            err
                        );

                        return res.status(500).json({
                            message:
                                "Failed to update education"
                        });
                    }


                    // Remove old education → skill relationships
                    const deleteSkillsSql = `
                        DELETE FROM education_skills
                        WHERE education_id = ?
                    `;

                    db.query(
                        deleteSkillsSql,
                        [eduId],
                        (err) => {

                            if (err) {
                                console.error(
                                    "DELETE EDUCATION SKILLS ERROR:",
                                    err
                                );

                                return res.status(500).json({
                                    message:
                                        "Failed to update education skills"
                                });
                            }


                            // Remove old source records
                            const deleteSourcesSql = `
                                DELETE FROM user_skill_sources

                                WHERE user_id = ?

                                AND source_type = 'education'

                                AND source_record_id = ?
                            `;

                            db.query(
                                deleteSourcesSql,
                                [userId, eduId],
                                (err) => {

                                    if (err) {
                                        console.error(
                                            "DELETE EDUCATION SOURCES ERROR:",
                                            err
                                        );

                                        return res.status(500).json({
                                            message:
                                                "Failed to update education skill sources"
                                        });
                                    }


                                    // Remove old skills from user_skills
                                    // ONLY if they no longer come from
                                    // any other source
                                    const removeOldSkills = (callback) => {

                                        if (oldSkillIds.length === 0) {
                                            return callback();
                                        }

                                        const removeSql = `
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
                                            removeSql,
                                            [
                                                userId,
                                                oldSkillIds,
                                                userId
                                            ],
                                            (err) => {

                                                if (err) {
                                                    console.error(
                                                        "REMOVE OLD USER SKILLS ERROR:",
                                                        err
                                                    );

                                                    return res.status(500).json({
                                                        message:
                                                            "Education updated but old skills could not be removed"
                                                    });
                                                }

                                                callback();
                                            }
                                        );
                                    };


                                    removeOldSkills(() => {

                                        // No new skills selected
                                        if (
                                            !Array.isArray(skill_ids) ||
                                            skill_ids.length === 0
                                        ) {

                                            return res.json({
                                                message:
                                                    "Education updated successfully"
                                            });

                                        }


                                        // Add new education → skill relationships
                                        const values = skill_ids.map(
                                            skillId => [
                                                eduId,
                                                skillId
                                            ]
                                        );

                                        const addSkillsql = `
                                            INSERT INTO education_skills
                                            (
                                                education_id,
                                                skill_id
                                            )
                                            VALUES ?
                                        `;

                                        db.query(
                                            addSkillsql,
                                            [values],
                                            (err) => {

                                                if (err) {
                                                    console.error(
                                                        "ADD EDUCATION SKILLS ERROR:",
                                                        err
                                                    );

                                                    return res.status(500).json({
                                                        message:
                                                            "Failed to update education skills"
                                                    });
                                                }


                                                // Add new source records
                                                const sourceValues =
                                                    skill_ids.map(
                                                        skillId => [
                                                            userId,
                                                            skillId,
                                                            "education",
                                                            eduId
                                                        ]
                                                    );

                                                const sourceSql = `
                                                    INSERT INTO user_skill_sources
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
                                                                "ADD EDUCATION SOURCES ERROR:",
                                                                err
                                                            );

                                                            return res.status(500).json({
                                                                message:
                                                                    "Education updated but skill sources could not be recorded"
                                                            });
                                                        }


                                                        // Add skills to user_skills
                                                        const userSkillValues =
                                                            skill_ids.map(
                                                                skillId => [
                                                                    userId,
                                                                    skillId
                                                                ]
                                                            );

                                                        const userSkillSql = `
                                                            INSERT IGNORE INTO user_skills
                                                            (
                                                                user_id,
                                                                skill_id
                                                            )
                                                            VALUES ?
                                                        `;

                                                        db.query(
                                                            userSkillSql,
                                                            [userSkillValues],
                                                            (err) => {

                                                                if (err) {
                                                                    console.error(
                                                                        "ADD USER SKILLS ERROR:",
                                                                        err
                                                                    );

                                                                    return res.status(500).json({
                                                                        message:
                                                                            "Education updated but skills could not be added to user skills"
                                                                    });
                                                                }

                                                                res.json({
                                                                    message:
                                                                        "Education updated successfully"
                                                                });

                                                            }
                                                        );

                                                    }
                                                );

                                            }
                                        );

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

module.exports = {
    addEdu,
    getEdu,
    delEdu,
    putEdu
};