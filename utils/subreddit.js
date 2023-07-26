"use strict";
require("express-async-errors")
const errors = require("./error")

const db = require(baseDir + "/utils/db");
const dbCon = db.pool;
const mysql = db.mysql;

class Subreddit {
    constructor(id, name)
    {
        this.id = id;
        this.name = name;
        this.moderators = [];
    }

}

const loadSubreddit = function(queryResult) {
    return new Subreddit(queryResult.id, queryResult.title);
}

const subredditExists = async function(subredditName) {
    let query = "SELECT * from subreddits WHERE title = ?";
    query = mysql.format(query, [subredditName]);
    let result = (await dbCon.query(query))[0];

    if (result.length === 0)
    {
        return undefined;
    }
    return result[0];
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

const createSubredditView = async function(req, res) {
    let params = {
        subreddit: req.subredditObj
    }
    if (req.session.loggedIn)
    {
        params.username = req.session.user;
    }

    params.posts = await getPostsByNew(req.subredditObj.id);
    res.render("subreddit", params);
}

const getPostsByNew = async function(subredditId) {
    let query = "select * from posts WHERE subreddit_id = ? ORDER BY created_at DESC LIMIT 20;";
    query = mysql.format(query, [subredditId]);
    return (await dbCon.query(query))[0];
}

module.exports = {subredditExists, createSubreddit, createSubredditView, loadSubreddit};