const db = require("../config/db");

//Add
const addEdu = (req, res) => {
    const userId = req.user.user_id;
    const { degree, field_of_study, institution, start_year, end_year, skill_ids } = req.body;

    const addsql = `insert into user_education (user_id, degree, field_of_study, institution, start_year, end_year)
    values (?,?,?,?,?,?)`;

    db.query(addsql, [userId, degree, field_of_study, institution, start_year, end_year],
        async (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Failed to add education" });
            }

            const eduId = result.insertId;
            if (!skill_ids || skill_ids.length === 0) {
                return res.status(201).json({
                    message: "Education added successfully",
                    education_id: eduId
                });
            }

            const eduskillsql = `insert into education_skills (education_id, skill_id) values ?`;
            const skillValues = skill_ids.map(skillId =>
                [eduId, skillId]
            );

            db.query(eduskillsql, [skillValues], (err) => {
                if (err) {
                    return res.status(500).json({ message: "Education added but skills could not be added" });
                }

                res.status(201).json({
                    message: "Education and skills added successfully",
                    education_id: eduId
                });
            }
            );
        }
    )
}

//Get
const getEdu = (req, res) => {
    const userId = req.user.user_id;

    const getsql = `select * from user_education where user_id = ?`;

    db.query(getsql, [userId], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Failed to get education" });
        }
        res.json(result);
    });

}

//Delete
const delEdu = (req, res) => {
    const userId = req.user.user_id;
    const eduId = req.params.id;

    const delsql = `delete from user_education where education_id = ? and user_id = ?`;

    db.query(delsql, [eduId, userId], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Failed to delete education" });
        }
        res.json({ message: "Education deleted successfully" });
    });
}

module.exports = { addEdu, getEdu, delEdu };