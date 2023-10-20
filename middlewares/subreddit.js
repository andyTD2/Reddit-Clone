"use strict";

require("express-async-errors")
const errors = require(baseDir + "/utils/error")

const db = require(baseDir + "/utils/db");
const dbCon = db.pool;
const mysql = db.mysql;
const queryDb = db.queryDb;

const { Subreddit } = require(baseDir + "/utils/subreddit");
const { loadSubredditData } = require(baseDir + "/utils/subreddit");

const getSubreddit = async function(req, res, next) {
    req.subreddit = req.params.subreddit;

    const result = await loadSubredditData(req.subreddit);
    if(!result)
    {
        res.status(404).send("Page not found");
        return;
    }
    
    req.subredditObj = new Subreddit(result.id, result.title, result.description, result.sidebar);
    next();
}


module.exports = { getSubreddit };