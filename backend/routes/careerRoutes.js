const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
    getCareers,
    getCareerbyId,
    getCareerRoadmap,
    getPersonalizedPathway,
    setCareerGoal,
    getCareerComparison,
    addCareerPath,
    getCareerPaths
} = require("../controllers/careerController");

router.get("/recommended", authMiddleware, getCareers);

router.get("/compare", authMiddleware, getCareerComparison);

//for 2 careers
router.post("/paths", authMiddleware, addCareerPath);
router.get("/paths", authMiddleware, getCareerPaths);

router.get("/:careerId/pathway", authMiddleware, getPersonalizedPathway);

router.get("/:careerId/roadmap", authMiddleware, getCareerRoadmap);

router.put("/goal", authMiddleware, setCareerGoal);

router.get("/:careerId", authMiddleware, getCareerbyId);


module.exports = router;