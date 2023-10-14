"use strict";

require("express-async-errors")
const errors = require(baseDir + "/utils/error")

const db = require(baseDir + "/utils/db");
const dbCon = db.pool;
const mysql = db.mysql;
const queryDb = db.queryDb;

const {loadSubredditData, getSubredditView, getNextPage} = require(baseDir + "/utils/subreddit");


const createSubreddit = async function(req, res) {
    if(!req.session.loggedIn)
    {
        res.status(401).send("You must be logged in to do that.");
        return;
    }
    if(req.body.subredditName.length < 3 || req.body.subredditName.length > 30)
    {
        res.status(400).send("Subreddit name must be between 3 and 30 characters.");
        return;
    }
    const alphanumeric = new RegExp("^[a-zA-Z0-9]*$");
    if(!alphanumeric.test(req.body.subredditName))
    {
        res.status(400).send("Subreddit name may only consist of letters and numbers.");
        return;
    }
    if(await loadSubredditData(req.body.subredditName))
    {
        res.status(400).send("This subreddit name has already been taken.");
        return;
    }

    let query = "INSERT INTO subreddits (title, description, sidebar, createdBy) VALUES(?, ?, ?, ?)"
    query = mysql.format(query, [req.body.subredditName, req.body.description, req.body.sidebar, req.session.userID]);
    let result = await dbCon.query(query);
    res.send(`/r/${req.body.subredditName}`);
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


module.exports = {createSubreddit, renderFrontPage, renderSubreddit, renderNextPage};