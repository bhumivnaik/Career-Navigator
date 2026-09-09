const db = require("../config/db");


// Get quiz questions for a selected skill
const getQuizQuestions = (req, res) => {

    const { skill_id } = req.params;

    if (!skill_id) {
        return res.status(400).json({
            message: "Skill ID is required"
        });
    }

    const sql = `
        SELECT
            q.question_id,
            q.question_text,
            q.option_a,
            q.option_b,
            q.option_c,
            q.option_d
        FROM quiz_questions q
        WHERE q.skill_id = ?
        ORDER BY q.question_id
        LIMIT 5
    `;

    db.query(sql, [skill_id], (err, result) => {

        if (err) {
            console.error("GET QUIZ QUESTIONS ERROR:", err);

            return res.status(500).json({
                message: "Failed to get quiz questions"
            });
        }

        if (result.length === 0) {
            return res.status(404).json({
                message: "No quiz questions available for this skill"
            });
        }

        res.json(result);
    });
};


// Submit quiz answers
const submitQuiz = (req, res) => {

    const { answers } = req.body;

    if (!Array.isArray(answers) || answers.length === 0) {
        return res.status(400).json({
            message: "Answers are required"
        });
    }

    const questionIds = answers.map(answer => answer.question_id);

    const sql = `
        SELECT
            question_id,
            correct_option
        FROM quiz_questions
        WHERE question_id IN (?)
    `;

    db.query(sql, [questionIds], (err, questions) => {

        if (err) {
            console.error("CHECK QUIZ ANSWERS ERROR:", err);

            return res.status(500).json({
                message: "Failed to check quiz answers"
            });
        }

        let score = 0;

        answers.forEach(answer => {

            const question = questions.find(
                q => q.question_id === answer.question_id
            );

            if (
                question &&
                question.correct_option === answer.selected_option
            ) {
                score++;
            }

        });

        const totalQuestions = answers.length;

        const percentage = Math.round(
            (score / totalQuestions) * 100
        );

        let level = "Beginner";

        if (percentage >= 70) {
            level = "Proficient";
        } else if (percentage >= 40) {
            level = "Developing";
        }

        let recommendation = "";

        if (level === "Beginner") {

            recommendation =
                "Start with the fundamentals and practice basic concepts.";

        } else if (level === "Developing") {

            recommendation =
                "Continue learning and practice the skill through small projects.";

        } else {

            recommendation =
                "You have a strong understanding. Try advanced concepts and projects.";

        }

        res.json({
            score,
            total_questions: totalQuestions,
            percentage,
            level,
            recommendation
        });

    });
};


module.exports = {
    getQuizQuestions,
    submitQuiz
};