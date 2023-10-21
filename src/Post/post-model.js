"use strict";
const errors = require(baseDir + "/src/utils/error");

const db = require(baseDir + "/src/utils/db");
const dbCon = db.pool;
const mysql = db.mysql;
const queryDb = db.queryDb;

const {calculateRank} = require(baseDir + "/src/utils/updateRanking");
const {getPageNumOffset, parseTimeSinceCreation} = require(baseDir + "/src/utils/misc");


const getNumComments = async function(postId)
{
    let numComments = await queryDb("SELECT COUNT(*) AS count FROM COMMENTS WHERE post_id = ?", [postId]);
    return numComments[0].count;
}

const getPostVoteDirection = async function(userId, postId)
{
    if(!userId) return 0;
    let result = await queryDb("SELECT * FROM postVotes WHERE user_id = ? AND post_id = ?", [userId, postId]);
    if (result.length === 0) return 0;
    if (result.length > 1) throw new Error(`Duplicate postVote records for user: ${userId} on post: ${postId}`);
    if (result[0].direction != -1 && result[0].direction != 1) throw new Error(`Invalid vote direction: ${result[0].direction} for table: postVotes for user: ${userId} on post: ${postId}`);
    return result[0].direction;
};


const loadPostData = async function(userId, postId)
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


const insertNewPost = async function(postTitle, postContent, postLink, subredditId, userId, thumbnailImgSrc)
{
    let result = await queryDb("INSERT INTO posts (title, content, link, subreddit_id, user_id, imgSrc, score) VALUES (?, ?, ?, ?, ?, ?, ?)",
                                [postTitle, postContent, postLink, subredditId, userId, thumbnailImgSrc, calculateRank(1, new Date())]);
    
    return result.insertId;
};


const insertPostVote = async function(userId, postId, voteDirection)
{
    await queryDb("INSERT INTO postVotes (user_id, post_id, direction) VALUES (?, ?, ?)", [userId, postId, voteDirection]);
};

const deletePostVote = async function(userId, postId,)
{
    await queryDb("DELETE FROM postVotes WHERE user_id = ? AND post_id = ?", [userId, postId]);
};

const updatePostVote = async function(userId, postId, voteDirection)
{
    await queryDb("UPDATE postVotes SET direction = ? WHERE user_id = ? AND post_id = ?", [voteDirection, userId, postId]);
};

const updateNumPostVotes = async function(postId, changeInVote)
{
    await queryDb("UPDATE posts SET numVotes = numVotes + ? WHERE id = ?", [changeInVote, postId]);
};

const updatePostRank = async function(postId)
{
    let post = await queryDb("SELECT UNIX_TIMESTAMP(created_at) as created_at, numVotes FROM posts WHERE id = ?", [postId]);

    let newRank = calculateRank(post[0].numVotes, new Date(post[0].created_at * 1000));
    await queryDb("UPDATE posts SET score = ? WHERE id = ?", [newRank, postId]);
}

const getPostsByUserQuery = async function(searchQuery, filterBySubreddit, filterByAuthor, pageNum, curUserId)
{
    let queryParams = [`%${searchQuery}%`];

    let filterOptions = '';
    if(filterBySubreddit)
    {
        filterOptions += ` AND subreddits.title = ?`;
        queryParams.push(filterBySubreddit);
    }
    if(filterByAuthor)
    {
        filterOptions += ` AND userName = ?`;
        queryParams.push(filterByAuthor);
    }

    queryParams.push(getPageNumOffset(pageNum));

    let query = `SELECT POSTS.id, numVotes, posts.title AS title, content, imgSrc, link as postLink, created_at, subreddit_id, subreddits.title AS subredditName, userName, TIMESTAMPDIFF(MINUTE, created_at, CURRENT_TIMESTAMP()) AS minutes_ago FROM POSTS 
    LEFT JOIN users ON posts.user_id = users.id
    LEFT JOIN subreddits on posts.subreddit_id = subreddits.id
    WHERE posts.title LIKE ? 
    ${filterOptions} 
    ORDER BY SCORE DESC LIMIT ${POSTS_PER_PAGE} OFFSET ?`;

    let posts = await queryDb(query, queryParams);
    
    for (let post of posts)
    {
        post.numComments = await getNumComments(post.id);
        post.voteDirection = await getPostVoteDirection(curUserId, post.id);
        post.timeSinceCreation = parseTimeSinceCreation(post.minutes_ago);
    }

    return posts;
}

module.exports = { loadPostData, insertNewPost, insertPostVote, deletePostVote, updatePostVote, updateNumPostVotes, 
            updatePostRank, getPostsByUserQuery, getPostVoteDirection, getNumComments };