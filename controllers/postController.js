"use strict";

const errors = require(baseDir + "/utils/error");
const db = require(baseDir + "/utils/db");
const dbCon = db.pool;
const mysql = db.mysql;
const queryDb = db.queryDb;

const {updateRank, calculateRank} = require(baseDir + "/utils/updateRanking");
const {getPostData, getPostVoteDirection, getNumComments, Post} = require(baseDir + "/utils/post");
const {getCommentData} = require(baseDir + "/utils/comment");
const {isValidUrl, getArticleTitle} = require(baseDir + "/utils/misc");

const getPost = async function(req, res, next)
{
    const postData = await getPostData(req.session.userId, req.params.postId);
    if(!postData)
    {
        res.status(404).send("Page not found.");
        return;
    }
    
    req.postObj = new Post(req.params.postId, postData.title, postData.postLink, postData.content, postData.numVotes, 
        postData.userId, postData.userName, postData.minutes_ago, await getPostVoteDirection(req.session.userID, req.params.postId), await getNumComments(req.params.postId));
    // /        constructor(id, title, content, numVotes, userId, userName, pageNum)
    next();
}

const createPostView = async function (req, res)
{
    let commentData = await getCommentData(req);
    if(!commentData){
        throw new error("Something happened(Invalid comment data...)");
        return;
    }

    let params = {
        subreddit: req.subredditObj,
        post: req.postObj,
        comments: commentData,
        username: req.session.loggedIn ? req.session.user : undefined,
        filter: req.params.filter ? req.params.filter : "top"
    }
    res.render(baseDir + "/views/post", params);
}

const createPost = async function(req, res) {
    if(!req.session.loggedIn)
    {
        res.status(401).send("You must be logged in to do that.");
        return;
    }
    if(req.body.postLink != "")
    {
        if(!isValidUrl(req.body.postLink))
        {
            res.status(400).send("Something seems to be wrong with the URL");
            return;
        }
        if(req.body.useArticleTitle)
        {
            let articleTitle = await getArticleTitle(req.body.postLink);
            if(articleTitle != "") req.body.postTitle = articleTitle;
        }
    }
    let rankScore = calculateRank(1, new Date());

    let query = mysql.format("INSERT INTO posts (title, content, link, subreddit_id, user_id, score) VALUES (?, ?, ?, ?, ?, ?)", [req.body.postTitle, req.body.postContent, req.body.postLink, req.subredditObj.id, req.session.userID, rankScore]);
    console.log(query);
    let result = await queryDb("INSERT INTO posts (title, content, link, subreddit_id, user_id, score) VALUES (?, ?, ?, ?, ?, ?)",
                                [req.body.postTitle, req.body.postContent, req.body.postLink, req.subredditObj.id, req.session.userID, rankScore]);


    res.status(200).send(`${result.insertId}`);
    //res.redirect(`/r/${req.params.subreddit}/post/${result.insertId}`);
}


const voteOnPost = async function(req, res) {
    if(!req.session.loggedIn)
    {
        res.status(401).send("You must be logged in to do that");
    }
    else
    {
        let userVote = await getPostVoteDirection(req.session.userID, req.params.postId);
        let changeInVote = 0;
        if(userVote == 0) //user hasn't voted on this post; create new vote entry
        {
            await queryDb("INSERT INTO postVotes (user_id, post_id, direction) VALUES (?, ?, ?)", [req.session.userID, req.params.postId, req.body.direction]);
            changeInVote = req.body.direction;
        }
        else if (userVote == req.body.direction) //clicking the same vote direction again after already voting will undo the vote; we delete this record to undo the vote
        {
            await queryDb("DELETE FROM postVotes WHERE user_id = ? AND post_id = ?", [req.session.userID, req.params.postId]);
            changeInVote = -req.body.direction;
        }
        else //user wants to change their vote direction; alter existing vote record
        {
            await queryDb("UPDATE postVotes SET direction = ? WHERE user_id = ? AND post_id = ?", [req.body.direction, req.session.userID, req.params.postId]);
            if (req.body.direction == -1) changeInVote = -2;
            else changeInVote = 2;
        }

        //Need to update numVotes in posts table with the new vote
        await queryDb("UPDATE posts SET numVotes = numVotes + ? WHERE id = ?", [changeInVote, req.params.postId]);

        //After updating votes, we have to recalculate the rank
        updateRank(req.params.postId);

        res.send(`${changeInVote}`);
    }
}


module.exports = {createPostView, createPost, voteOnPost, getPost};