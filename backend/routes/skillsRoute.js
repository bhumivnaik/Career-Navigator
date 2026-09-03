const express = require(express);
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const { getSkills } = require("../controllers/skillController");
router.get("/", authMiddleware, getSkills);

module.exports = router;
