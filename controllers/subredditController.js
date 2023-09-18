"use strict";

require("express-async-errors")
const errors = require(baseDir + "/utils/error")

const db = require(baseDir + "/utils/db");
const dbCon = db.pool;
const mysql = db.mysql;
const queryDb = db.queryDb;

const {getPosts, getSubredditData, getSubredditView, getNextPage} = require(baseDir + "/utils/subreddit");
const Subreddit = require(baseDir + "/utils/subreddit").Subreddit;


///////////////////////////////////
///////// MIDDLEWARES /////////////
///////////////////////////////////

const getSubreddit = async function(req, res, next) {
    req.subreddit = req.params.subreddit;

    const result = await getSubredditData(req.subreddit);
    if(result)
    {
        req.subredditObj = new Subreddit(result.id, result.title);
        next();
    }
    else
    {
        res.status(404).send("Page not found");
    }
}


const getPageNum = function(req, res, next) {
    console.log("page num");
    req.pageNum = req.params.pageNum || 1;
    next();
}

//////////////////////////////////////
/////////// ROUTES ///////////////////
//////////////////////////////////////




const createSubreddit = async function(req, res) {
    if(!req.session.loggedIn)
    {
        res.send("You must be logged in to do that.");
    }
    else
    {
        if(await getSubredditData(req.body.subredditName))
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


const renderFrontPage = async function(req, res) {
    let params = await getSubredditView(req);
    res.render("frontpage", params);
}

const renderSubreddit = async function(req, res) {
    let params = await getSubredditView(req);
    res.render("subreddit", params);
}


const renderNextPage = async function(req, res) {
    let params = await getNextPage(req);

    if(!req.subredditObj) res.render(baseDir + "/views/postListFrontPage.ejs", params)
    else res.render(baseDir + "/views/postList.ejs", params);
}


module.exports = {createSubreddit, getSubreddit, getPageNum, renderFrontPage, renderSubreddit, renderNextPage};