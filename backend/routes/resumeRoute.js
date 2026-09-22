const express = require("express");

const router = express.Router();

const authMiddleware =
    require("../middleware/authMiddleware");

const {
    uploadResume,
    analyzeResume,
    importResume
} = require("../controllers/resumeController");

/*
    Step 1:
    Upload resume → extract text → Gemini analysis
    Nothing is saved to the user's profile.
*/
router.post(
    "/analyze",
    authMiddleware,
    uploadResume,
    analyzeResume
);

/*
    Step 2:
    Save the reviewed resume information
    into the user's profile.
*/
router.post(
    "/import",
    authMiddleware,
    importResume
);

module.exports = router;