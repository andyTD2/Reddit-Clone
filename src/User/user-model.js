const db = require(baseDir + "/src/utils/db");
const dbCon = db.pool;
const mysql = db.mysql;
const queryDb = db.queryDb;

const {parseTimeSinceCreation} = require(baseDir + "/src/utils/misc");
const {getPageNumOffset} = require(baseDir + "/src/utils/misc");
const commentModel = require(baseDir + "/src/Comment/comment-model");
const postModel = require(baseDir + "/src/Post/post-model");


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

const getSubscribedSubreddits = async function(userId)
{
    return (await queryDb("SELECT subreddit_id as subredditId, title FROM subredditSubscriptions LEFT JOIN subreddits ON subreddit_id = subreddits.id WHERE user_id = ?", [userId]));
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
            recentActivityIds[i] = (await queryDb(`SELECT posts.id as id, posts.title as title, subreddits.title as subredditName, numVotes, 
                                content, TIMESTAMPDIFF(MINUTE, created_at, CURRENT_TIMESTAMP()) AS minutes_ago, subreddit_id, link as postLink, imgSrc 
                                FROM posts LEFT JOIN subreddits ON posts.subreddit_id = subreddits.id
                                WHERE posts.id = ?`,
                                [recentActivityIds[i].postId]))[0];


            recentActivityIds[i].numComments = await postModel.getNumComments(recentActivityIds[i].id);
            recentActivityIds[i].voteDirection = await postModel.getPostVoteDirection(userId, recentActivityIds[i].id);
            recentActivityIds[i].timeSinceCreation = parseTimeSinceCreation(recentActivityIds[i].minutes_ago);
            recentActivityIds[i].type = "POST";
        }
        else
        {
            recentActivityIds[i] = (await queryDb(`SELECT comments.id as id, comments.numVotes as numVotes, comments.content as content, 
                                TIMESTAMPDIFF(MINUTE, comments.created_at, CURRENT_TIMESTAMP()) AS minutes_ago, 
                                TIMESTAMPDIFF(MINUTE, posts.created_at, CURRENT_TIMESTAMP()) AS minutes_ago_post,
                                comments.user_id, post_id as postId, 
                                posts.title as postTitle, subreddit_id, subreddits.title as subredditName, link as postLink, imgSrc, username as postAuthor
                                FROM comments LEFT JOIN posts ON post_id = posts.id
                                LEFT JOIN subreddits ON posts.subreddit_id = subreddits.id 
                                LEFT JOIN users on posts.user_id = users.id
                                WHERE comments.id = ?`,
                                [recentActivityIds[i].commentId]))[0];

            recentActivityIds[i].voteDirection = await commentModel.getCommentVoteDirection(userId, recentActivityIds[i].id);
            recentActivityIds[i].timeSincePostCreation = parseTimeSinceCreation(recentActivityIds[i].minutes_ago_post);
            recentActivityIds[i].timeSinceCommentCreation = parseTimeSinceCreation(recentActivityIds[i].minutes_ago);
            recentActivityIds[i].postVoteDirection = await postModel.getPostVoteDirection(userId, recentActivityIds[i].postId);
            recentActivityIds[i].type = "COMMENT";
        }
    }

    return recentActivityIds;
}




module.exports = {findUser, getUserSubscriptionStatus, subscribeToSubreddit, unsubscribeToSubreddit, getUserDataByName, insertUser, getRecentUserActivity, getSubscribedSubreddits};
