const userModel = require(baseDir + "/src/User/user-model");
const subredditModel = require(baseDir + "/src/Subreddit/subreddit-model");

const getSubredditPage = async function(subredditData, pageNum, filter, userId) {
    let params = {
        subreddit: subredditData,
        pageNum: pageNum,
        posts: await subredditModel.getSubredditPosts({filter: filter, pageNum: pageNum, subreddit: subredditData, userID: userId}),
        filter: filter || "hot",
        isSubscribed: await userModel.getUserSubscriptionStatus(userId, (subredditData && subredditData.id))
    }

    return {ok: true, params: params};
}

const getNextPage = async function(subredditData, pageNum, filter, userId) {
    pageNum = parseInt(pageNum) + 1;

    let params = {
        posts: await subredditModel.getSubredditPosts({filter: filter, pageNum: pageNum, subreddit: subredditData, userID: userId}),
        subreddit: subredditData,
        pageNum: pageNum
    };
    return {ok: true, params: params};
}

const createSubreddit = async function(subredditName, description, sidebar, userId) {
    if(subredditName.length < 3 || subredditName.length > 30)
    {
        return {ok: false, statusCode: 400, error: "Subreddit name must be between 3 and 30 characters."};
    }

    const alphanumeric = new RegExp("^[a-zA-Z0-9]*$");
    if(!alphanumeric.test(subredditName))
    {
        return {ok: false, statusCode: 400, error: "Subreddit name may only consist of letters and numbers."};
    }
    if(await subredditModel.loadSubredditData(subredditName))
    {
        return {ok: false, statusCode: 400, error: "This subreddit name has already been taken."};
    }

    await subredditModel.insertSubreddit(subredditName, description, sidebar, userId);

    return {ok: true};
}


module.exports = {getSubredditPage, getNextPage, createSubreddit};