"use strict";
const errors = require(baseDir + "/utils/error");
const db = require(baseDir + "/utils/db");
const dbCon = db.pool;
const mysql = db.mysql;
const queryDb = db.queryDb;
const MAX_COMMENTS_PER_PAGE = 5;

const commentFilters = {
    new: `SELECT COMMENTS.id, numVotes, content, created_at, user_id, post_id, userName, TIMESTAMPDIFF(MINUTE, created_at, CURRENT_TIMESTAMP()) AS minutes_ago FROM COMMENTS 
    LEFT JOIN users ON comments.user_id = users.id
    WHERE post_id = ? AND parent_id IS null
    ORDER BY created_at DESC LIMIT ? OFFSET ?`,

    top: `SELECT COMMENTS.id, numVotes, content, created_at, user_id, post_id, userName, TIMESTAMPDIFF(MINUTE, created_at, CURRENT_TIMESTAMP()) AS minutes_ago FROM COMMENTS 
    LEFT JOIN users ON comments.user_id = users.id
    WHERE post_id = ? AND parent_id IS null
    ORDER BY numVotes DESC LIMIT ? OFFSET ?`

};

const getCommentVoteDirection = async function(userId, commentId)
{
    if(!userId) return 0;

    let result = await queryDb("SELECT direction FROM commentVotes WHERE user_id = ? AND comment_id = ?", [userId, commentId]);
    if (result.length === 0) return 0;
    if (result.length > 1) throw new Error(`Duplicate commentVote records for user: ${userId} on comment: ${commentId}`);
    if (result[0].direction != -1 && result[0].direction != 1) throw new Error(`Invalid vote direction: ${result[0].direction} for table: commentVotes for user: ${userId} on comnment: ${commentId}`);
    
    return result[0].direction;
};

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

const getCommentData = async function(req)
{
    if(!req.params.pageNum) req.params.pageNum = 1;
    else req.params.pageNum = parseInt(req.params.pageNum) + 1;
    if(!req.params.filter) req.params.filter = "top";

    console.log(req.params.pageNum);
    let query = commentFilters[req.params.filter];
    if(!query)
    {
        return undefined;
    }

    let result = await queryDb(query, [req.params.postId, MAX_COMMENTS_PER_PAGE, (req.params.pageNum-1) * MAX_COMMENTS_PER_PAGE]);

    await getChildrenOfComment(result, req.params.postId, req.session.userID);
    return result;
}

module.exports = {getCommentData, getCommentVoteDirection};