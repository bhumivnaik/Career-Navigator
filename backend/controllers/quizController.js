const db = require("../config/db");
const crypto = require("crypto");
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

// Gemini model used for AI quiz generation.
const MODELS = [
    "gemini-3.6-flash",
    "gemini-3.7-flash",
    "gemini-3.8-flash"
];

// Temporary in-memory storage for active quizzes.
// Correct answers stay on the backend.
const activeQuizzes = new Map();


const generateWithModel = async (prompt) => {

    let lastError;

    for (const model of MODELS) {

        try {

            console.log(`Trying Gemini model: ${model}`);

            const response =
                await ai.models.generateContent({

                    model,

                    contents: prompt,

                    config: {

                        responseMimeType:
                            "application/json",

                        responseSchema: {

                            type: "array",

                            minItems: 5,
                            maxItems: 5,

                            items: {

                                type: "object",

                                properties: {

                                    question: {
                                        type: "string"
                                    },

                                    option_a: {
                                        type: "string"
                                    },

                                    option_b: {
                                        type: "string"
                                    },

                                    option_c: {
                                        type: "string"
                                    },

                                    option_d: {
                                        type: "string"
                                    },

                                    correct_option: {
                                        type: "string"
                                    },

                                    difficulty: {
                                        type: "string"
                                    }

                                },

                                required: [
                                    "question",
                                    "option_a",
                                    "option_b",
                                    "option_c",
                                    "option_d",
                                    "correct_option",
                                    "difficulty"
                                ]

                            }

                        }

                    }

                });

            console.log(
                `Gemini model succeeded: ${model}`
            );

            return response;

        } catch (error) {

            lastError = error;

            console.error(
                `Gemini model failed: ${model}`,
                error.status || error.message
            );

            // Try the next model
            continue;
        }
    }

    throw lastError;
};

const generateQuiz = async (req, res) => {
    try {
        const { skill_id } = req.params;

        // Get the skill from MySQL.
        const skills = await new Promise((resolve, reject) => {
            db.query(
                `
                SELECT skill_id, skill_name, category
                FROM skills
                WHERE skill_id = ?
                `,
                [skill_id],
                (error, results) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(results);
                    }
                }
            );
        });

        if (skills.length === 0) {
            return res.status(404).json({
                message: "Skill not found"
            });
        }

        const skill = skills[0];

        /*
         * The AI creates exactly 5 questions
         * for the selected skill.
         */
        const prompt = `
You are creating a personalized skill assessment for a college student.

Skill:
${skill.skill_name}

Category:
${skill.category}

Generate exactly 5 multiple-choice questions that test the student's actual understanding of this skill.

Requirements:

1. Generate exactly 5 questions.
2. Every question must have exactly 4 options.
3. Use option names A, B, C and D.
4. Only one option must be correct.
5. Include the correct option as A, B, C or D.
6. Include a difficulty value:
   - Beginner
   - Intermediate
   - Advanced
7. Include a mixture of difficulties.
8. Questions must test actual understanding, not simple guessing.
9. Avoid ambiguous or trick questions.
10. Do not repeat the same concept unnecessarily.
11. Questions should be appropriate for a college student.
12. Keep the wording clear and understandable.
13. Do not include explanations in the generated questions.
14. Return only the requested JSON structure.
`;

        const response = await generateWithModel(prompt);

        if (!response || !response.text) {
            throw new Error("Gemini returned an empty response");
        }

        let generatedQuestions;

        try {
            generatedQuestions = JSON.parse(response.text);
        } catch (parseError) {
            console.error(
                "Failed to parse Gemini JSON:",
                response.text
            );

            throw new Error(
                "AI returned an invalid quiz format"
            );
        }

        /*
         * Validate the complete AI response before
         * sending anything to the frontend.
         */
        if (
            !Array.isArray(generatedQuestions) ||
            generatedQuestions.length !== 5
        ) {
            throw new Error(
                "AI did not generate exactly 5 questions"
            );
        }

        const validOptions = ["A", "B", "C", "D"];

        const validDifficulties = [
            "Beginner",
            "Intermediate",
            "Advanced"
        ];

        generatedQuestions.forEach(
            (question, index) => {

                const requiredFields = [
                    "question",
                    "option_a",
                    "option_b",
                    "option_c",
                    "option_d",
                    "correct_option",
                    "difficulty"
                ];

                for (const field of requiredFields) {
                    if (
                        typeof question[field] !== "string" ||
                        question[field].trim() === ""
                    ) {
                        throw new Error(
                            `Question ${index + 1} has an invalid ${field}`
                        );
                    }
                }

                if (
                    !validOptions.includes(
                        question.correct_option
                    )
                ) {
                    throw new Error(
                        `Question ${index + 1} has an invalid correct option`
                    );
                }

                if (
                    !validDifficulties.includes(
                        question.difficulty
                    )
                ) {
                    throw new Error(
                        `Question ${index + 1} has an invalid difficulty`
                    );
                }
            }
        );

        /*
         * Create a unique quiz ID.
         */
        const quizId = crypto.randomUUID();

        /*
         * Store the complete quiz on the backend.
         * This includes the correct answers.
         */
        activeQuizzes.set(quizId, {
            user_id: req.user.user_id,
            skill_id: Number(skill_id),
            skill_name: skill.skill_name,
            questions: generatedQuestions,
            created_at: Date.now()
        });

        /*
         * Return only safe quiz information
         * to the frontend.
         */
        return res.json({
            quiz_id: quizId,
            skill_id: Number(skill_id),
            skill_name: skill.skill_name,

            questions: generatedQuestions.map(
                (question, index) => ({
                    question_id: index + 1,
                    question_text: question.question,
                    option_a: question.option_a,
                    option_b: question.option_b,
                    option_c: question.option_c,
                    option_d: question.option_d,
                    difficulty: question.difficulty
                })
            )
        });

    } catch (error) {
        console.error(
            "AI quiz generation failed:",
            error
        );

        return res.status(500).json({
            message: "Failed to generate AI quiz"
        });
    }
};


