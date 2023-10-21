const userModel = require(baseDir + "/src/User/user-model");

const getUser = async function(req, res, next) {
    if(!req.session.loggedIn)
    {
        next();
        return;
    }

    req.user = {
        id: req.session.userID,
        username: req.session.user,
        subscriptionsList: await userModel.getSubscribedSubreddits(req.session.userID)
    };

    next();
}

module.exports = {getUser};