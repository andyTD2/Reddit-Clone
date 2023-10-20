const db = require(baseDir + "/utils/db");
const dbCon = db.pool;
const mysql = db.mysql;
const queryDb = db.queryDb;


const {getNumComments, getPostVoteDirection} = require(baseDir + "/utils/post");
const {parseTimeSinceCreation} = require(baseDir + "/utils/misc");
const {getCommentVoteDirection} = require(baseDir + "/utils/comment");
const {getPageNumOffset} = require(baseDir + "/utils/misc");


const findUser = async function(username)
{
    let sql = "SELECT * FROM users where userName = ?;";
    let result = await queryDb(sql, [username]);
    return result;
}

const getUserSubscriptionStatus = async function(userId, subId)
{
    return userId && subId && (await queryDb("SELECT * FROM subredditSubscriptions WHERE user_id = ? AND subreddit_id = ?", [userId, subId])).length;
}

const subscribeToSubreddit = async function(userId, subId)
{
    await queryDb("INSERT INTO subredditSubscriptions (user_id, subreddit_id) VALUES (?, ?)", [userId, subId]);
    return;
}

const unsubscribeToSubreddit = async function(userId, subId)
{
    await queryDb("DELETE FROM subredditSubscriptions WHERE user_id = ? AND subreddit_id = ?", [userId, subId]);
    return;
}

const getUserDataByName = async function(username)
{
    //Query for user
    let result = await queryDb("SELECT * FROM users WHERE userName = ?", [username]);

    //If length of return result is < 1 it means user doesn't exist, return undefined
    if(result.length < 1) return undefined;

    //else return the user's information
    return result;
}

const insertUser = async function(username, hashedPassword)
{
    let result = await queryDb("INSERT INTO users (userName, userPassword) VALUES(?, ?);", [username, hashedPassword]);
    return result.insertId;
}


const getRecentUserActivity = async function(profileId, userId, limit, pageNum)
{
    let offset = getPageNumOffset(pageNum);
    let recentActivityIds = await queryDb(
        `(SELECT id as postId, NULL as commentId, created_at FROM posts
            WHERE user_id = ?
            UNION ALL 
            SELECT NULL as postId, id as commentId, created_at FROM comments
            WHERE user_id = ?)
            ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            [profileId, profileId, limit, offset]
    );

    for (let i = 0; i < recentActivityIds.length; i++)
    {
        if (recentActivityIds[i].postId)
        {
            recentActivityIds[i] = (await queryDb(`SELECT posts.id as postId, posts.title as postTitle, subreddits.title as subredditTitle, numVotes as numPostVotes, 
                                content, TIMESTAMPDIFF(MINUTE, created_at, CURRENT_TIMESTAMP()) AS minutes_ago, subreddit_id, link as postLink, imgSrc 
                                FROM posts LEFT JOIN subreddits ON posts.subreddit_id = subreddits.id
                                WHERE posts.id = ?`,
                                [recentActivityIds[i].postId]))[0];


            recentActivityIds[i].numComments = await getNumComments(recentActivityIds[i].postId);
            recentActivityIds[i].voteDirection = await getPostVoteDirection(userId, recentActivityIds[i].postId);
            recentActivityIds[i].timeSinceCreation = parseTimeSinceCreation(recentActivityIds[i].minutes_ago);
        }
        else
        {
            recentActivityIds[i] = (await queryDb(`SELECT comments.id as commentId, comments.numVotes as numCommentVotes, comments.content as commentContent, 
                                TIMESTAMPDIFF(MINUTE, comments.created_at, CURRENT_TIMESTAMP()) AS minutes_ago, 
                                TIMESTAMPDIFF(MINUTE, posts.created_at, CURRENT_TIMESTAMP()) AS minutes_ago_post,
                                comments.user_id, post_id as postId, 
                                posts.title as postTitle, subreddit_id, subreddits.title as subredditTitle, link as postLink, imgSrc, username as postAuthor
                                FROM comments LEFT JOIN posts ON post_id = posts.id
                                LEFT JOIN subreddits ON posts.subreddit_id = subreddits.id 
                                LEFT JOIN users on posts.user_id = users.id
                                WHERE comments.id = ?`,
                                [recentActivityIds[i].commentId]))[0];

            recentActivityIds[i].commentVoteDirection = await getCommentVoteDirection(userId, recentActivityIds[i].commentId);
            recentActivityIds[i].timeSincePostCreation = parseTimeSinceCreation(recentActivityIds[i].minutes_ago_post);
            recentActivityIds[i].timeSinceCommentCreation = parseTimeSinceCreation(recentActivityIds[i].minutes_ago);
            recentActivityIds[i].postVoteDirection = await getPostVoteDirection(userId, recentActivityIds[i].postId);
        }
    }

    return recentActivityIds;
}




module.exports = {findUser, getUserSubscriptionStatus, subscribeToSubreddit, unsubscribeToSubreddit, getUserDataByName, insertUser, getRecentUserActivity};
