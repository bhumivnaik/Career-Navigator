const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    generateQuiz,
    submitQuiz
} = require("../controllers/quizController");


// Generate AI quiz for a selected skill
router.get(
    "/generate/:skill_id",
    authMiddleware,
    generateQuiz
);


// Submit AI-generated quiz
router.post(
    "/submit",
    authMiddleware,
    submitQuiz
);


module.exports = router;