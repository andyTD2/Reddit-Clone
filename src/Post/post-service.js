"use strict"

const commentService = require(baseDir + "/src/Comment/comment-service");
const userModel = require(baseDir + "/src/User/user-model");
const postModel = require(baseDir + "/src/Post/post-model");
const { isValidUrl, getHtml, getArticleImageSrc, getArticleTitle } = require(baseDir + "/src/utils/misc");

const getPostPage = async function (userId, postId, pageNum, filter, subredditData, postData, user)
{
    if(!pageNum) pageNum = 0;
    if(!filter) filter = "top";
    
    let commentData = await commentService.getComments(userId, postId, pageNum, filter);
    if(!commentData.ok){
        throw new error("Something happened(Invalid comment data...)");
    }
    let params = {
        subreddit: subredditData,
        post: postData,
        comments: commentData.params.comments,
        user: user,
        filter: filter,
        isSubscribed: await userModel.getUserSubscriptionStatus(userId, (subredditData && subredditData.id))
    };

    return {ok: true, params: params};
};


const createPost = async function(postTitle, postLink, useArticleTitle, postContent, subredditId, userId) {

    if(postTitle.replace(/\s/g, '') == "") 
        return {ok: false, statusCode: 400, error: "Post must have a title!"};

    let metaData = await getArticleMetaData(postLink);
    if(useArticleTitle && !metaData) 
        return {ok: false, statusCode: 400, error: "Unable to fetch article metadata. Please double check the URL."};

    if(useArticleTitle && metaData.articleTitle != "") postTitle = metaData.articleTitle;

    let insertId = await postModel.insertNewPost(postTitle, postContent, postLink, subredditId, userId, metaData ? metaData.imgSrc : "");

    return {ok: true, insertId: insertId};
}

const getArticleMetaData = async function(link)
{
    if(link == "")
    {
        return undefined;
    }

    if(!isValidUrl(link))
    {
        return undefined;
    }

    let dom = await getHtml(link);
    if(dom)
    {
        return {imgSrc: getArticleImageSrc(dom), articleTitle: getArticleTitle(dom)};
    }
    return undefined;
};


const voteOnPost = async function(userId, postId, voteDirection) {
    let userVote = await postModel.getPostVoteDirection(userId, postId);
    let changeInVote = 0;

    if(userVote == 0) //user hasn't voted on this post; create new vote entry
    {
        await postModel.insertPostVote(userId, postId, voteDirection);
        changeInVote = voteDirection;
    }
    else if (userVote == voteDirection) //clicking the same vote direction again after already voting will undo the vote; we delete this record to undo the vote
    {
        await postModel.deletePostVote(userId, postId);
        changeInVote = -voteDirection;
    }
    else //user wants to change their vote direction; alter existing vote record
    {
        await postModel.updatePostVote(userId, postId, voteDirection);
        if (voteDirection == -1) changeInVote = -2;
        else changeInVote = 2;
    }

    //Need to update numVotes in posts table with the new vote
    await postModel.updateNumPostVotes(postId, changeInVote);

    //After updating votes, we have to recalculate the rank
    await postModel.updatePostRank(postId);

    return{ok: true, changeInVote: changeInVote};
};


const getSearchResults = async function(searchQuery, filterBySubreddit, filterByAuthor, pageNum, curUserId)
{
    pageNum += 1;
    let posts = await postModel.getPostsByUserQuery(searchQuery, filterBySubreddit, filterByAuthor, pageNum, curUserId);

    let params = {
        pageNum: pageNum,
        posts: posts
    }
    return {ok: true, params: params};
}


module.exports = { getPostPage, createPost, voteOnPost, getSearchResults};