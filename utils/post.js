"use strict";
const errors = require(baseDir + "/utils/error");
const db = require(baseDir + "/utils/db");
const dbCon = db.pool;
const mysql = db.mysql;
const queryDb = db.queryDb;
const {parseTimeSinceCreation} = require(baseDir + "/utils/misc");

class Post {
    constructor(id, title, postLink, imgSrc, content, numVotes, userId, userName, minutes_ago, voteDirection, numComments, pageNum)
    {
        if(!pageNum) this.pageNum = 1;
        else this.pageNum = pageNum;

        this.id = id;
        this.title = title;
        this.content = content;
        this.numVotes = numVotes;
        this.userId = userId;
        this.userName = userName;
        this.timeSinceCreation = parseTimeSinceCreation(minutes_ago);
        this.voteDirection = voteDirection;
        this.numComments = numComments;
        this.postLink = postLink;
        this.imgSrc = imgSrc;
    }

}

const getNumComments = async function(postId)
{
    let numComments = await queryDb("SELECT COUNT(*) AS count FROM COMMENTS WHERE post_id = ?", [postId]);
    return numComments[0].count;
}

const getPostData = async function(userId, postId)
{
    let query = `SELECT POSTS.id, title, numVotes, content, imgSrc, link as postLink, subreddit_id AS subredditId, user_id AS userId, userName, TIMESTAMPDIFF(MINUTE, created_at, CURRENT_TIMESTAMP()) as minutes_ago from posts 
    LEFT JOIN users ON posts.user_id = users.id
    WHERE posts.id = ?;`;

    let result = await queryDb(query, [postId]);
    if(result.length == 0) return undefined;

    result[0].numComments = await getNumComments(postId);
    result[0].voteDirection = await getPostVoteDirection(userId, postId);

    return result[0];
};

const getPostVoteDirection = async function(userId, postId)
{
    if(!userId) return 0;
    let result = await queryDb("SELECT * FROM postVotes WHERE user_id = ? AND post_id = ?", [userId, postId]);
    if (result.length === 0) return 0;
    if (result.length > 1) throw new Error(`Duplicate postVote records for user: ${userId} on post: ${postId}`);
    if (result[0].direction != -1 && result[0].direction != 1) throw new Error(`Invalid vote direction: ${result[0].direction} for table: postVotes for user: ${userId} on post: ${postId}`);
    return result[0].direction;
};



module.exports = {getPostData, getPostVoteDirection, getNumComments, Post};