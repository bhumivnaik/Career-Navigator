const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    getQuizQuestions,
    submitQuiz
} = require("../controllers/quizController");


// Get questions for a selected skill
router.get(
    "/:skill_id",
    authMiddleware,
    getQuizQuestions
);


// Submit quiz answers
router.post(
    "/submit",
    authMiddleware,
    submitQuiz
);


module.exports = router;