const submitQuiz = async (req, res) => {
    try {
        const { quiz_id, answers } = req.body;

        if (!quiz_id) {
            return res.status(400).json({
                message: "Quiz ID is required"
            });
        }

        if (!Array.isArray(answers)) {
            return res.status(400).json({
                message: "Answers must be an array"
            });
        }

        const quiz = activeQuizzes.get(quiz_id);

        if (!quiz) {
            return res.status(404).json({
                message:
                    "Quiz not found or has already been submitted"
            });
        }

        /*
         * Make sure the quiz belongs to the
         * logged-in user.
         */
        if (
            quiz.user_id !== req.user.user_id
        ) {
            return res.status(403).json({
                message:
                    "You are not allowed to submit this quiz"
            });
        }

        let score = 0;

        quiz.questions.forEach(
            (question, index) => {

                const submittedAnswer = answers.find(
                    (answer) =>
                        Number(answer.question_id) ===
                        index + 1
                );

                if (
                    submittedAnswer &&
                    submittedAnswer.selected_option ===
                    question.correct_option
                ) {
                    score++;
                }
            }
        );

        const totalQuestions =
            quiz.questions.length;

        const percentage =
            totalQuestions > 0
                ? Math.round(
                    (score / totalQuestions) * 100
                )
                : 0;

        let level;
        let recommendation;

        if (percentage >= 70) {
            level = "Proficient";

            recommendation =
                "You have a strong understanding of this skill. Continue with advanced concepts, real-world projects and more challenging problems.";

        } else if (percentage >= 40) {
            level = "Developing";

            recommendation =
                "You have a developing understanding of this skill. Continue learning the core concepts and practice through small projects.";

        } else {
            level = "Beginner";

            recommendation =
                "Focus on the fundamentals of this skill and build your understanding through basic examples and practice.";
        }

        /*
         * Remove the quiz after submission so the
         * same quiz cannot be submitted repeatedly.
         */
        activeQuizzes.delete(quiz_id);

        return res.json({
            score,
            total_questions: totalQuestions,
            percentage,
            level,
            recommendation
        });

    } catch (error) {
        console.error(
            "Quiz submission failed:",
            error
        );

        return res.status(500).json({
            message: "Failed to submit quiz"
        });
    }
};


module.exports = {
    generateQuiz,
    submitQuiz
};