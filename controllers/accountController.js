"use strict";
require("express-async-errors")
const errors = require(baseDir + "/utils/error")

const db = require(baseDir + "/utils/db");
const dbCon = db.pool;
const mysql = db.mysql;
const queryDb = db.queryDb;

const bcrypt = require("bcrypt");
const {User, logIn} = require(baseDir + "/utils/user");
const {getNumComments, getPostVoteDirection} = require(baseDir + "/utils/post");
const {parseTimeSinceCreation, getPageNumOffset} = require(baseDir + "/utils/misc");
const {getCommentVoteDirection} = require(baseDir + "/utils/comment");

const authenticateUser = async function(req, res) {
    if (req.session.loggedIn)
    {
        res.status(200).send("Already logged in.");
        return;
    }

    let sql = "SELECT * FROM users where userName = ?;";
    sql = mysql.format(sql, [req.body.username]);
    let result = await dbCon.query(sql);
    result = result[0];

    if (result.length > 1)
    {
        throw new Error(`Multiple users with username: ${req.body.username}`);
    }

    if(result.length === 0 || !(await bcrypt.compare(req.body.password, result[0].userPassword)))
    {
        res.status(401).send("Incorrect password or user does not exist.");
        return;
    }

    logIn(result[0].userName, result[0].id, req);
    res.status(200).send("Successfully logged in.");
};

const getUser = async function(req, res, next) {
    if(!req.session.loggedIn)
    {
        next();
        return;
    }

    req.user = new User(req.session.userID, req.session.user);
    await req.user.getSubscribedSubreddits();
    next();
}

const logOut = function(req, res)
{
    if(req.session.loggedIn)
    {
        req.session.destroy();
    }
    res.redirect("/");
}


const createUser = async function(req, res)
{
    //check if input matches format
    const usernameValidation = new RegExp("^[a-zA-Z0-9_-]{3,20}$");
    if(!usernameValidation.test(req.body.username))
    {
        res.status(400).send("Username does not meet requirements!");
        return;
    }

    //check if passwords meets format
    const atLeastOneNum = new RegExp(".*[0-9].*");
    const atLeastOneAlpha = new RegExp(".*[a-zA-Z].*");
    const atLeastOneSpecial = new RegExp(".*[!@._-].*");
    const passwordValidation = new RegExp("^[a-zA-Z0-9!@._-]{8,30}$")

    if (!passwordValidation.test(req.body.password) || !atLeastOneAlpha.test(req.body.password) || !atLeastOneNum.test(req.body.password) || !atLeastOneSpecial.test(req.body.password))
    {
        res.status(400).send("Password does not meet requirements!");
        return;
    }

    let result = await getUserDataByName(req.body.username);
    if(result)
    {
        res.status(400).send("Username already taken!");
        return;
    }

    //hashing password and creating user
    let hashedPassword = await bcrypt.hash(req.body.password, 10);
    sql = "INSERT INTO users (userName, userPassword) VALUES(?, ?);";
    sql = mysql.format(sql, [req.body.username, hashedPassword]);
    result = await dbCon.query(sql);
    logIn(req.body.username, result[0].insertId, req);
    res.status(200).send("Account Created!");
}

const getUserDataByName = async function(userName)
{
    //checking if username exists
    let result = await queryDb("SELECT * FROM users WHERE userName = ?", [userName]);

    if(result.length < 1) return undefined;

    return result;
}



const getProfilePage = async function(req, res)
{
    let result = await queryDb("SELECT * FROM users WHERE userName = ?", [req.params.username]);
    if (!result)
    {
        res.status(400).send("Looks like that user doesn't exist.");
        return;
    }

    let userActivity = await getRecentUserActivity(result[0].id, POSTS_PER_PAGE, 0);

    let params = {
        pageNum: 1,
        activities: userActivity,
        user: req.user,
        profileName: req.params.username
    }


    res.render("profilePage", params);


    return;
}

const getRecentUserActivity = async function(userId, limit, offset)
{
    let recentActivityIds = await queryDb(
        `(SELECT id as postId, NULL as commentId, created_at FROM posts
            WHERE user_id = ?
            UNION ALL 
            SELECT NULL as postId, id as commentId, created_at FROM comments
            WHERE user_id = ?)
            ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            [userId, userId, limit, offset]
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

const getNextProfilePage = async function(req, res)
{
    let result = await queryDb("SELECT * FROM users WHERE userName = ?", [req.params.username]);
    if (!result)
    {
        res.status(400).send("Looks like that user doesn't exist.");
        return;
    }
    req.params.pageNum =parseInt(req.params.pageNum) + 1;
    let pageOffset = getPageNumOffset(req.params.pageNum);

    let userActivity = await getRecentUserActivity(result[0].id, POSTS_PER_PAGE, pageOffset);


    let params = {
        pageNum: req.params.pageNum,
        activities: userActivity,
        username: req.session.loggedIn ? req.session.user : undefined,
        profileName: req.params.username
    }

    res.render("activityList", params);
    
}


const changeUserSubscription = async function(req, res)
{
    if (!req.session.loggedIn)
    {
        res.status(401).send("User not logged in.");
        return;
    }

    let isSubbed = (await queryDb("SELECT * FROM subredditSubscriptions WHERE user_id = ? AND subreddit_id = ?", [req.session.userID, req.body.subredditId])).length;

    if(isSubbed)
    {
        unsubscribeToSubreddit(req.session.userID, req.body.subredditId);
        res.send("UNSUBSCRIBED");
    }
    else
    {
        subscribeToSubreddit(req.session.userID, req.body.subredditId);
        res.send("SUBSCRIBED");
    }
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

module.exports = {authenticateUser, logOut, createUser, getProfilePage, getNextProfilePage, changeUserSubscription, getUser};