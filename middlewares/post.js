"use strict";

require("express-async-errors")
const errors = require(baseDir + "/utils/error")

const db = require(baseDir + "/utils/db");
const dbCon = db.pool;
const mysql = db.mysql;
const queryDb = db.queryDb;

const { getPostData, Post, getPostVoteDirection, getNumComments } = require(baseDir + "/utils/post");

const getPost = async function(req, res, next)
{
    const postData = await getPostData(req.session.userId, req.params.postId);
    if(!postData)
    {
        res.status(404).send("Page not found.");
        return;
    }
    
    req.postObj = new Post(req.params.postId, postData.title, postData.postLink, postData.imgSrc, postData.content, postData.numVotes, 
        postData.userId, postData.userName, postData.minutes_ago, await getPostVoteDirection(req.session.userID, req.params.postId), await getNumComments(req.params.postId));
    // /        constructor(id, title, content, numVotes, userId, userName, pageNum)
    next();
}

module.exports = { getPost };