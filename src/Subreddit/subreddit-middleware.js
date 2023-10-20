"use strict";

const subredditModel = require(baseDir +"/src/Subreddit/subreddit-model");

const getSubredditData = async function(req, res, next) {
    req.subreddit = req.params.subreddit;

    const result = await subredditModel.loadSubredditData(req.subreddit);
    if(!result)
    {
        req.subredditData = undefined;
        return;
    }
    
    req.subredditData = 
    {
        id: result.id,
        name: result.title,
        description: result.description,
        sidebar: result.sidebar,
    }
    next();
}

module.exports = {getSubredditData};