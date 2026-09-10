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

const getCareerComparison = (req, res) => {
    const userId = req.user.user_id;

    const ids = req.query.ids
        ? req.query.ids.split(",").map(Number).filter(Boolean)
        : [];

    if (ids.length < 2 || ids.length > 3) {
        return res.status(400).json({
            message: "Please select 2 or 3 careers to compare"
        });
    }

    const placeholders = ids.map(() => "?").join(",");

    const sql = `
        SELECT
            c.career_id,
            c.career_name,
            c.description,
            c.category,
            cs.skill_id,
            s.skill_name,
            cs.skill_level,
            cs.roadmap_stage,
            cs.sequence_order,
            CASE
                WHEN us.skill_id IS NOT NULL THEN 1
                ELSE 0
            END AS has_skill
        FROM careers c
        JOIN career_skills cs
            ON c.career_id = cs.career_id
        JOIN skills s
            ON cs.skill_id = s.skill_id
        LEFT JOIN user_skills us
            ON cs.skill_id = us.skill_id
            AND us.user_id = ?
        WHERE c.career_id IN (${placeholders})
        ORDER BY
            c.career_id,
            cs.roadmap_stage,
            cs.sequence_order
    `;

    db.query(sql, [userId, ...ids], (err, results) => {

        if (err) {
            console.error("CAREER COMPARISON ERROR:", err);

            return res.status(500).json({
                message: "Failed to compare careers"
            });
        }

        const comparison = ids.map((careerId) => {

            const careerRows = results.filter(
                row => row.career_id === careerId
            );

            if (careerRows.length === 0) {
                return null;
            }

            const first = careerRows[0];

            const matchedSkills = careerRows
                .filter(row => row.has_skill === 1)
                .map(row => row.skill_name);

            const missingSkills = careerRows
                .filter(row => row.has_skill === 0)
                .map(row => row.skill_name);

            const totalSkills = careerRows.length;

            const matchPercentage = totalSkills > 0
                ? Math.round(
                    (matchedSkills.length / totalSkills) * 100
                )
                : 0;

            return {
                career_id: first.career_id,
                career_name: first.career_name,
                description: first.description,
                category: first.category,

                match_percentage: matchPercentage,

                matched_count: matchedSkills.length,
                total_skills: totalSkills,

                matched_skills: matchedSkills,
                missing_skills: missingSkills,

                learning_requirements: missingSkills,

                roadmap: careerRows.map(row => ({
                    skill_id: row.skill_id,
                    skill_name: row.skill_name,
                    skill_level: row.skill_level,
                    roadmap_stage: row.roadmap_stage,
                    sequence_order: row.sequence_order,
                    status: row.has_skill === 1
                        ? "completed"
                        : "required"
                }))
            };
        }).filter(Boolean);

        res.json(comparison);
    });
};

module.exports = {
    getCareers,
    getCareerbyId,
    getCareerRoadmap,
    setCareerGoal,
    getCareerComparison
};