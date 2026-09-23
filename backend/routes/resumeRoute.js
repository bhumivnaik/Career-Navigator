const express = require("express");

const router = express.Router();

const {
    uploadResume,
    analyzeResume,
    getResume,
    deleteResume,
    importResume
} = require("../controllers/resumeController");

const authMiddleware =
    require("../middleware/authMiddleware");


// Upload + save + analyze
router.post(
    "/upload",
    authMiddleware,
    uploadResume,
    analyzeResume
);


// View/download current resume
router.get(
    "/file",
    authMiddleware,
    getResume
);


// Delete current resume
router.delete(
    "/file",
    authMiddleware,
    deleteResume
);


// Add analyzed data to profile
router.post(
    "/import",
    authMiddleware,
    importResume
);


module.exports = router;