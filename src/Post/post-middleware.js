const postModel = require(baseDir + "/src/Post/post-model");
const {parseTimeSinceCreation} = require(baseDir + "/src/utils/misc");

const getPost = async function(req, res, next)
{
    const postData = await postModel.loadPostData(req.session.userId, req.params.postId);
    if(!postData)
    {
        res.status(404).send("Page not found.");
        return;
    }

    req.postData = 
    {
        id: req.params.postId,
        title: postData.title,
        content: postData.content,
        numVotes: postData.numVotes,
        userId: postData.userId,
        userName: postData.userName,
        timeSinceCreation: parseTimeSinceCreation(postData.minutes_ago),
        voteDirection: postData.voteDirection,
        numComments: postData.numComments,
        postLink: postData.postLink,
        imgSrc: postData.imgSrc
    };
    
    next();
};

module.exports = { getPost };