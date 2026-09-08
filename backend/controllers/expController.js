const db = require("../config/db");

//Add
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

            const expskillsql = `
                INSERT INTO experience_skills
                (experience_id, skill_id)
                VALUES ?
            `;

            const skillValues = skill_ids.map(skillId => [
                expId,
                skillId
            ]);

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

                    res.status(201).json({
                        message:
                            "Experience and skills added successfully",
                        experience_id: expId
                    });
                }
            );
        }
    );
};
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

//Update
const putExp = (req, res) => {
    const userId = req.user.user_id;
    const expId = req.params.id;
    const { experience_type, job_title, company_name, description, start_date, end_date, skill_ids } = req.body;

    const putsql = `update user_experience set experience_type= ?, job_title= ?, company_name= ?, description= ?, start_date= ? , end_date= ? where experience_id = ? and user_id = ?`;

    db.query(putsql, [experience_type, job_title, company_name, description, start_date, end_date, expId, userId], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Failed to update experience" });
        }

        const putSkillsSql = `DELETE FROM experience_skills WHERE experience_id = ?`;
        db.query(putSkillsSql, [expId], (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Failed to update experience" });
            }

            if (skill_ids && skill_ids.length > 0) {
                const values = skill_ids.map(skillId => [expId, skillId]);
                const addSkillsql = `Insert into experience_skills (experience_id, skill_id) values ?`;
                db.query(addSkillsql, [values], (err, result) => {
                    if (err) {
                        return res.status(500).json({ message: "Failed to update experience skills" });
                    }
                    res.json({ message: "experience updated successfully" });
                });
            } else {
                res.json({ message: "experience updated successfully" });
            }
        })
    });
};


module.exports = { addExp, getExp, delExp, putExp };