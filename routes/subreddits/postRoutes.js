"use strict";
const express = require('express');
const router = express.Router({mergeParams: true});
const post = require(baseDir + "/utils/post");

router.get("/newPost", async function(req, res) {
    console.log("x");
    res.render("createPost", {createPostLink: `/r/${req.params.subreddit}/post/newPost`})
});


router.get("/:postId", post.loadPost);

router.post("/newPost", post.createPost);

router.post("/:postId/newComment", post.createComment);

router.post("/:postId/vote", post.voteOnPost);

router.post("/comment/:commentId/vote", post.voteOnComment);



module.exports = router;