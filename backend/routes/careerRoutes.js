const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
    getCareers,
    getCareerbyId,
    getCareerRoadmap,
    setCareerGoal,
    getCareerComparison
} = require("../controllers/careerController");

router.get("/recommended", authMiddleware, getCareers);
router.get("/compare", authMiddleware, getCareerComparison);
router.get("/:careerId", authMiddleware, getCareerbyId);
router.get("/:careerId/roadmap", authMiddleware, getCareerRoadmap);
router.put("/goal", authMiddleware, setCareerGoal);

module.exports = router;