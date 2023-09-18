"use strict";
const express = require('express');
const router = express.Router({mergeParams: true});
const postController = require(baseDir + "/controllers/postController");
const commentController = require(baseDir + "/controllers/commentController")

router.get("/newPost", async function(req, res) {
    res.render("createPost", {username: req.session.loggedIn ? req.session.user : undefined, subreddit: req.subredditObj})
});

router.post("/newPost", postController.createPost);

router.use("/:postId/", postController.getPost);

router.get("/:postId/:filter?", postController.createPostView);



router.post("/:postId/newComment", commentController.createComment);

//router.post("/comment/:commentId/vote", commentController.voteOnComment);

router.get("/:postId/page=:pageNum/:filter?", commentController.loadMoreComments);


module.exports = router;