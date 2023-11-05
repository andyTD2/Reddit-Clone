"use strict";
const errors = require(baseDir + "/src/utils/error");
const db = require(baseDir + "/src/utils/db");
const dbCon = db.pool;
const mysql = db.mysql;
const queryDb = db.queryDb;
const commentService = require(baseDir + "/src/Comment/comment-service");
const commentModel = require(baseDir + "/src/Comment/comment-model")

const handleCommentVoteRequest = async function(req, res) {
    if (!req.session.loggedIn)
    {
        res.status(401).send("You must be logged in to do that");
        return;
    }

    let commentVote = await commentService.voteOnComment(req.session.userID, req.params.commentId, req.body.direction);
    if(!commentVote.ok)
    {
        res.status(commentVote.statusCode).send(commentVote.error);
        return;
    }
    res.send(`${commentVote.changeInVote}`);
};

const handleNewCommentRequest = async function(req, res) {
    if(!req.session.loggedIn)
    {
        res.status(401).send("You must be logged in to do that");
        return;
    }

    await commentModel.insertComment(req.body.comment, req.session.userID, req.params.postId, req.body.parentId);

    res.redirect("back");
};

const handleLoadCommentsRequest = async function(req, res) {
    let commentData = await commentService.getComments(req.session.userID, req.params.postId, req.pageNum, req.params.filter, req.postData, req.subredditData);
    if(!commentData.ok)
    {
        res.status(commentData.statusCode).send(commentData.error);
        return;
    }
    res.render(baseDir + "/views/commentList", commentData.params);
}

module.exports = { handleCommentVoteRequest, handleNewCommentRequest, handleLoadCommentsRequest };