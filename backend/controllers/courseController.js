const db = require("../config/db");

//Add
const addCourse = (req, res) => {
    const userId = req.user.user_id;
    const { course_name, provider, description, completion_date, certificate_url, skill_ids } = req.body;

    const addsql = `insert into user_courses (user_id, course_name, provider, description, completion_date, certificate_url)
    values (?,?,?,?,?,?)`;

    db.query(addsql, [userId, course_name, provider, description, completion_date, certificate_url],
        async (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Failed to add course" });
            }

            const courseId = result.insertId;
            if (!skill_ids || skill_ids.length === 0) {
                return res.status(201).json({
                    message: "Course added successfully",
                    course_id: courseId
                });
            }

            const courseskillsql = `insert into course_skills (course_id, skill_id) values ?`;
            const skillValues = skill_ids.map(skillId =>
                [courseId, skillId]
            );

            db.query(courseskillsql, [skillValues], (err) => {
                if (err) {
                    return res.status(500).json({ message: "Course added but skills could not be added" });
                }

                res.status(201).json({
                    message: "Course and skills added successfully",
                    course_id: courseId
                });
            }
            );
        }
    )
}

//Get
const getCourse = (req, res) => {
    const userId = req.user.user_id;

    const getsql = `select * from user_courses where user_id = ?`;

    db.query(getsql, [userId], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Failed to get course" });
        }
        res.json(result);
    });

}

//Delete
const delCourse = (req, res) => {
    const userId = req.user.user_id;
    const courseId = req.params.id;

    const delsql = `delete from user_courses where course_id = ? and user_id = ?`;

    db.query(delsql, [courseId, userId], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Failed to delete Course" });
        }
        res.json({ message: "Course deleted successfully" });
    });
}

module.exports = { addCourse, getCourse, delCourse };