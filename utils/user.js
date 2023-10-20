"use strict";
require("express-async-errors")
const errors = require("./error")

const db = require(baseDir + "/utils/db");
const dbCon = db.pool;
const mysql = db.mysql;
const queryDb = db.queryDb;

class User {
    constructor(id, username)
    {
        this.id = id;
        this.username = username;
    }

    async getSubscribedSubreddits()
    {
        this.subscriptionsList = (await queryDb("SELECT subreddit_id as subredditId, title FROM subredditSubscriptions LEFT JOIN subreddits ON subreddit_id = subreddits.id WHERE user_id = ?", [this.id]));
        return;
    }
}




module.exports = {User};