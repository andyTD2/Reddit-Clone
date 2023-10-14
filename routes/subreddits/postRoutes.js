"use strict";
const express = require('express');
const router = express.Router({mergeParams: true});
const postController = require(baseDir + "/controllers/postController");
const commentController = require(baseDir + "/controllers/commentController")
const {getPost} = require(baseDir + "/middlewares/post");

router.get("/newPost", async function(req, res) {
    res.render("createPost", {user: req.user, subreddit: req.subredditObj})
});

router.post("/newPost", postController.createPost);

router.use("/:postId/", getPost);

router.get("/:postId/:filter?", postController.createPostView);


router.post("/:postId/newComment", commentController.createComment);


router.get("/:postId/page=:pageNum/:filter?", commentController.loadMoreComments);


module.exports = router;