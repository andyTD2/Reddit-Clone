"use strict";
const express = require('express');
const router = express.Router();

const db = require(baseDir + "/utils/db");
const dbCon = db.pool;
const mysql = db.mysql;
const subreddit = require(baseDir + "/controllers/subredditController");
const posts = require(baseDir + "/routes/subreddits/postRoutes");
const postController = require(baseDir + "/controllers/postController");

/*
    This middleware checks if the subreddit the user is trying to access exists.
    If not, send 404, otherwise continue
*/

router.get("/", subreddit.getAll);

router.post("/createSubreddit", subreddit.createSubreddit);

router.use("/r/:subreddit/", subreddit.getSubreddit);

router.use("/r/:subreddit/page=:pageNum", subreddit.getPageNum);

router.get("/r/:subreddit/page=:pageNum/:filter?", subreddit.getNextPage);

router.get("/r/:subreddit/:filter?", subreddit.createSubredditView);

router.use("/r/:subreddit/post/", posts);

router.post("/vote/:postId", postController.voteOnPost);




module.exports = router;