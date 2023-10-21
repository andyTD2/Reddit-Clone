"use strict";
const express = require('express');
const router = express.Router({mergeParams: true});
const { getPageNum } = require(baseDir + "/src/misc/middlewares/misc");
const postController = require(baseDir + "/src/Post/post-controller");
const postMiddlewares = require(baseDir + "/src/Post/post-middleware");
const subredditMiddlewares = require(baseDir + "/src/Subreddit/subreddit-middleware");

const commentController = require(baseDir + "/src/Comment/comment-controller")

router.use("/newPost", subredditMiddlewares.getSubredditData);
router.get("/newPost", async function(req, res) {
    res.render("createPost", {user: req.user, subreddit: req.subredditData})
});

router.use("/newPost", subredditMiddlewares.getSubredditData);
router.post("/newPost", postController.handleNewPostRequest);


router.use("/:postId/", subredditMiddlewares.getSubredditData);
router.use("/:postId/", postMiddlewares.getPost);
router.get("/:postId/:filter?", postController.handlePostPageRequest);

router.use("/:postId/newComment", subredditMiddlewares.getSubredditData);
router.post("/:postId/newComment", commentController.handleNewCommentRequest);

router.use("/:postId/page=:pageNum/:filter?", subredditMiddlewares.getSubredditData);
router.use("/:postId/page=:pageNum/:filter?", getPageNum);
router.get("/:postId/page=:pageNum/:filter?", commentController.handleLoadCommentsRequest);


module.exports = router;