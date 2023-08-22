"use strict";
const express = require('express');
const router = express.Router({mergeParams: true});
const postController = require(baseDir + "/controllers/postController");
const commentController = require(baseDir + "/controllers/commentController")

router.get("/newPost", async function(req, res) {
    console.log("x");
    res.render("createPost", {createPostLink: `/r/${req.params.subreddit}/post/newPost`})
});


router.get("/:postId", postController.loadPost);

router.post("/newPost", postController.createPost);

router.post("/:postId/vote", postController.voteOnPost);

router.post("/:postId/newComment", commentController.createComment);

router.post("/comment/:commentId/vote", commentController.voteOnComment);


module.exports = router;