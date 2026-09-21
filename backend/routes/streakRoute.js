const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    getStreak
} = require("../controllers/streakController");


router.get(
    "/",
    authMiddleware,
    getStreak
);


module.exports = router;