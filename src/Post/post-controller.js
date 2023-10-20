const postService = require(baseDir + "/src/Post/post-service");

const handlePostPageRequest = async function (req, res)
{
    let post = await postService.getPostPage(req.session.userId, req.params.postId, req.pageNum, 
                                            req.params.filter, req.subredditData, req.postData, req.user);

    if(!post.ok)
    {
        res.status(post.statusCode).send(post.error);
        return;
    }

    res.render(baseDir + "/views/post", post.params);
}

const handleNewPostRequest = async function(req, res) {
    if(!req.session.loggedIn)
    {
        res.status(401).send("You must be logged in to do that.");
        return;
    }

    let newPost = await postService.createPost(req.body.postTitle, req.body.postLink, req.body.useArticleTitle, 
                                                req.body.postContent, req.subredditData.id, req.session.userID)

    if (!newPost.ok)
    {
        res.status(newPost.statusCode).send(newPost.error);
        return;
    }
    res.status(200).send(`${newPost.insertId}`);   
}


const handlePostVoteRequest = async function(req, res) {
    if(!req.session.loggedIn)
    {
        res.status(401).send("You must be logged in to do that");
        return;
    }

    let postVote = await postService.voteOnPost(req.session.userID, req.params.postId, req.body.direction);
    if(!postVote.ok)
    {
        res.status(postVote.statusCode).send(postVote.error);
        return;
    }

    res.send(`${postVote.changeInVote}`);
};

const handleSearchResultsRequest = async function(req, res) 
{
    let results = await postService.getSearchResults(req.body.searchQuery, req.body.filterBySubreddit, req.body.filterByAuthor, 0, req.session.userID);
    if(!results.ok)
    {
        res.status(results.statusCode).send(results.error);
        return;
    }

    results.params["user"] = req.user;
    results.params["searchQuery"] = req.body.searchQuery;
    results.params["filterBySubreddit"] = req.body.filterBySubreddit;
    results.params["filterByAuthor"] = req.body.filterByAuthor;

    res.render("searchResults", results.params)
};

const handleNextResultsPageRequest = async function(req, res)
{
    let results = await postService.getSearchResults(req.body.searchQuery, req.body.filterBySubreddit, req.body.filterByAuthor, req.pageNum, req.session.userID);
    if(!results.ok)
    {
        res.status(results.statusCode).send(results.error);
        return;
    }

    res.render("searchResultsPostList", results.params);

};

module.exports = { handlePostPageRequest, handleNewPostRequest, handlePostVoteRequest, handleSearchResultsRequest, handleNextResultsPageRequest };