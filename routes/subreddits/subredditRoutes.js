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

const { getSubreddit } = require(baseDir + "/middlewares/subreddit");
const { getPageNum } = require(baseDir + "/middlewares/misc");


router.post("/search", postController.searchForPosts);

router.use("/search/page=:pageNum", getPageNum);
router.post("/search/page=:pageNum", postController.loadMoreSearchResults);


router.get("/createSubreddit", function(req, res) {
    res.render("createSubreddit", {user: req.user})
})
router.post("/createSubreddit", subreddit.createSubreddit);


router.use("/r/:subreddit/next/page=:pageNum/:filter?", getSubreddit);
router.use("/r/:subreddit/next/page=:pageNum/:filter?", getPageNum);
router.get("/r/:subreddit/next/page=:pageNum/:filter?", subreddit.renderNextPage);

router.use("/r/:subreddit/page=:pageNum/:filter?", getSubreddit);
router.use("/r/:subreddit/page=:pageNum/:filter?", getPageNum);
router.get("/r/:subreddit/page=:pageNum/:filter?", subreddit.renderSubreddit);

router.use("/r/:subreddit/post/", getSubreddit);
router.use("/r/:subreddit/post/", posts);


router.use("/r/:subreddit/:filter?", getSubreddit);
router.use("/r/:subreddit/:filter?", getPageNum);
router.get("/r/:subreddit/:filter?", subreddit.renderSubreddit);

router.post("/vote/:postId", postController.voteOnPost);

router.post("/voteComment/:commentId", commentController.voteOnComment);

router.use("/next/page=:pageNum/:filter?", getPageNum);
router.get("/next/page=:pageNum/:filter?", subreddit.renderNextPage)

router.use("/page=:pageNum/:filter?", getPageNum);
router.get("/page=:pageNum/:filter?", subreddit.renderFrontPage);

router.use("/:filter?", getPageNum);
router.get("/:filter?", subreddit.renderFrontPage);





module.exports = router;