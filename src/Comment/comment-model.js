"use strict";
const errors = require(baseDir + "/src/utils/error");

const db = require(baseDir + "/src/utils/db");
const dbCon = db.pool;
const mysql = db.mysql;
const queryDb = db.queryDb;
const {getCommentPageNumOffset} = require(baseDir + "/src/utils/misc");




const insertCommentVote = async function(voterId, commentId, voteDirection)
{
    await queryDb("INSERT INTO commentVotes (user_id, comment_id, direction) VALUES (?, ?, ?)", [voterId, commentId, voteDirection]);
};

const deleteCommentVote = async function(voterId, commentId)
{
    await queryDb("DELETE FROM commentVotes WHERE user_id = ? AND comment_id = ?", [voterId, commentId]);
};

const updateCommentVote = async function(voterId, commentId, voteDirection)
{
    await queryDb("UPDATE commentVotes SET direction = ? WHERE user_id = ? AND comment_id = ?", [voteDirection, voterId, commentId]);
};

const updateNumCommentVotes = async function(changeInVote, commentId)
{
    await queryDb("UPDATE comments SET numVotes = numVotes + ? WHERE id = ?", [changeInVote, commentId]);
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


const insertComment = async function(comment, userId, postId, parentId) {
    let queryValues = [comment, userId, postId, (parentId || null)];
    let query = "INSERT INTO comments (content, user_id, post_id, parent_id) VALUES (?, ?, ?, ?)";
    
    await queryDb(query, queryValues);
};


const commentFilters = {
    new: `created_at`,
    top: `numVotes`
};

const getFilterQuery = function(filter)
{
    if(!filter) filter = "top"; //default filter

    let orderBy = commentFilters[filter];

    //if input is a filter option that is not in the list of filters use default
    if(!orderBy) orderBy = commentFilters["top"];
    return orderBy;
}



const getParentComments = async function(postId, pageNum, filter)
{
    let orderBy = getFilterQuery(filter);
    let offset = getCommentPageNumOffset(pageNum);

    let query = `SELECT COMMENTS.id, numVotes, content, created_at, user_id, post_id, userName, TIMESTAMPDIFF(MINUTE, created_at, CURRENT_TIMESTAMP()) 
                AS minutes_ago FROM COMMENTS LEFT JOIN users ON comments.user_id = users.id WHERE post_id = ? AND parent_id IS null
                ORDER BY ${orderBy} DESC LIMIT ? OFFSET ?`;

    return (await queryDb(query, [postId, COMMENTS_PER_PAGE, offset]));
};


const getChildrenOfComments = async function(commentList, postId, userId) {
    for (let comment of commentList)
    {
        comment.voteDirection = await getCommentVoteDirection(userId, comment.id);

        let childCommentQuery = `SELECT COMMENTS.id, numVotes, content, created_at, user_id, post_id, userName, TIMESTAMPDIFF(MINUTE, created_at, CURRENT_TIMESTAMP()) AS minutes_ago FROM COMMENTS 
        LEFT JOIN users ON comments.user_id = users.id
        WHERE post_id = ? AND parent_id = ?
        ORDER BY created_at DESC`;

        comment.children = (await queryDb(childCommentQuery, [postId, comment.id]));
        await getChildrenOfComments(comment.children, postId, userId);
    }
    return;
}



module.exports = { insertCommentVote, deleteCommentVote, updateCommentVote, updateNumCommentVotes, getCommentVoteDirection, insertComment,
                    getParentComments, getChildrenOfComments };