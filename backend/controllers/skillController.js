const db = require("../config/db");


// Get all skills
const getSkills = (req, res) => {

    const sql = `
        SELECT skill_id, skill_name, category
        FROM skills
        ORDER BY category, skill_name
    `;

    db.query(sql, (err, result) => {

        if (err) {
            return res.status(500).json({
                message: "Failed to get skills"
            });
        }

        res.json(result);
    });
};


// Get skills selected by current user
const getUserSkills = (req, res) => {

    const userId = req.user.user_id;

    const sql = `
        SELECT
            s.skill_id,
            s.skill_name,
            s.category
        FROM user_skills us
        JOIN skills s
            ON us.skill_id = s.skill_id
        WHERE us.user_id = ?
        ORDER BY s.category, s.skill_name
    `;

    db.query(sql, [userId], (err, result) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                message: "Failed to get user skills"
            });
        }

        res.json(result);
    });
};


// Save user's skills
const saveUserSkills = (req, res) => {

    const userId = req.user.user_id;
    const { skill_ids } = req.body;

    if (!Array.isArray(skill_ids) || skill_ids.length === 0) {

        return res.status(400).json({
            message: "Please select at least one skill"
        });

    }


    // Delete previous skills
    const deleteSql = `
        DELETE FROM user_skills
        WHERE user_id = ?
    `;

    db.query(deleteSql, [userId], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to update skills"
            });
        }

        // Prepare new skills
        const skillValues = skill_ids.map((skillId) => [
            userId,
            skillId
        ]);

        const insertSql = `
            INSERT INTO user_skills
            (user_id, skill_id)
            VALUES ?
        `;


        db.query(insertSql, [skillValues], (err) => {

            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Failed to save skills"
                });
            }

            // Mark profile as complete
            const profileSql = `
                UPDATE users
                SET profile_completed = true
                WHERE user_id = ?
            `;

            db.query(profileSql, [userId], (err) => {

                if (err) {

                    console.error("PROFILE UPDATE ERROR:", err);

                    return res.status(500).json({
                        message: "Skills saved, but failed to complete profile",
                        error: err.message
                    });

                }

                res.json({
                    message: "Skills saved successfully",
                    profile_completed: true
                });

            });
        });

    });

};


module.exports = {
    getSkills,
    getUserSkills,
    saveUserSkills
};