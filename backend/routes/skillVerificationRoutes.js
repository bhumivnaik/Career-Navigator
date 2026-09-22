const express = require("express");

const router = express.Router();

const {
    verifySkill
} = require("../controllers/skillVerificationController");

const authMiddleware = require("../middleware/authMiddleware");

router.post(
    "/verify",
    authMiddleware,
    verifySkill
);

module.exports = router;