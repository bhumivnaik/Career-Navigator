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
// Get skill progress for current user
// Get missing skill progress for the user's selected career
const getSkillProgress = (req, res) => {

    const userId = req.user.user_id;

    const sql = `
        SELECT
            s.skill_id,
            s.skill_name,
            s.category,
            COALESCE(sp.progress_percentage, 0) AS progress_percentage,
            COALESCE(sp.skill_level, 'Beginner') AS skill_level
        FROM users u

        JOIN career_skills cs
            ON u.career_goal_id = cs.career_id

        JOIN skills s
            ON cs.skill_id = s.skill_id

        LEFT JOIN user_skills us
            ON us.user_id = u.user_id
            AND us.skill_id = s.skill_id

        LEFT JOIN skill_progress sp
            ON sp.user_id = u.user_id
            AND sp.skill_id = s.skill_id

        WHERE u.user_id = ?
        AND us.skill_id IS NULL

        ORDER BY s.category, s.skill_name
    `;

    db.query(sql, [userId], (err, result) => {

        if (err) {
            console.error("GET SKILL PROGRESS ERROR:", err);

            return res.status(500).json({
                message: "Failed to get skill progress"
            });
        }

        res.json(result);
    });
};
// Update skill progress
// Update progress for a missing career skill
// Update progress for a career skill
const updateSkillProgress = (req, res) => {

    const userId = req.user.user_id;

    const {
        skill_id,
        progress_percentage
    } = req.body;

    if (!skill_id || progress_percentage === undefined) {

        return res.status(400).json({
            message: "Skill ID and progress percentage are required"
        });

    }

    if (
        progress_percentage < 0 ||
        progress_percentage > 100
    ) {

        return res.status(400).json({
            message: "Progress must be between 0 and 100"
        });

    }


    // Check that this skill belongs to
    // the user's selected career
    const checkSql = `
        SELECT cs.skill_id
        FROM users u
        JOIN career_skills cs
            ON u.career_goal_id = cs.career_id
        WHERE u.user_id = ?
        AND cs.skill_id = ?
    `;

    db.query(
        checkSql,
        [userId, skill_id],
        (err, result) => {

            if (err) {

                console.error(
                    "CHECK SKILL ERROR:",
                    err
                );

                return res.status(500).json({
                    message: "Failed to verify skill"
                });

            }


            if (result.length === 0) {

                return res.status(400).json({
                    message:
                        "This skill is not required for your career"
                });

            }


            let skillLevel = "Beginner";

            if (progress_percentage >= 70) {

                skillLevel = "Proficient";

            } else if (progress_percentage >= 40) {

                skillLevel = "Developing";

            }


            // Save progress
            const progressSql = `
                INSERT INTO skill_progress
                (
                    user_id,
                    skill_id,
                    progress_percentage,
                    skill_level
                )
                VALUES (?, ?, ?, ?)

                ON DUPLICATE KEY UPDATE
                    progress_percentage = VALUES(progress_percentage),
                    skill_level = VALUES(skill_level)
            `;


            db.query(
                progressSql,
                [
                    userId,
                    skill_id,
                    progress_percentage,
                    skillLevel
                ],
                (err) => {

                    if (err) {

                        console.error(
                            "UPDATE SKILL PROGRESS ERROR:",
                            err
                        );

                        return res.status(500).json({
                            message:
                                "Failed to update skill progress"
                        });

                    }


                    // If skill reaches 100%,
                    // add it to user's completed skill set
                    if (progress_percentage >= 100) {

                        const insertSkillSql = `
                            INSERT IGNORE INTO user_skills
                            (
                                user_id,
                                skill_id
                            )
                            VALUES (?, ?)
                        `;

                        db.query(
                            insertSkillSql,
                            [userId, skill_id],
                            (err) => {

                                if (err) {

                                    console.error(
                                        "ADD COMPLETED SKILL ERROR:",
                                        err
                                    );

                                    return res.status(500).json({
                                        message:
                                            "Progress saved, but failed to mark skill as completed"
                                    });

                                }

                                res.json({
                                    message:
                                        "Skill completed successfully",
                                    progress_percentage: 100,
                                    skill_level: "Proficient"
                                });

                            }
                        );

                    } else {

                        // If progress is below 100,
                        // remove it from completed user skills
                        const removeSkillSql = `
                            DELETE FROM user_skills
                            WHERE user_id = ?
                            AND skill_id = ?
                        `;

                        db.query(
                            removeSkillSql,
                            [userId, skill_id],
                            (err) => {

                                if (err) {

                                    console.error(
                                        "REMOVE COMPLETED SKILL ERROR:",
                                        err
                                    );

                                    return res.status(500).json({
                                        message:
                                            "Progress saved, but failed to update completed skill"
                                    });

                                }

                                res.json({
                                    message:
                                        "Skill progress updated successfully",
                                    progress_percentage,
                                    skill_level: skillLevel
                                });

                            }
                        );

                    }

                }
            );

        }
    );
};
// Get quiz questions for a selected skill
const getQuizQuestions = (req, res) => {

    const userId = req.user.user_id;
    const skillId = req.params.skillId;

    const checkSkillSql = `
        SELECT skill_id
        FROM user_skills
        WHERE user_id = ?
        AND skill_id = ?
    `;

    db.query(
        checkSkillSql,
        [userId, skillId],
        (err, result) => {

            if (err) {

                console.error(
                    "CHECK QUIZ SKILL ERROR:",
                    err
                );

                return res.status(500).json({
                    message: "Failed to verify skill"
                });

            }

            if (result.length === 0) {

                return res.status(403).json({
                    message:
                        "You can only take quizzes for your selected skills"
                });

            }

            const quizSql = `
                SELECT
                    question_id,
                    question_text,
                    option_a,
                    option_b,
                    option_c,
                    option_d
                FROM quiz_questions
                WHERE skill_id = ?
                ORDER BY RAND()
            `;

            db.query(
                quizSql,
                [skillId],
                (err, questions) => {

                    if (err) {

                        console.error(
                            "GET QUIZ QUESTIONS ERROR:",
                            err
                        );

                        return res.status(500).json({
                            message:
                                "Failed to get quiz questions"
                        });

                    }

                    if (questions.length === 0) {

                        return res.status(404).json({
                            message:
                                "No quiz questions available for this skill"
                        });

                    }

                    res.json(questions);

                }
            );

        }
    );
};

module.exports = {
    getSkills,
    getUserSkills,
    saveUserSkills,
    getSkillProgress,
    updateSkillProgress,
    getQuizQuestions
};