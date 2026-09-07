const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    getSkills,
    getUserSkills,
    saveUserSkills
} = require("../controllers/skillController");


router.get("/", authMiddleware, getSkills);

router.get("/user", authMiddleware, getUserSkills);

router.put("/user", authMiddleware, saveUserSkills);


module.exports = router;