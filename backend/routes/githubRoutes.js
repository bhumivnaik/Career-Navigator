const express = require("express");

const router = express.Router();

const authMiddleware =
    require("../middleware/authMiddleware");

const {
    syncGithub, getGithubSync, getGithubRepositories
} = require("../controllers/githubController");


router.post(
    "/sync",
    authMiddleware,
    syncGithub
);
router.get(
    "/sync",
    authMiddleware,
    getGithubSync
);
router.get(
    "/repositories",
    authMiddleware,
    getGithubRepositories
);

module.exports = router;