"use strict";
require("express-async-errors")
const errors = require("./error")

const db = require(baseDir + "/utils/db");
const dbCon = db.pool;
const mysql = db.mysql;
const queryDb = db.queryDb;

const filters = {

    hot: `SELECT POSTS.id, numVotes, title, content, created_at, subreddit_id, userName, TIMESTAMPDIFF(MINUTE, created_at, CURRENT_TIMESTAMP()) AS minutes_ago FROM POSTS 
    LEFT JOIN users ON posts.user_id = users.id
    WHERE subreddit_id = ?
    ORDER BY score DESC LIMIT 20`,

    new: `SELECT POSTS.id, numVotes, title, content, created_at, subreddit_id, userName, TIMESTAMPDIFF(MINUTE, created_at, CURRENT_TIMESTAMP()) AS minutes_ago FROM POSTS 
    LEFT JOIN users ON posts.user_id = users.id
    WHERE subreddit_id = ?
    ORDER BY created_at DESC LIMIT 20`,

    top: `SELECT POSTS.id, numVotes, title, content, created_at, subreddit_id, userName, TIMESTAMPDIFF(MINUTE, created_at, CURRENT_TIMESTAMP()) AS minutes_ago FROM POSTS 
    LEFT JOIN users ON posts.user_id = users.id
    WHERE subreddit_id = ?
    ORDER BY numVotes DESC, created_at DESC LIMIT 20`
}


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
    res.render("subreddit", params);
}



const getPosts = async function(subredditId, filter) {
    let query = filters[filter];

    if (!query) return undefined;

    query = mysql.format(query, [subredditId]);
    let posts = (await dbCon.query(query))[0];

    for (let post of posts)
    {
        query = "SELECT COUNT(*) FROM comments WHERE post_id = ?";
        post.numComments = (await dbCon.query(`SELECT COUNT(*) as count FROM comments WHERE post_id = ${post.id}`))[0][0].count;
        post.voteDirection = 0;
    }

    return posts;
}

module.exports = {subredditExists, createSubreddit, createSubredditView, loadSubreddit, getPosts};