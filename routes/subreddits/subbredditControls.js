"use strict";
const express = require('express');
const router = express.Router();

const db = require(baseDir + "/utils/db");
const dbCon = db.pool;
const mysql = db.mysql;
const subreddit = require(baseDir + "/utils/subreddit");
const posts = require(baseDir + "/routes/subreddits/postRoutes");

/*
    This middleware checks if the subreddit the user is trying to access exists.
    If not, send 404, otherwise continue
*/


router.use("/r/:subreddit", async function(req, res, next){
    console.log("SU");
    const result = await subreddit.subredditExists(req.params.subreddit);
    if(result)
    {
        req.subredditObj = subreddit.loadSubreddit(result);
        next();
    }
    else
    {
        res.status(404).send("Page not found");
    }
})


router.get("/r/:subreddit/:filter?", subreddit.createSubredditView);


router.post("/createSubreddit", subreddit.createSubreddit);


router.use("/r/:subreddit/post/", posts);


module.exports = router;