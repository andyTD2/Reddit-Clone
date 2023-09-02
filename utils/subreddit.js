"use strict";
require("express-async-errors")
const errors = require(baseDir + "/utils/error")

const db = require(baseDir + "/utils/db");
const dbCon = db.pool;
const mysql = db.mysql;
const queryDb = db.queryDb;
const { getPostVoteDirection, getNumComments } = require(baseDir + "/utils/post");
const {parseTimeSinceCreation, getPageNumOffset} = require(baseDir + "/utils/misc");
global.POSTS_PER_PAGE = 20;

const filters = {

    hot: "score",
    new: "created_at",
    top: "numVotes"
}

class Subreddit {
    constructor(id, name, pageNum)
    {
        if(!pageNum) this.pageNum = 1;
        else this.pageNum = pageNum;

        this.id = id;
        this.name = name;
        this.moderators = [];
    }

}

const loadSubreddit = function(queryResult) {
    return new Subreddit(queryResult.id, queryResult.title);
}

const getFilter = function(filter)
{
    if(!filter) filter = "hot"; //default filter

    let orderBy = filters[filter];
    if(!orderBy) orderBy = filters["hot"];
    return orderBy;
}


const getPosts = async function(req) {
    let sqlFilter = getFilter(req.params.filter);

    let query = `SELECT POSTS.id, numVotes, title, content, created_at, subreddit_id, userName, TIMESTAMPDIFF(MINUTE, created_at, CURRENT_TIMESTAMP()) AS minutes_ago FROM POSTS 
    LEFT JOIN users ON posts.user_id = users.id
    WHERE subreddit_id = ?
    ORDER BY ${sqlFilter} DESC LIMIT ${POSTS_PER_PAGE} OFFSET ?`;

    let sqlOffset = getPageNumOffset(req.subredditObj.pageNum);

    query = mysql.format(query, [req.subredditObj.id, sqlOffset]);
    let posts = (await dbCon.query(query))[0];

    for (let post of posts)
    {
        post.numComments = await getNumComments(post.id);
        post.voteDirection = await getPostVoteDirection(req.session.userID, post.id);
        post.timeSinceCreation = parseTimeSinceCreation(post.minutes_ago);
    }

    return posts;
};

const getAllPosts = async function(req) {
    let sqlFilter = getFilter(req.params.filter);

    let query = `SELECT POSTS.id, numVotes, posts.title AS title, content, created_at, subreddit_id, subreddits.title AS subredditName, userName, TIMESTAMPDIFF(MINUTE, created_at, CURRENT_TIMESTAMP()) AS minutes_ago FROM POSTS 
    LEFT JOIN users ON posts.user_id = users.id
    LEFT JOIN subreddits on posts.subreddit_id = subreddits.id
    ORDER BY ${sqlFilter} DESC LIMIT ${POSTS_PER_PAGE} OFFSET ?`;

    let sqlOffset = getPageNumOffset(req.params.pageNum);

    query = mysql.format(query, [sqlOffset]);
    let posts = (await dbCon.query(query))[0];

    for (let post of posts)
    {
        post.numComments = await getNumComments(post.id);
        post.voteDirection = await getPostVoteDirection(req.session.userID, post.id);
        post.timeSinceCreation = parseTimeSinceCreation(post.minutes_ago);
    }

    return posts;
}

const getSubredditData = async function(subredditName) {
    let result = await queryDb("SELECT * FROM subreddits WHERE title = ?", [subredditName]);

    if (result.length === 0)
    {
        return undefined;
    }
    return result[0];
};

module.exports = {getPosts, getSubredditData, loadSubreddit, getAllPosts, Subreddit};