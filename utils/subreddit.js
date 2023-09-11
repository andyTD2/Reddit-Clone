"use strict";
require("express-async-errors")
const errors = require(baseDir + "/utils/error")

const db = require(baseDir + "/utils/db");
const dbCon = db.pool;
const mysql = db.mysql;
const queryDb = db.queryDb;
const { getPostVoteDirection, getNumComments } = require(baseDir + "/utils/post");
const {parseTimeSinceCreation, getPageNumOffset} = require(baseDir + "/utils/misc");
global.POSTS_PER_PAGE = 5;

const filters = {

    hot: "score",
    new: "created_at",
    top: "numVotes"
}

class Subreddit {
    constructor(id, name, pageNum)
    {
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



const getPosts = async function(params) {
    let sqlFilter = getFilter(params.filter);
    let sqlOffset = getPageNumOffset(params.pageNum);

    let query;
    if(params.id == 1) //id of 1 is a special subreddit that contains posts from all subreddits aka "the frontpage".
    {
        query = `SELECT POSTS.id, numVotes, posts.title AS title, content, created_at, subreddit_id, subreddits.title AS subredditName, userName, TIMESTAMPDIFF(MINUTE, created_at, CURRENT_TIMESTAMP()) AS minutes_ago FROM POSTS 
        LEFT JOIN users ON posts.user_id = users.id
        LEFT JOIN subreddits on posts.subreddit_id = subreddits.id
        ORDER BY ${sqlFilter} DESC LIMIT ${POSTS_PER_PAGE} OFFSET ?`;
        query = mysql.format(query, [sqlOffset]);
    }
    else
    {
        query = `SELECT POSTS.id, numVotes, posts.title AS title, content, created_at, subreddit_id, subreddits.title AS subredditName, userName, TIMESTAMPDIFF(MINUTE, created_at, CURRENT_TIMESTAMP()) AS minutes_ago FROM POSTS 
        LEFT JOIN users ON posts.user_id = users.id
        LEFT JOIN subreddits on posts.subreddit_id = subreddits.id
        WHERE subreddit_id = ?
        ORDER BY ${sqlFilter} DESC LIMIT ${POSTS_PER_PAGE} OFFSET ?`;
        query = mysql.format(query, [params.id, sqlOffset]);
    }

    let posts = (await dbCon.query(query))[0];
    for (let post of posts)
    {
        post.numComments = await getNumComments(post.id);
        post.voteDirection = await getPostVoteDirection(params.userID, post.id);
        post.timeSinceCreation = parseTimeSinceCreation(post.minutes_ago);
    }

    return posts;
};

const getSubredditData = async function(subredditName) {
    let result = await queryDb("SELECT * FROM subreddits WHERE title = ?", [subredditName]);

    if (result.length === 0)
    {
        return undefined;
    }
    return result[0];
};

const getSubredditView = async function(req) {
    let params = {
        subreddit: req.subredditObj,
        pageNum: req.pageNum,
        posts: await getPosts({filter: req.params.filter, pageNum: req.pageNum, id: req.subredditObj.id, userID: req.session.userID}),
        filter: req.params.filter,
        username: req.session.loggedIn ? req.session.user : undefined
    }

    return params;
}

const getNextPage = async function(req) {
    req.pageNum = parseInt(req.pageNum) + 1;
    const posts = await getPosts({filter: req.params.filter, pageNum: req.pageNum, id: req.subredditObj.id, userID: req.session.userID})

    let params = {
        posts: posts,
        subreddit: req.subredditObj,
        pageNum: req.pageNum
    };
    return params;
}


module.exports = {getPosts, getSubredditData, loadSubreddit, getSubredditView, getNextPage, Subreddit};