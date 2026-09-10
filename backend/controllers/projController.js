const db = require("../config/db");

// Add
const addProj = (req, res) => {
    const userId = req.user.user_id;

    const {
        project_name,
        description,
        start_date,
        end_date,
        skill_ids
    } = req.body;

    const addsql = `
        INSERT INTO user_projects
        (
            user_id,
            project_name,
            description,
            start_date,
            end_date
        )
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
        addsql,
        [
            userId,
            project_name,
            description,
            start_date,
            end_date || null
        ],
        (err, result) => {

            if (err) {
                console.error("ADD PROJECT ERROR:", err);

                return res.status(500).json({
                    message: "Failed to add project",
                    error: err.message
                });
            }

            const projId = result.insertId;

            if (!skill_ids || skill_ids.length === 0) {
                return res.status(201).json({
                    message: "Project added successfully",
                    project_id: projId
                });
            }

            // Add project skills
            const skillValues = skill_ids.map(skillId => [
                projId,
                skillId
            ]);

            const projskillsql = `
                INSERT INTO project_skills
                (project_id, skill_id)
                VALUES ?
            `;

            db.query(
                projskillsql,
                [skillValues],
                (err) => {

                    if (err) {
                        console.error(
                            "ADD PROJECT SKILLS ERROR:",
                            err
                        );

                        return res.status(500).json({
                            message:
                                "Project added but skills could not be added"
                        });
                    }

                    // Add source records
                    const sourceValues = skill_ids.map(skillId => [
                        userId,
                        skillId,
                        "project",
                        projId
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
                                    "ADD PROJECT SOURCES ERROR:",
                                    err
                                );

                                return res.status(500).json({
                                    message:
                                        "Project added but skill sources could not be added"
                                });
                            }

                            // Add skills to user_skills
                            const userSkillValues =
                                skill_ids.map(skillId => [
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
                                            "ADD PROJECT USER SKILLS ERROR:",
                                            err
                                        );

                                        return res.status(500).json({
                                            message:
                                                "Project added but user skills could not be updated"
                                        });
                                    }

                                    res.status(201).json({
                                        message:
                                            "Project and skills added successfully",
                                        project_id: projId
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
const getProj = (req, res) => {
    const userId = req.user.user_id;

    const getsql = `
        SELECT
            up.*,
            COALESCE(
                GROUP_CONCAT(ps.skill_id),
                ''
            ) AS skill_ids
        FROM user_projects up
        LEFT JOIN project_skills ps
            ON up.project_id = ps.project_id
        WHERE up.user_id = ?
        GROUP BY up.project_id
    `;

    db.query(getsql, [userId], (err, result) => {

        if (err) {
            return res.status(500).json({
                message: "Failed to get projects"
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
const delProj = (req, res) => {
    const userId = req.user.user_id;
    const projId = req.params.id;

    // First get skills connected to this project
    const getSkillsSql = `
        SELECT skill_id
        FROM project_skills
        WHERE project_id = ?
    `;

    db.query(
        getSkillsSql,
        [projId],
        (err, skillRows) => {

            if (err) {
                console.error(
                    "GET PROJECT SKILLS ERROR:",
                    err
                );

                return res.status(500).json({
                    message: "Failed to delete project"
                });
            }

            const oldSkillIds = skillRows.map(
                row => row.skill_id
            );

            // Remove source records
            const deleteSourcesSql = `
                DELETE FROM user_skill_sources
                WHERE user_id = ?
                AND source_type = 'project'
                AND source_record_id = ?
            `;

            db.query(
                deleteSourcesSql,
                [userId, projId],
                (err) => {

                    if (err) {
                        console.error(
                            "DELETE PROJECT SOURCES ERROR:",
                            err
                        );

                        return res.status(500).json({
                            message: "Failed to delete project"
                        });
                    }

                    // Delete project
                    const delsql = `
                        DELETE FROM user_projects
                        WHERE project_id = ?
                        AND user_id = ?
                    `;

                    db.query(
                        delsql,
                        [projId, userId],
                        (err) => {

                            if (err) {
                                return res.status(500).json({
                                    message:
                                        "Failed to delete project"
                                });
                            }

                            if (oldSkillIds.length === 0) {
                                return res.json({
                                    message:
                                        "Project deleted successfully"
                                });
                            }

                            // Remove skill from user_skills only
                            // if no other source provides it
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
                                            "CLEAN PROJECT SKILLS ERROR:",
                                            err
                                        );

                                        return res.status(500).json({
                                            message:
                                                "Project deleted but skill cleanup failed"
                                        });
                                    }

                                    res.json({
                                        message:
                                            "Project deleted successfully"
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
const putProj = (req, res) => {
    const userId = req.user.user_id;
    const projId = req.params.id;

    const {
        project_name,
        description,
        start_date,
        end_date,
        skill_ids
    } = req.body;

    // Get old skills first
    const getOldSkillsSql = `
        SELECT skill_id
        FROM project_skills
        WHERE project_id = ?
    `;

    db.query(
        getOldSkillsSql,
        [projId],
        (err, oldSkillRows) => {

            if (err) {
                console.error(
                    "GET OLD PROJECT SKILLS ERROR:",
                    err
                );

                return res.status(500).json({
                    message: "Failed to update project"
                });
            }

            const oldSkillIds = oldSkillRows.map(
                row => row.skill_id
            );

            // Update project
            const putsql = `
                UPDATE user_projects
                SET
                    project_name = ?,
                    description = ?,
                    start_date = ?,
                    end_date = ?
                WHERE project_id = ?
                AND user_id = ?
            `;

            db.query(
                putsql,
                [
                    project_name,
                    description,
                    start_date,
                    end_date || null,
                    projId,
                    userId
                ],
                (err) => {

                    if (err) {
                        return res.status(500).json({
                            message:
                                "Failed to update project"
                        });
                    }

                    // Remove old project skills
                    const deleteSkillsSql = `
                        DELETE FROM project_skills
                        WHERE project_id = ?
                    `;

                    db.query(
                        deleteSkillsSql,
                        [projId],
                        (err) => {

                            if (err) {
                                return res.status(500).json({
                                    message:
                                        "Failed to update project skills"
                                });
                            }

                            // Remove old source records
                            const deleteSourcesSql = `
                                DELETE FROM user_skill_sources
                                WHERE user_id = ?
                                AND source_type = 'project'
                                AND source_record_id = ?
                            `;

                            db.query(
                                deleteSourcesSql,
                                [userId, projId],
                                (err) => {

                                    if (err) {
                                        return res.status(500).json({
                                            message:
                                                "Failed to update project sources"
                                        });
                                    }

                                    // Clean old skills
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
                                                        "CLEAN OLD PROJECT SKILLS ERROR:",
                                                        err
                                                    );

                                                    return res.status(500).json({
                                                        message:
                                                            "Failed to clean old project skills"
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
                                                    "Project updated successfully"
                                            });
                                        }

                                        const values = skill_ids.map(
                                            skillId => [
                                                projId,
                                                skillId
                                            ]
                                        );

                                        const addSkillsSql = `
                                            INSERT INTO project_skills
                                            (project_id, skill_id)
                                            VALUES ?
                                        `;

                                        db.query(
                                            addSkillsSql,
                                            [values],
                                            (err) => {

                                                if (err) {
                                                    return res.status(500).json({
                                                        message:
                                                            "Failed to update project skills"
                                                    });
                                                }

                                                // Add source records
                                                const sourceValues =
                                                    skill_ids.map(
                                                        skillId => [
                                                            userId,
                                                            skillId,
                                                            "project",
                                                            projId
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
                                                                    "Failed to update project sources"
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
                                                                        "Project updated successfully"
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
    addProj,
    getProj,
    delProj,
    putProj
};