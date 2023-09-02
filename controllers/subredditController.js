"use strict";

const { getAllPosts } = require("../utils/subreddit");

require("express-async-errors")
const errors = require(baseDir + "/utils/error")

const db = require(baseDir + "/utils/db");
const dbCon = db.pool;
const mysql = db.mysql;
const queryDb = db.queryDb;

const {getPosts, getSubredditData, loadSubreddit, getPostVoteDirection} = require(baseDir + "/utils/subreddit");
const {getNumComments} = require(baseDir + "/utils/post");
const Subreddit = require(baseDir + "/utils/subreddit").Subreddit;


///////////////////////////////////
///////// MIDDLEWARES /////////////
///////////////////////////////////

const getSubreddit = async function(req, res, next) {
    const result = await getSubredditData(req.params.subreddit);
    if(result)
    {
        req.subredditObj = new Subreddit(result.id, result.title);
        console.log(req.params.pageNum);
        next();
    }
    else
    {
        res.status(404).send("Page not found");
    }
}

const getPageNum = function(req, res, next) {
    req.subredditObj.pageNum = req.params.pageNum;
    next();
}

//////////////////////////////////////
/////////// ROUTES ///////////////////
//////////////////////////////////////

//all is a special subreddit that has content from all subreddits
const getAll = async function(req, res) {
    req.params.pageNum = 1;
    let params = {
        posts: await getAllPosts(req),
        filter: req.params.filter,
        username: req.session.loggedIn ? req.session.user : undefined,
        pageNum: 1
    }

    res.render("frontpage", params);
}

const createSubreddit = async function(req, res) {
    if(!req.session.loggedIn)
    {
        res.send("You must be logged in to do that.");
    }
    else
    {
        if(await getSubredditData(req.body.subredditName))
        {
            res.send("This subreddit name has already been taken.");
        }
        else
        {
            let query = "INSERT INTO subreddits (title, description, sidebar, createdBy) VALUES(?, ?, ?, ?)"
            query = mysql.format(query, [req.body.subredditName, req.body.description, req.body.sidebar, req.session.userID]);
            let result = await dbCon.query(query);
            res.redirect(`/r/${req.body.subredditName}`);
        }
    }
}


const createSubredditView = async function(req, res) {
    let params = {
        subreddit: req.subredditObj,
        posts: await getPosts(req),
        filter: req.params.filter,
        username: req.session.loggedIn ? req.session.user : undefined
    }

    res.render("subreddit", params);
}

const getNextPage = async function(req, res) {
    req.subredditObj.pageNum = parseInt(req.subredditObj.pageNum) + 1;
    const posts = await getPosts(req);

    res.render(baseDir + "/views/postList.ejs", {posts: posts, subreddit: req.subredditObj});
}



module.exports = {createSubreddit, createSubredditView, getSubreddit, getNextPage, getAll, getPageNum};