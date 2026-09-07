const db = require("../config/db");

const getCareers = (req, res) => {
    const userId = req.user.user_id;

    const sql = `select c.career_id,c.career_name,c.description,c.category,
    count(distinct cs.skill_id) as total_skills,
    count(distinct case when us.skill_id is not null then cs.skill_id end)as matched_skills,
    group_concat(distinct case when us.skill_id is not null then s.skill_name end order by s.skill_name)as matched_skill_names,
    group_concat(distinct case when us.skill_id is null then s.skill_name end order by s.skill_name)as missing_skill_names

    from careers c
    join career_skills cs on c.career_id = cs.career_id
    join skills s on cs.skill_id = s.skill_id
    left join user_skills us on cs.skill_id = us.skill_id and us.user_id=?
    group by c.career_id,c.career_name,c.description,c.category
    order by count(distinct case when us.skill_id is not null then cs.skill_id end) / count(distinct cs.skill_id) DESC;`;

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to get recommended careers"
            });
        }

        const careers = results.map(career => ({
            career_id: career.career_id,
            career_name: career.career_name,
            description: career.description,
            category: career.category,
            match_percentage: Math.round((career.matched_skills / career.total_skills) * 100),
            matched_count: career.matched_skills,
            total_skills: career.total_skills,
            matched_skills: career.matched_skill_names
                ? career.matched_skill_names.split(",") : [],
            missing_skills: career.missing_skill_names
                ? career.missing_skill_names.split(",") : []
        }));
        res.json(careers);
    });
}

const getCareerbyId = (req, res) => {
    const userId = req.user.user_id;
    const careerId = req.params.careerId;

    const sql = `select c.career_id,c.career_name,c.description,c.category,
    count(distinct cs.skill_id) as total_skills,
    count(distinct case when us.skill_id is not null then cs.skill_id end)as matched_skills,
    group_concat(distinct case when us.skill_id is not null then s.skill_name end order by s.skill_name)as matched_skill_names,
    group_concat(distinct case when us.skill_id is null then s.skill_name end order by s.skill_name)as missing_skill_names

    from careers c
    join career_skills cs on c.career_id = cs.career_id
    join skills s on cs.skill_id = s.skill_id
    left join user_skills us on cs.skill_id = us.skill_id and us.user_id=?
    where c.career_id=?
    group by c.career_id,c.career_name,c.description,c.category`;
    db.query(sql, [userId, careerId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to get career details"
            });
        }

        const career = results[0];

        const response = {
            career_id: career.career_id,
            career_name: career.career_name,
            description: career.description,
            category: career.category,
            match_percentage: Math.round((career.matched_skills / career.total_skills) * 100),
            matched_count: career.matched_skills,
            total_skills: career.total_skills,
            matched_skills: career.matched_skill_names
                ? career.matched_skill_names.split(",") : [],
            missing_skills: career.missing_skill_names
                ? career.missing_skill_names.split(",") : []
        };
        res.json(response);
    });
}

const getCareerRoadmap = (req, res) => {

    const userId = req.user.user_id;
    const careerId = req.params.careerId;

    const sql = `
        SELECT
            cs.skill_id,
            s.skill_name,
            s.category,
            cs.skill_level,
            cs.roadmap_stage,
            cs.sequence_order,

            CASE
                WHEN us.skill_id IS NOT NULL
                THEN 'completed'
                ELSE 'not_started'
            END AS status

        FROM career_skills cs

        JOIN skills s
            ON cs.skill_id = s.skill_id

        LEFT JOIN user_skills us
            ON cs.skill_id = us.skill_id
            AND us.user_id = ?

        WHERE cs.career_id = ?

        ORDER BY
            cs.roadmap_stage,
            cs.sequence_order;
    `;

    db.query(
        sql,
        [userId, careerId],
        (err, results) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    message: "Failed to get career roadmap"
                });
            }

            res.json(results);
        }
    );
};

const setCareerGoal = (req, res) => {

    const userId = req.user.user_id;
    const { career_id } = req.body;

    if (!career_id) {
        return res.status(400).json({
            message: "Career ID is required"
        });
    }

    const sql = `
        UPDATE users
        SET career_goal_id = ?
        WHERE user_id = ?
    `;

    db.query(sql, [career_id, userId], (err, result) => {

        if (err) {
            console.error("SET CAREER GOAL ERROR:", err);

            return res.status(500).json({
                message: "Failed to set career goal"
            });
        }

        res.json({
            message: "Career goal updated successfully",
            career_goal_id: career_id
        });
    });
};

module.exports = { getCareers, getCareerbyId, getCareerRoadmap, setCareerGoal };