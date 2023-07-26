"use strict";
const db = require(baseDir + "/utils/db");
const dbCon = db.pool;
const mysql = db.mysql;


const loadPost = async function (req, res)
{
    let query = "SELECT * from posts WHERE id = ?;";
    query = mysql.format(query, [req.params.postId]);
    let result = (await dbCon.query(query))[0];

    if(result.length == 0)
    {
        res.status(404).send("Page not found.");
    }
    else
    {
        query = `SELECT COMMENTS.id, numVotes, content, created_at, user_id, post_id, userName FROM COMMENTS 
        LEFT JOIN users ON comments.user_id = users.id
        WHERE post_id = ? 
        ORDER BY created_at DESC LIMIT 50`;

        query = mysql.format(query, [req.params.postId]);
        let commentResult = (await dbCon.query(query))[0];

        let params = {
            subreddit: req.subredditObj,
            post: result[0],
            comments: commentResult
        }
        if (req.session.loggedIn)
        {
            params.username = req.session.user;
        }
        res.render(baseDir + "/views/post", params);
    }
}

const createPost = async function(req, res) {
    if(!req.session.loggedIn)
    {
        res.send("You must be logged in to do that.");
    }
    else
    {
        let query = "INSERT INTO posts (title, content, subreddit_id, user_id) VALUES (?, ?, ?, ?)";
        query = mysql.format(query, [req.body.postTitle, req.body.content, req.subredditObj.id, req.session.userID]);
        let result = await dbCon.query(query);
        res.redirect(`/r/${req.params.subreddit}/post/${result[0].insertId}`);
    }
}

const createComment = async function(req, res) {
    if(!req.session.loggedIn)
    {
        res.send("You must be logged in to do that");
    }
    else
    {
        let query = "INSERT INTO comments (content, user_id, post_id) VALUES (?, ?, ?)";
        query = mysql.format(query, [req.body.comment, req.session.userID, req.params.postId]);
        let result = (await dbCon.query(query))[0];
        res.redirect("back");
    }
};


module.exports = {loadPost, createPost, createComment};