"use strict";
const errors = require("./error");
const db = require(baseDir + "/utils/db");
const dbCon = db.pool;
const mysql = db.mysql;
const queryDb = db.queryDb;

const {updateRank, calculateRank} = require(baseDir + "/utils/updateRanking");

async function getCommentVoteDirection(userId, commentId)
{
    if(!userId) return 0;

    let result = await queryDb("SELECT direction FROM commentVotes WHERE user_id = ? AND comment_id = ?", [userId, commentId]);
    if (result.length === 0) return 0;
    if (result.length > 1) throw new Error(`Duplicate commentVote records for user: ${userId} on comment: ${commentId}`);
    if (result[0].direction != -1 && result[0].direction != 1) throw new Error(`Invalid vote direction: ${result[0].direction} for table: commentVotes for user: ${userId} on comnment: ${commentId}`);
    
    return result[0].direction;

}

async function getPostData(userId, postId)
{
    let query = `SELECT POSTS.id, title, numVotes, content, subreddit_id, user_id, userName, TIMESTAMPDIFF(MINUTE, created_at, CURRENT_TIMESTAMP()) as minutes_ago from posts 
    LEFT JOIN users ON posts.user_id = users.id
    WHERE posts.id = ?;`;

    let result = await queryDb(query, [postId]);
    if(result.length == 0) return undefined;

    let numComments = await queryDb("SELECT COUNT(*) AS count FROM COMMENTS WHERE post_id = ?", [postId]);
    result[0].numComments = numComments[0].count;

    result[0].voteDirection = await getPostVoteDirection(userId, postId);

    return result[0];
}

async function getCommentData(postId, userId)
{
    let result = await queryDb(
                                `SELECT COMMENTS.id, numVotes, content, created_at, user_id, post_id, userName, TIMESTAMPDIFF(MINUTE, created_at, CURRENT_TIMESTAMP()) AS minutes_ago FROM COMMENTS 
                                LEFT JOIN users ON comments.user_id = users.id
                                WHERE post_id = ? AND parent_id IS null
                                ORDER BY created_at DESC LIMIT 50`,
                                [postId]
    );

    await getChildrenOfComment(result, postId, userId);
    return result;
}

const getChildrenOfComment = async function(commentList, postId, userId) {
    for (let comment of commentList)
    {
        comment.voteDirection = await getCommentVoteDirection(userId, comment.id);

        let childCommentQuery = `SELECT COMMENTS.id, numVotes, content, created_at, user_id, post_id, userName, TIMESTAMPDIFF(MINUTE, created_at, CURRENT_TIMESTAMP()) AS minutes_ago FROM COMMENTS 
        LEFT JOIN users ON comments.user_id = users.id
        WHERE post_id = ? AND parent_id = ?
        ORDER BY created_at DESC LIMIT 50`;

        childCommentQuery = mysql.format(childCommentQuery, [postId, comment.id]);
        comment.children = (await dbCon.query(childCommentQuery))[0];
        await getChildrenOfComment(comment.children, postId, userId);
    }
    return;
}

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

const createComment = async function(req, res) {
    if(!req.session.loggedIn)
    {
        res.send("You must be logged in to do that");
    }
    else
    {
        console.log("posTId", req.params.postId);
        let queryValues = [req.body.comment, req.session.userID, req.params.postId, (req.body.parentId ? req.body.parentId : null)];
        let query = "INSERT INTO comments (content, user_id, post_id, parent_id) VALUES (?, ?, ?, ?)";
        query = mysql.format(query, queryValues);
        let result = (await dbCon.query(query))[0];
        res.redirect("back");
    }
};

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

async function getPostVoteDirection(userId, postId)
{
    if(!userId) return 0;

    let result = await queryDb("SELECT * FROM postVotes WHERE user_id = ? AND post_id = ?", [userId, postId]);
    if (result.length === 0) return 0;
    if (result.length > 1) throw new Error(`Duplicate postVote records for user: ${userId} on post: ${postId}`);
    if (result[0].direction != -1 && result[0].direction != 1) throw new Error(`Invalid vote direction: ${result[0].direction} for table: postVotes for user: ${userId} on post: ${postId}`);
    return result[0].direction;
}

const voteOnComment = async function(req, res) {
    if (!req.session.loggedIn)
    {
        res.status(401).send("You must be logged in to do that");
    }
    else
    {
        let userVote = await getCommentVoteDirection(req.session.userID, req.params.commentId);
        let changeInVote = 0;
        if(userVote == 0) //user hasn't voted on this comment; create new vote entry
        {
            await queryDb("INSERT INTO commentVotes (user_id, comment_id, direction) VALUES (?, ?, ?)", [req.session.userID, req.params.commentId, req.body.direction]);
            changeInVote = req.body.direction;
        }
        else if (userVote == req.body.direction) //clicking the same vote direction again after already voting will undo the vote; we delete this record to undo the vote
        {
            await queryDb("DELETE FROM commentVotes WHERE user_id = ? AND comment_id = ?", [req.session.userID, req.params.commentId]);
            changeInVote = -req.body.direction;
        }
        else //user wants to change their vote direction; alter existing vote record
        {
            await queryDb("UPDATE commentVotes SET direction = ? WHERE user_id = ? AND comment_id = ?", [req.body.direction, req.session.userID, req.params.commentId]);
            if (req.body.direction == -1) changeInVote = -2;
            else changeInVote = 2;
        }

        //Need to update numVotes in comments table with the new vote
        await queryDb("UPDATE comments SET numVotes = numVotes + ? WHERE id = ?", [changeInVote, req.params.commentId]);

        res.send(`${changeInVote}`);
    }
}



module.exports = {loadPost, createPost, createComment, voteOnPost, voteOnComment};