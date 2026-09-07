const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");


//profile
const { updateProfile } = require("../controllers/profileController");
router.put("/", authMiddleware, updateProfile);


//education
const { addEdu, getEdu, delEdu, putEdu } = require("../controllers/eduController")
router.post("/education", authMiddleware, addEdu);
router.get("/education", authMiddleware, getEdu);
router.delete("/education/:id", authMiddleware, delEdu);
router.put("/education/:id", authMiddleware, putEdu);

//course
const { addCourse, getCourse, delCourse, putCourse } = require("../controllers/courseController")
router.post("/course", authMiddleware, addCourse);
router.get("/course", authMiddleware, getCourse);
router.delete("/course/:id", authMiddleware, delCourse);
router.put("/course/:id", authMiddleware, putCourse);

//Experience
const { addExp, getExp, delExp, putExp } = require("../controllers/expController")
router.post("/experience", authMiddleware, addExp);
router.get("/experience", authMiddleware, getExp);
router.delete("/experience/:id", authMiddleware, delExp);
router.put("/experience/:id", authMiddleware, putExp);

//project
const { addProj, getProj, delProj, putProj } = require("../controllers/projController")
router.post("/project", authMiddleware, addProj);
router.get("/project", authMiddleware, getProj);
router.delete("/project/:id", authMiddleware, delProj);
router.put("/project/:id", authMiddleware, putProj);

module.exports = router;