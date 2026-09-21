const db = require("../config/db");

//Add
const addProj = (req, res) => {
    const userId = req.user.user_id;
    const { project_name, description, technologies_used, start_date, end_date, skill_ids } = req.body;

    const addsql = `insert into user_projects (user_id, project_name, description, technologies_used, start_date, end_date)
    values (?,?,?,?,?,?)`;

    db.query(addsql, [userId, project_name, description, technologies_used, start_date, end_date],
        async (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Failed to add project" });
            }

            const projId = result.insertId;
            if (!skill_ids || skill_ids.length === 0) {
                return res.status(201).json({
                    message: "Project added successfully",
                    project_id: projId
                });
            }

            const skillValues = skill_ids.map(skillId =>
                [projId, skillId]
            );
            const projskillsql = `insert into project_skills (project_id, skill_id) values ?`;


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


                    // Add skill sources
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

                                console.error(
                                    "ADD PROJECT SOURCES ERROR:",
                                    err
                                );

                                return res.status(500).json({
                                    message:
                                        "Project added but skill sources could not be added"
                                });

                            }


                            // Add to overall user skills
                            const userSkillValues =
                                skill_ids.map(
                                    skillId => [
                                        userId,
                                        skillId
                                    ]
                                );


                            const userSkillsSql = `
                                INSERT IGNORE INTO user_skills
                                (
                                    user_id,
                                    skill_id
                                )
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
                                        project_id:
                                            projId
                                    });

                                }
                            );

                        }
                    );

                }
            );

        }
    )
}

//Get
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

        ORDER BY up.project_id DESC
    `;

    db.query(
        getsql,
        [userId],
        (err, result) => {

            if (err) {

                console.error(
                    "GET PROJECTS ERROR:",
                    err
                );

                return res.status(500).json({
                    message: "Failed to get projects"
                });

            }


            const formattedResult =
                result.map(project => ({

                    ...project,

                    skill_ids:
                        project.skill_ids
                            ? project.skill_ids
                                .split(",")
                                .map(Number)
                            : []

                }));


            res.json(formattedResult);

        }
    );


}

