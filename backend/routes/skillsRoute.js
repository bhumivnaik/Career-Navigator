const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    getSkills,
    getUserSkills,
    saveUserSkills,
    getSkillProgress,
    updateSkillProgress,
    getQuizQuestions
} = require("../controllers/skillController");


router.get("/", authMiddleware, getSkills);

router.get("/user", authMiddleware, getUserSkills);

router.put("/user", authMiddleware, saveUserSkills);
router.get("/progress", authMiddleware, getSkillProgress);

router.put("/progress", authMiddleware, updateSkillProgress);
router.get(
    "/quiz/:skillId",
    authMiddleware,
    getQuizQuestions
);


module.exports = router;