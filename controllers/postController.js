"use strict";
const errors = require(baseDir + "/utils/error");
const db = require(baseDir + "/utils/db");
const dbCon = db.pool;
const mysql = db.mysql;
const queryDb = db.queryDb;

const {updateRank, calculateRank} = require(baseDir + "/utils/updateRanking");
const {getPostData, getPostVoteDirection} = require(baseDir + "/utils/post");
const {getCommentData} = require(baseDir + "/utils/comment");

const loadPost = async function (req, res)
{
    let postData = await getPostData(req.session.userID, req.params.postId);

    if(!postData)
    {
        res.status(404).send("Page not found.");
        return;
    }

    let commentData = await getCommentData(req.params.postId, req.session.userID);

    let params = {
        subreddit: req.subredditObj,
        post: postData,
        comments: commentData,
        username: req.session.loggedIn ? req.session.user : undefined
    }
    console.log(postData);
    res.render(baseDir + "/views/post", params);
}

const createPost = async function(req, res) {
    if(!req.session.loggedIn)
    {
        res.send("You must be logged in to do that.");
    }
    else
    {
        let rankScore = calculateRank(1, new Date());
        let result = await queryDb("INSERT INTO posts (title, content, subreddit_id, user_id, score) VALUES (?, ?, ?, ?, ?)",
                                    [req.body.postTitle, req.body.content, req.subredditObj.id, req.session.userID, rankScore]);

        res.redirect(`/r/${req.params.subreddit}/post/${result.insertId}`);
    }
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



module.exports = {loadPost, createPost, voteOnPost};