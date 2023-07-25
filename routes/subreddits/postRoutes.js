"use strict";
const express = require('express');
const router = express.Router({mergeParams: true});
const post = require(baseDir + "/utils/post");


router.get("/:postId", async function(req, res) {
    post.loadPost(req, res);
})

module.exports = router;