const db = require("../config/db");

const updateProfile = (req, res) => {
    const userId = req.user.user_id;
    const { full_name, github_profile_url, linkedin_profile_url } = req.body

    const updatesql = `update users set full_name =?, github_profile_url = ?, linkedin_profile_url=? where user_id =?`;

    db.query(updatesql, [full_name, github_profile_url, linkedin_profile_url, userId], async (err, result) => {
        if (err) {
            return res.status(500).json({ message: "failed to Update profile" });
        }

        res.json({ message: "Profile Updated successfully" });
    });
};

module.exports = { updateProfile };