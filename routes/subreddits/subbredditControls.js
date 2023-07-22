"use strict";
const express = require('express');
const router = express.Router();

const db = require(baseDir + "/utils/db");
const dbCon = db.pool;
const mysql = db.mysql;
const subreddit = require(baseDir + "/utils/subreddit");

/*
    This middleware checks if the subreddit the user is trying to access exists.
    If not, send 404, otherwise continue
*/

router.use("/r/:subreddit", async function(req, res, next){
    console.log("SU");
    if(await subredditExists(req.params.subreddit))
    {
        next();
    }
    else
    {
        res.status(404).send("Page not found");
    }
})


router.post("/createSubreddit", async function(req, res) {
    subreddit.createSubreddit(req, res);
})


router.get("/r/:subreddit", async function(req, res){
    subreddit.getSubreddit(req, res);
})


router.get("/r/:subreddit/newPost", async function(req, res) {
    res.render("createPost", {createPostLink: `/r/${req.params.subreddit}/newPost`})
})

router.post("/r/:subreddit/newPost", async function(req, res) {
    subreddit.createPost(req, res);
})

router.get("/r/:subreddit/post/:postId", async function(req, res) {
    
})


module.exports = router;