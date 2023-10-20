"use strict";
const express = require('express');
const router = express.Router();

const db = require(baseDir + "/utils/db");
const dbCon = db.pool;
const mysql = db.mysql;
const posts = require(baseDir + "/routes/subreddits/postRoutes");
const commentController = require(baseDir + "/src/Comment/comment-controller");
const postController = require(baseDir + "/src/Post/post-controller");

const { getPageNum, getFilter } = require(baseDir + "/middlewares/misc");

const subredditMiddlewares = require(baseDir + "/src/Subreddit/subreddit-middleware");
const subredditController = require(baseDir + "/src/Subreddit/subreddit-controller");


router.post("/search", postController.handleSearchResultsRequest);

router.use("/search/page=:pageNum", getPageNum);
router.post("/search/page=:pageNum", postController.handleNextResultsPageRequest);


router.get("/createSubreddit", subredditController.handleNewSubredditFormRequest);
router.post("/createSubreddit", subredditController.handleNewSubredditRequest);


router.use("/r/:subreddit/next/page=:pageNum/:filter?", subredditMiddlewares.getSubredditData);
router.use("/r/:subreddit/next/page=:pageNum/:filter?", getPageNum);
router.use("/r/:subreddit/next/page=:pageNum/:filter?", getFilter);
router.get("/r/:subreddit/next/page=:pageNum/:filter?", subredditController.handleNextSubredditPageRequest);

router.use("/r/:subreddit/page=:pageNum/:filter?", subredditMiddlewares.getSubredditData);
router.use("/r/:subreddit/page=:pageNum/:filter?", getPageNum);
router.use("/r/:subreddit/page=:pageNum/:filter?", getFilter);
router.get("/r/:subreddit/page=:pageNum/:filter?", subredditController.handleSubredditPageRequest);

router.use("/r/:subreddit/post/", posts);


router.use("/r/:subreddit/:filter?", subredditMiddlewares.getSubredditData);
router.use("/r/:subreddit/:filter?", getPageNum);
router.use("/r/:subreddit/:filter?", getFilter);
router.get("/r/:subreddit/:filter?", subredditController.handleSubredditPageRequest);

router.post("/vote/:postId", postController.handlePostVoteRequest);

router.post("/voteComment/:commentId", commentController.handleCommentVoteRequest);

router.use("/next/page=:pageNum/:filter?", getPageNum);
router.use("/next/page=:pageNum/:filter?", getFilter);
router.get("/next/page=:pageNum/:filter?", subredditController.handleNextFrontPageRequest);

router.use("/page=:pageNum/:filter?", getPageNum);
router.use("/page=:pageNum/:filter?", getFilter);
router.get("/page=:pageNum/:filter?", subredditController.handleFrontPageRequest);

router.use("/:filter?", getPageNum);
router.use("/:filter?", getFilter);
router.get("/:filter?", subredditController.handleFrontPageRequest);





module.exports = router;