//Delete
const delProj = (req, res) => {

    const userId = req.user.user_id;
    const projId = req.params.id;


    // Get skills belonging to project
    const getSkillsSql = `
        SELECT ps.skill_id
        FROM project_skills ps

        JOIN user_projects up
            ON ps.project_id = up.project_id

        WHERE ps.project_id = ?
        AND up.user_id = ?
    `;


    db.query(
        getSkillsSql,
        [projId, userId],
        (err, skillRows) => {

            if (err) {

                console.error(
                    "GET PROJECT SKILLS ERROR:",
                    err
                );

                return res.status(500).json({
                    message:
                        "Failed to delete project"
                });

            }


            const oldSkillIds =
                skillRows.map(
                    row => row.skill_id
                );


            // Delete source records
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
                            message:
                                "Failed to delete project"
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

                                console.error(
                                    "DELETE PROJECT ERROR:",
                                    err
                                );

                                return res.status(500).json({
                                    message:
                                        "Failed to delete project"
                                });

                            }


                            // No skills to clean
                            if (
                                oldSkillIds.length === 0
                            ) {

                                return res.json({
                                    message:
                                        "Project deleted successfully"
                                });

                            }


                            // Remove skills from user_skills
                            // only if no other source provides them
                            const cleanupSql = `
                                DELETE FROM user_skills
                                WHERE user_id = ?
                                AND skill_id IN (?)

                                AND NOT EXISTS (
                                    SELECT 1
                                    FROM user_skill_sources
                                    WHERE
                                        user_skill_sources.user_id = ?
                                    AND
                                        user_skill_sources.skill_id =
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


//Update
const putProj = (req, res) => {

    const userId = req.user.user_id;
    const projId = req.params.id;


    const {
        project_name,
        description,
        technologies_used,
        start_date,
        end_date,
        skill_ids
    } = req.body;


    // Get old skills first
    const getOldSkillsSql = `
        SELECT ps.skill_id
        FROM project_skills ps

        JOIN user_projects up
            ON ps.project_id = up.project_id

        WHERE ps.project_id = ?
        AND up.user_id = ?
    `;


    db.query(
        getOldSkillsSql,
        [projId, userId],
        (err, oldSkillRows) => {

            if (err) {

                console.error(
                    "GET OLD PROJECT SKILLS ERROR:",
                    err
                );

                return res.status(500).json({
                    message:
                        "Failed to update project"
                });

            }


            const oldSkillIds =
                oldSkillRows.map(
                    row => row.skill_id
                );


            // Update project details
            const putsql = `
                UPDATE user_projects

                SET
                    project_name = ?,
                    description = ?,
                    technologies_used = ?,
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
                    technologies_used,
                    start_date,
                    end_date,
                    projId,
                    userId
                ],
                (err) => {

                    if (err) {

                        console.error(
                            "UPDATE PROJECT ERROR:",
                            err
                        );

                        return res.status(500).json({
                            message:
                                "Failed to update project"
                        });

                    }


                    // Delete old project skills
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


                            // Delete old source records
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


                                    // Add new skills
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


                                        const values =
                                            skill_ids.map(
                                                skillId => [
                                                    projId,
                                                    skillId
                                                ]
                                            );


                                        // Add project skills
                                        const addSkillsSql = `
                                            INSERT INTO project_skills
                                            (
                                                project_id,
                                                skill_id
                                            )
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


                                                        // Add to overall user skills
                                                        const userSkillValues =
                                                            skill_ids.map(
                                                                skillId => [
                                                                    userId,
                                                                    skillId
                                                                ]
                                                            );


                                                        const userSkillsSql = `
                                                            INSERT IGNORE INTO user_skills
                                                            (
                                                                user_id,
                                                                skill_id
                                                            )
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


                                    // No old skills
                                    if (
                                        oldSkillIds.length === 0
                                    ) {

                                        return addNewSkills();

                                    }


                                    // Remove old skills from
                                    // overall user skills only
                                    // when no other source provides them
                                    const cleanupSql = `
                                        DELETE FROM user_skills

                                        WHERE user_id = ?
                                        AND skill_id IN (?)

                                        AND NOT EXISTS (
                                            SELECT 1
                                            FROM user_skill_sources
                                            WHERE
                                                user_skill_sources.user_id = ?
                                            AND
                                                user_skill_sources.skill_id =
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

                                }
                            );

                        }
                    );

                }
            );

        }
    );

};



// ============================================================
// Import GitHub project
// ============================================================

const importGithubProject = async (req, res) => {

    try {

        const userId = req.user.user_id;

        const {
            name,
            description,
            html_url,
            created_at,
            technologies,
            languages
        } = req.body;


        if (!name || !html_url) {

            return res.status(400).json({
                message:
                    "Project name and GitHub URL are required"
            });

        }


        // ----------------------------------------------------
        // Check if repository already exists
        // ----------------------------------------------------

        const checkSql = `
            SELECT project_id
            FROM user_projects
            WHERE user_id = ?
            AND github_repo_url = ?
        `;


        const existingProject =
            await new Promise(
                (resolve, reject) => {

                    db.query(
                        checkSql,
                        [
                            userId,
                            html_url
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


        if (existingProject.length > 0) {

            return res.status(409).json({
                message:
                    "This GitHub project is already imported"
            });

        }


        // ----------------------------------------------------
        // Combine languages + technologies
        // ----------------------------------------------------

        const allTechnologies = [
            ...(languages || []),
            ...(technologies || [])
        ].filter(
            (item, index, array) =>
                array.indexOf(item) === index
        );


        const technologiesUsed =
            allTechnologies.join(", ");


        // ----------------------------------------------------
        // Use repository creation date as project start date
        // ----------------------------------------------------

        const startDate =
            created_at
                ? created_at.substring(0, 10)
                : null;


        // ----------------------------------------------------
        // Insert project
        // ----------------------------------------------------

        const insertSql = `
            INSERT INTO user_projects
            (
                user_id,
                project_name,
                description,
                technologies_used,
                start_date,
                github_repo_url,
                project_source
            )
            VALUES (?, ?, ?, ?, ?, ?, 'GitHub')
        `;


        const projectResult =
            await new Promise(
                (resolve, reject) => {

                    db.query(
                        insertSql,
                        [
                            userId,
                            name,
                            description || "",
                            technologiesUsed,
                            startDate,
                            html_url
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


        const projectId =
            projectResult.insertId;


        // ----------------------------------------------------
        // Find matching skills
        // ----------------------------------------------------

        for (
            const skillName
            of allTechnologies
        ) {

            const skillSql = `
                SELECT skill_id
                FROM skills
                WHERE skill_name = ?
            `;


            const skillResult =
                await new Promise(
                    (resolve, reject) => {

                        db.query(
                            skillSql,
                            [skillName],
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


            if (skillResult.length === 0) {
                continue;
            }


            const skillId =
                skillResult[0].skill_id;


            // Add skill to project
            const projectSkillSql = `
                INSERT IGNORE INTO project_skills
                (
                    project_id,
                    skill_id
                )
                VALUES (?, ?)
            `;


            await new Promise(
                (resolve, reject) => {

                    db.query(
                        projectSkillSql,
                        [
                            projectId,
                            skillId
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


            // Add skill to user's overall skills
            // Add skill source
            const sourceSql = `
    INSERT IGNORE INTO user_skill_sources
    (
        user_id,
        skill_id,
        source_type,
        source_record_id
    )
    VALUES (?, ?, 'project', ?)
`;

            await new Promise(
                (resolve, reject) => {

                    db.query(
                        sourceSql,
                        [
                            userId,
                            skillId,
                            projectId
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


            // Add skill to user's overall skills
            const userSkillSql = `
    INSERT IGNORE INTO user_skills
    (
        user_id,
        skill_id
    )
    VALUES (?, ?)
`;

            await new Promise(
                (resolve, reject) => {

                    db.query(
                        userSkillSql,
                        [
                            userId,
                            skillId
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

        }


        // ----------------------------------------------------
        // Response
        // ----------------------------------------------------

        res.status(201).json({

            message:
                "GitHub project imported successfully",

            project_id:
                projectId

        });


    } catch (error) {

        console.error(
            "IMPORT GITHUB PROJECT ERROR:",
            error
        );


        res.status(500).json({
            message:
                "Failed to import GitHub project"
        });

    }

};

module.exports = { addProj, getProj, delProj, putProj, importGithubProject };

