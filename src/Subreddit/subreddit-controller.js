"use strict";

require("express-async-errors")
const errors = require(baseDir + "/src/utils/error")

const db = require(baseDir + "/src/utils/db");
const dbCon = db.pool;
const mysql = db.mysql;
const queryDb = db.queryDb;

const subredditService = require(baseDir + "/src/Subreddit/subreddit-service");

const handleNewSubredditFormRequest = function(req, res)
{
    res.render("createSubreddit", {user: req.user});
}

const handleNewSubredditRequest = async function(req, res)
{
    if(!req.session.loggedIn)
    {
        res.status(401).send("You must be logged in to do that.");
        return;
    }

    let newSubreddit = await subredditService.createSubreddit(req.body.subredditName, req.body.description, req.body.sidebar, req.session.userID);
    if(!newSubreddit.ok)
    {
        res.status(newSubreddit.statusCode).send(newSubreddit.error);
        return;
    }
    res.send(`/r/${req.body.subredditName}`);
}


const handleFrontPageRequest = async function(req, res) {
    let querySubreddit = await subredditService.getSubredditPage(req.subredditData, req.pageNum, req.filter, req.session.userID);
    if (!querySubreddit.ok)
    {
        res.status(querySubreddit.statusCode).send(querySubreddit.error);
        return;
    }
    querySubreddit.params["user"] = req.user;
    res.render("frontpage", querySubreddit.params);
}

const handleSubredditPageRequest = async function(req, res) {
    let querySubreddit = await subredditService.getSubredditPage(req.subredditData, req.pageNum, req.filter, req.session.userID);
    if (!querySubreddit.ok)
    {
        res.status(querySubreddit.statusCode).send(querySubreddit.error);
        return;
    }
    querySubreddit.params["user"] = req.user;
    res.render("subreddit", querySubreddit.params);
}


const handleNextFrontPageRequest = async function(req, res)
{
    let queryNextPage = await subredditService.getNextPage(req.subredditData, req.pageNum, req.filter, req.session.userID);
    if(!queryNextPage.ok)
    {
        res.status(queryNextPage.statusCode).send(queryNextPage.error);
        return;
    }
    res.render("postListFrontPage.ejs", queryNextPage.params);
}

const handleNextSubredditPageRequest = async function(req, res) {
    let queryNextPage = await subredditService.getNextPage(req.subredditData, req.pageNum, req.filter, req.session.userID);
    if(!queryNextPage.ok)
    {
        res.status(queryNextPage.statusCode).send(queryNextPage.error);
        return;
    }
    res.render("postList.ejs", queryNextPage.params);
}


module.exports = {handleFrontPageRequest, handleSubredditPageRequest, handleNextFrontPageRequest, 
    handleNextSubredditPageRequest, handleNewSubredditFormRequest, handleNewSubredditRequest};