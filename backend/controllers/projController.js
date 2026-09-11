const db = require("../config/db");

//Add
const addProj = (req, res) => {
    const userId = req.user.user_id;
    const { project_name, description, start_date, end_date, skill_ids } = req.body;

    const addsql = `insert into user_projects (user_id, project_name, description, start_date, end_date)
    values (?,?,?,?,?)`;

    db.query(addsql, [userId, project_name, description, start_date, end_date],
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

            const projskillsql = `insert into project_skills (project_id, skill_id) values ?`;
            const skillValues = skill_ids.map(skillId =>
                [projId, skillId]
            );

            db.query(projskillsql, [skillValues], (err) => {
                if (err) {
                    return res.status(500).json({ message: "Project added but skills could not be added" });
                }

                res.status(201).json({
                    message: "Project and skills added successfully",
                    project_id: projId
                });
            }
            );
        }
    )
}

//Get
const getProj = (req, res) => {
    const userId = req.user.user_id;

    const getsql = `select * from user_projects where user_id = ?`;

    db.query(getsql, [userId], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Failed to get projects" });
        }
        res.json(result);
    });

}

//Delete
const delProj = (req, res) => {
    const userId = req.user.user_id;
    const projId = req.params.id;

    const delsql = `delete from user_projects where project_id = ? and user_id = ?`;

    db.query(delsql, [projId, userId], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Failed to delete project" });
        }
        res.json({ message: "Project deleted successfully" });
    });
}

//Update
const putProj = (req, res) => {
    const userId = req.user.user_id;
    const projId = req.params.id;

    const { project_name, description, start_date, end_date, skill_ids } = req.body;

    const putsql = `update user_projects set project_name = ?, description= ?, start_date= ?, end_date= ? where project_id = ? and user_id = ?`;

    db.query(putsql, [project_name, description, start_date, end_date, projId, userId], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Failed to update project" });
        }

        const putSkillsSql = `DELETE FROM project_skills WHERE project_id = ?`;
        db.query(putSkillsSql, [projId], (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Failed to update project" });
            }

            if (skill_ids && skill_ids.length > 0) {
                const values = skill_ids.map(skillId => [projId, skillId]);
                const addSkillsql = `Insert into project_skills (project_id, skill_id) values ?`;
                db.query(addSkillsql, [values], (err, result) => {
                    if (err) {
                        return res.status(500).json({ message: "Failed to update project skills" });
                    }
                    res.json({ message: "project updated successfully" });
                });
            } else {
                res.json({ message: "update project successfully" });
            }
        })
    });
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

