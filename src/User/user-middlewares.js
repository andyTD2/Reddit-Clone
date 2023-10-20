const {User} = require(baseDir + "/utils/user");

const getUser = async function(req, res, next) {
    if(!req.session.loggedIn)
    {
        next();
        return;
    }

    req.user = new User(req.session.userID, req.session.user);
    await req.user.getSubscribedSubreddits();
    next();
}

module.exports = {getUser};