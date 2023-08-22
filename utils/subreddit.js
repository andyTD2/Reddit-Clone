"use strict";
require("express-async-errors")
const errors = require(baseDir + "/utils/error")

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
};

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

module.exports = {getPosts, subredditExists, loadSubreddit};