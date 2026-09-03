const db = require("../config/db");

const getSkills = (req, res) => {
    const skillssql = `select skill_name, category from skills order by category, skill_name`;

    db.query(skillssql, (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Failed to get skills" });
        }
        res.json(result);
    })
}

module.exports = { getSkills };
