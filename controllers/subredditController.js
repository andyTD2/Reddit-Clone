"use strict";
require("express-async-errors")
const errors = require(baseDir + "/utils/error")

const db = require(baseDir + "/utils/db");
const dbCon = db.pool;
const mysql = db.mysql;
const queryDb = db.queryDb;

const {getPosts, subredditExists, loadSubreddit} = require(baseDir + "/utils/subreddit");
const {parseTimeSinceCreation} = require(baseDir + "/utils/misc");

const getSubreddit = async function(req, res, next) {
    const result = await subredditExists(req.params.subreddit);
    if(result)
    {
        req.subredditObj = loadSubreddit(result);
        next();
    }
    else
    {
        res.status(404).send("Page not found");
    }
}

const createSubreddit = async function(req, res) {
    if(!req.session.loggedIn)
    {
        res.send("You must be logged in to do that.");
    }
    else
    {
        if(await subredditExists(req.body.subredditName))
        {
            res.send("This subreddit name has already been taken.");
        }
        else
        {
            let query = "INSERT INTO subreddits (title, description, sidebar, createdBy) VALUES(?, ?, ?, ?)"
            query = mysql.format(query, [req.body.subredditName, req.body.description, req.body.sidebar, req.session.userID]);
            let result = await dbCon.query(query);
            res.redirect(`/r/${req.body.subredditName}`);
        }
    }
}


const createSubredditView = async function(req, res) {
    if(!req.params.filter) req.params.filter = "hot";

    let params = {
        subreddit: req.subredditObj
    }
    params.posts = await getPosts(req.subredditObj.id, req.params.filter);
    if(!params.posts)
    { 
        res.status(404).send("Page not found.");
        return;
    }


    if (req.session.loggedIn)
    {
        params.username = req.session.user;
        for (let post of params.posts)
        {
            let voteDirection = await queryDb("SELECT direction FROM postVotes WHERE user_id = ? AND post_id = ?", [req.session.userID, post.id]);
            if(voteDirection.length > 0)
                post.voteDirection = voteDirection[0].direction;
        }
    }
    for (let post of params.posts)
    {
        post.timeSinceCreation = parseTimeSinceCreation(post.minutes_ago);
    }
    res.render("subreddit", params);
}


module.exports = {createSubreddit, createSubredditView, getSubreddit};