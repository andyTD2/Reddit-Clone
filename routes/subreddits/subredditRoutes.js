"use strict";
const express = require('express');
const router = express.Router();

const db = require(baseDir + "/utils/db");
const dbCon = db.pool;
const mysql = db.mysql;
const subreddit = require(baseDir + "/controllers/subredditController");
const posts = require(baseDir + "/routes/subreddits/postRoutes");
const postController = require(baseDir + "/controllers/postController");
const commentController = require(baseDir + "/controllers/commentController");

/*
    This middleware checks if the subreddit the user is trying to access exists.
    If not, send 404, otherwise continue
*/


router.post("/createSubreddit", subreddit.createSubreddit);


router.use("/r/:subreddit/:filter?", subreddit.getSubreddit);
router.use("/r/:subreddit/:filter?", subreddit.getPageNum);
router.get("/r/:subreddit/:filter?", subreddit.renderSubreddit);


router.use("/r/:subreddit/page=:pageNum/:filter?", subreddit.getSubreddit);
router.use("/r/:subreddit/page=:pageNum/:filter?", subreddit.getPageNum);
router.get("/r/:subreddit/page=:pageNum/:filter?", subreddit.renderSubreddit);


router.use("/r/:subreddit/next/page=:pageNum/:filter?", subreddit.getSubreddit);
router.use("/r/:subreddit/next/page=:pageNum/:filter?", subreddit.getPageNum);
router.get("/r/:subreddit/next/page=:pageNum/:filter?", subreddit.renderNextPage);


router.use("/r/:subreddit/post/", subreddit.getSubreddit);
router.use("/r/:subreddit/post/", posts);


router.post("/vote/:postId", postController.voteOnPost);

router.post("/voteComment/:commentId", commentController.voteOnComment);


router.use("/page=:pageNum/:filter?", (req, res, next) => {
    req.subreddit = "ALL";
    subreddit.getSubreddit(req, res, next);
});
router.use("/page=:pageNum/:filter?", subreddit.getPageNum);
router.get("/page=:pageNum/:filter?", subreddit.renderFrontPage);


router.use("/:filter?", (req, res, next) => {
    req.subreddit = "ALL";
    subreddit.getSubreddit(req, res, next);
});
router.use("/:filter?", subreddit.getPageNum);
router.get("/:filter?", subreddit.renderFrontPage);





module.exports = router;