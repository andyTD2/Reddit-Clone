"use strict";
const express = require('express');
const router = express.Router({mergeParams: true});
const postController = require(baseDir + "/controllers/postController");
const commentController = require(baseDir + "/controllers/commentController")

router.get("/newPost", async function(req, res) {
    console.log("x");
    res.render("createPost", {createPostLink: `/r/${req.params.subreddit}/post/newPost`})
});

router.use("/:postId/", postController.getPost);

router.get("/:postId/:filter?", postController.createPostView);

router.post("/newPost", postController.createPost);

router.post("/:postId/newComment", commentController.createComment);

router.post("/comment/:commentId/vote", commentController.voteOnComment);

router.get("/:postId/page=:pageNum/:filter?", commentController.loadMoreComments);


module.exports = router;