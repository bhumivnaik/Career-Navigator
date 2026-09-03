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

module.exports = { addProj, getProj, delProj };

