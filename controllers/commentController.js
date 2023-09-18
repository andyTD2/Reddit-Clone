"use strict";
const errors = require(baseDir + "/utils/error");
const db = require(baseDir + "/utils/db");
const dbCon = db.pool;
const mysql = db.mysql;
const queryDb = db.queryDb;
const {getCommentVoteDirection, getCommentData} = require(baseDir + "/utils/comment");

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
};

const createComment = async function(req, res) {
    if(!req.session.loggedIn)
    {
        res.send("You must be logged in to do that");
    }
    else
    {
        let queryValues = [req.body.comment, req.session.userID, req.params.postId, (req.body.parentId ? req.body.parentId : null)];
        let query = "INSERT INTO comments (content, user_id, post_id, parent_id) VALUES (?, ?, ?, ?)";
        query = mysql.format(query, queryValues);
        let result = (await dbCon.query(query))[0];
        res.redirect("back");
    }
};

const loadMoreComments = async function(req, res) {
    const comments = await getCommentData(req);
    if(!comments){
        res.status(404).send("Page Not Found")
    }

    res.render(baseDir + "/views/commentList", {comments: comments, pageNum: req.params.pageNum});
}

module.exports = {createComment, voteOnComment, loadMoreComments};