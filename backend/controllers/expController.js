const db = require("../config/db");

//Add
const addExp = (req, res) => {
    const userId = req.user.user_id;
    const { experience_type, job_title, company_name, description, start_date, end_date, skill_ids } = req.body;

    const addsql = `insert into user_experience (user_id, degree, field_of_study, institution, start_year, end_year)
    values (?,?,?,?,?,?,?)`;

    db.query(addsql, [userId, experience_type, job_title, company_name, description, start_date, end_date],
        async (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Failed to add education" });
            }

            const expId = result.insertId;
            if (!skill_ids || skill_ids.length === 0) {
                return res.status(201).json({
                    message: "Experience added successfully",
                    experience_id: expId
                });
            }

            const expskillsql = `insert into experience_skills (education_id, skill_id) values ?`;
            const skillValues = skill_ids.map(skillId =>
                [expId, skillId]
            );

            db.query(expskillsql, [skillValues], (err) => {
                if (err) {
                    return res.status(500).json({ message: "Experience added but skills could not be added" });
                }

                res.status(201).json({
                    message: "Experience and skills added successfully",
                    experience_id: expId
                });
            }
            );
        }
    )
}

//Get
const getExp = (req, res) => {
    const userId = req.user.user_id;

    const getsql = `select * from user_experience where user_id = ?`;

    db.query(getsql, [userId], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Failed to get experience" });
        }
        res.json(result);
    });

}

//Delete
const delExp = (req, res) => {
    const userId = req.user.user_id;
    const expId = req.params.id;

    const delsql = `delete from user_experience where experience_id = ? and user_id = ?`;

    db.query(delsql, [expId, userId], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Failed to delete experience" });
        }
        res.json({ message: "Experience deleted successfully" });
    });
}

module.exports = { addExp, getExp, delExp };