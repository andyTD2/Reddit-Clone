"use strict";
require("express-async-errors")
const errors = require("./error")

const db = require(baseDir + "/utils/db");
const dbCon = db.pool;
const mysql = db.mysql;
const queryDb = db.queryDb;

const bcrypt = require("bcrypt");


/*  
    THIS FILE CONTAINS THE USER CLASS AND RELATED UTILITY FUNCTIONS
    - user authentication, login/logout
    - user creation
    - retrieving user data
*/

const logIn = function(username, id, req) {
    req.session.user = username;
    req.session.userID = id;
    req.session.loggedIn = true;
}

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




module.exports = {logIn, User};