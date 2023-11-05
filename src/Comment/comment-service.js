const commentModel = require(baseDir + "/src/Comment/comment-model");

const voteOnComment = async function(userId, commentId, voteDirection) {
    let userVote = await commentModel.getCommentVoteDirection(userId, commentId);
    let changeInVote = 0;

    if(userVote == 0) //user hasn't voted on this comment; create new vote entry
    {
        await commentModel.insertCommentVote(userId, commentId, voteDirection);
        changeInVote = voteDirection;
    }
    else if (userVote == voteDirection) //clicking the same vote direction again after already voting will undo the vote; we delete this record to undo the vote
    {
        await commentModel.deleteCommentVote(userId, commentId);
        changeInVote = -voteDirection;
    }
    else //user wants to change their vote direction; alter existing vote record
    {
        await commentModel.updateCommentVote(userId, commentId, voteDirection);
        changeInVote = (voteDirection == -1) ? -2 : 2; 
    }

    //Need to update numVotes in comments table with the new vote
    await commentModel.updateNumCommentVotes(changeInVote, commentId);

    return {ok: true, changeInVote: changeInVote};
};


const getComments = async function(userId, postId, pageNum, filter, post, subreddit)
{
    pageNum += 1;
    let listOfParentComments = await commentModel.getParentComments(postId, pageNum, filter);
    await commentModel.getChildrenOfComments(listOfParentComments, postId, userId);

    let params = {
        comments: listOfParentComments,
        pageNum: pageNum,
        subreddit: subreddit,
        post, post,
        filter: filter
    };

    return {ok: true, params: params};
};




module.exports = { voteOnComment, getComments };