const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");


//profile
const { updateProfile } = require("../controllers/profileController");
router.put("/", authMiddleware, updateProfile);


//education
const { addEdu, getEdu, delEdu } = require("../controllers/eduController")
router.post("/education", authMiddleware, addEdu);
router.get("/education", authMiddleware, getEdu);
router.delete("/education/:id", authMiddleware, delEdu);


//course
const { addCourse, getCourse, delCourse } = require("../controllers/courseController")
router.post("/course", authMiddleware, addCourse);
router.get("/course", authMiddleware, getCourse);
router.delete("/course/:id", authMiddleware, delCourse);


//Experience
const { addExp, getExp, delExp } = require("../controllers/expController")
router.post("/experience", authMiddleware, addExp);
router.get("/experience", authMiddleware, getExp);
router.delete("/experience/:id", authMiddleware, delExp);


//project
const { addProj, getProj, delProj } = require("../controllers/projController")
router.post("/project", authMiddleware, addProj);
router.get("/project", authMiddleware, getProj);
router.delete("/project/:id", authMiddleware, delProj);


module.exports = router;