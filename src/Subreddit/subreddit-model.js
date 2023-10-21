"use strict";
require("express-async-errors")
const errors = require(baseDir + "/src/utils/error")

const db = require(baseDir + "/src/utils/db");
const dbCon = db.pool;
const mysql = db.mysql;
const queryDb = db.queryDb;

const {getPageNumOffset} = require(baseDir + "/src/utils/misc");
const {parseTimeSinceCreation} = require(baseDir + "/src/utils/misc");
const postModel = require(baseDir + "/src/Post/post-model");

const loadSubredditData = async function(subredditName) {
    let result = await queryDb("SELECT * FROM subreddits WHERE title = ?", [subredditName]);

    if (result.length === 0)
    {
        return undefined;
    }
    return result[0];
};


const getSubredditPosts = async function(params) {
    let sqlFilter = getFilterQuery(params.filter);
    let sqlOffset = getPageNumOffset(params.pageNum);

    let query;
    if(!params.subreddit) //get posts from all subreddits if frontpage
    {
        query = `SELECT POSTS.id, numVotes, posts.title AS title, content, imgSrc, link as postLink, created_at, subreddit_id, subreddits.title AS subredditName, userName, TIMESTAMPDIFF(MINUTE, created_at, CURRENT_TIMESTAMP()) AS minutes_ago FROM POSTS 
        LEFT JOIN users ON posts.user_id = users.id
        LEFT JOIN subreddits on posts.subreddit_id = subreddits.id
        ORDER BY ${sqlFilter} DESC LIMIT ${POSTS_PER_PAGE} OFFSET ?`;
        query = mysql.format(query, [sqlOffset]);
    }
    else
    {
        query = `SELECT POSTS.id, numVotes, posts.title AS title, content, imgSrc, link as postLink, created_at, subreddit_id, subreddits.title AS subredditName, userName, TIMESTAMPDIFF(MINUTE, created_at, CURRENT_TIMESTAMP()) AS minutes_ago FROM POSTS 
        LEFT JOIN users ON posts.user_id = users.id
        LEFT JOIN subreddits on posts.subreddit_id = subreddits.id
        WHERE subreddit_id = ?
        ORDER BY ${sqlFilter} DESC LIMIT ${POSTS_PER_PAGE} OFFSET ?`;
        query = mysql.format(query, [params.subreddit.id, sqlOffset]);
    }

    let posts = (await dbCon.query(query))[0];
    for (let post of posts)
    {
        post.numComments = await postModel.getNumComments(post.id);
        post.voteDirection = await postModel.getPostVoteDirection(params.userID, post.id);
        post.timeSinceCreation = parseTimeSinceCreation(post.minutes_ago);
    }

    return posts;
};

const insertSubreddit = async function(subredditName, description, sidebar, userId)
{
    await queryDb("INSERT INTO subreddits (title, description, sidebar, createdBy) VALUES(?, ?, ?, ?)",
                [subredditName, description, sidebar, userId]);
    return;
}


const filters = {

    hot: "score",
    new: "created_at",
    top: "numVotes"
};

const getFilterQuery = function(filter)
{
    if(!filter) filter = "hot"; //default filter

    let orderBy = filters[filter];
    if(!orderBy) orderBy = filters["hot"];
    return orderBy;
}

module.exports = {loadSubredditData, getSubredditPosts, insertSubreddit };