"use strict";

const userService = require(baseDir + "/src/User/user-service");

const handleAuthRequest = async function(req, res) {

    const checkAuth = await userService.authenticateUser(req.body.username, req.body.password, req.session);

    if(!checkAuth.ok)
        res.status(checkAuth.statusCode).send(checkAuth.error);
    else
        res.status(200).send("Successfully logged in.");
};


const handleLogOutRequest = function(req, res)
{
    userService.logOutUser(req.session);
    res.redirect("/");
}


const handleNewUserRequest = async function(req, res)
{
    let newUser = await userService.createUser(req.body.username, req.body.password, req.session);
    if (!newUser.ok)
    {
        res.status(newUser.statusCode).send(newUser.error);
        return;
    }
    res.status(200).send("Account Created!");
}


const handleProfilePageRequest = async function(req, res)
{
    let profile = await userService.getProfilePage(req.params.profileName, req.session.userID, req.pageNum);

    if(!profile.ok)
    {
        res.status(profile.statusCode).send(profile.error);
        return;
    }

    profile.params["user"] = req.user;
    res.render("profilePage", profile.params);
}


const handleNextProfilePageRequest = async function(req, res)
{
    let profile = await userService.getProfilePage(req.params.profileName, req.session.userID, req.pageNum);

    if(!profile.ok)
    {
        res.status(profile.statusCode).send(profile.error);
        return;
    }

    profile.params["user"] = req.user;
    res.render("activityList", profile.params);
}


const handleSubscriptionChangeRequest = async function(req, res)
{
    if (!req.session.loggedIn)
    {
        res.status(401).send("User not logged in.");
        return;
    }

    res.status(200).send((await userService.changeUserSubscription(req.session.userID, req.body.subredditId)).status);
}

module.exports = {handleAuthRequest, handleLogOutRequest, handleSubscriptionChangeRequest, handleNewUserRequest, handleProfilePageRequest, handleNextProfilePageRequest};