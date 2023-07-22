"use strict";
require("express-async-errors")
const errors = require("./error")

const db = require(baseDir + "/utils/db");
const dbCon = db.pool;
const mysql = db.mysql;



const subredditExists = async function(subredditName) {
    let query = "SELECT * from subreddits WHERE title = ?";
    query = mysql.format(query, [subredditName]);
    let result = await dbCon.query(query);
    result = result[0];

    if (result.length === 0)
    {
        return false;
    }
    return true;
};

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
            result = await dbCon.query(query);
            res.redirect(`/r/${req.body.subredditName}`);
        }
    }
}

const getSubreddit = async function(req, res) {
    params = {
        subredditName: req.params.subreddit,
        createPostLink: `/r/${req.params.subreddit}/newPost`,
        accountControls: 'noAccount.ejs'
    }
    if (req.session.loggedIn)
    {
        params.accountControls = "hasAccount.ejs";
        params.username = req.session.user;
    }

    res.render("subreddit", params);
}

const createPost = async function(req, res) {
    if(!req.session.loggedIn)
    {
        res.send("You must be logged in to do that.");
    }
    else
    {
        let subID = await dbCon.query(mysql.format("SELECT id FROM subreddits WHERE title = ?", [req.params.subreddit]));
        subID = subID[0][0].id;
        let query = "INSERT INTO posts (title, content, subreddit_id, user_id) VALUES (?, ?, ?, ?)";
        query = mysql.format(query, [req.body.postTitle, req.body.content, subID, req.session.userID]);
        let result = await dbCon.query(query);
        res.redirect(`/r/${req.params.subreddit}/post/${result[0].insertId}`);
    }
}

module.exports = {subredditExists, createSubreddit, getSubreddit, createPost};