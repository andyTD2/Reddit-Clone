const bcrypt = require("bcrypt");
const userModel = require(baseDir + "/src/User/user-model");


//////////////////////////////////////
//////////// EXPORTED FUNCS //////////
//////////////////////////////////////

const authenticateUser = async function(suppliedUsername, suppliedPassword, loginSession) {
    let user = (await userModel.findUser(suppliedUsername));

    if(user.length <= 0 || !(await bcrypt.compare(suppliedPassword, user[0].userPassword)))
    {
        return {ok: false, statusCode: 401, error: "USER DOESN'T EXIST OR PASSWORD MISMATCH"};
    }

    logIn(user[0].userName, user[0].id, loginSession);

    return {ok: true};
};


const logOutUser = function(loginSession) {
    if(loginSession.loggedIn) loginSession.destroy();
}


const changeUserSubscription = async function(userId, subId)
{
    let isSubbed = await userModel.getUserSubscriptionStatus(userId, subId);

    if(isSubbed)
    {
        await userModel.unsubscribeToSubreddit(userId, subId);
        return {status: "UNSUBSCRIBED"};
    }
    else
    {
        await userModel.subscribeToSubreddit(userId, subId);
        return {status: "SUBSCRIBED"};
    }
}

const createUser = async function(username, password, loginSession)
{
    //Verify that our username and password meets our minimum required format
    if(!isValidUsername(username))
        return {ok: false, statusCode: 400, error: "Username does not meet requirements!"};

    if(!isValidPassword(password))
        return {ok: false, statusCode: 400, error: "Password does not meet requirements!"};


    //Checks if user already exists
    if(await userModel.getUserDataByName(username))
        return {ok: false, statusCode: 400, error: "Username already taken!"};


    //Hashes password
    let hashedPassword = await bcrypt.hash(password, 10);

    //Insert user into our DB; DB returns the recently inserted user's ID
    let assignedUserId = await userModel.insertUser(username, hashedPassword);

    //Automatically log our user in
    logIn(username, assignedUserId, loginSession);

    return {ok: true};
}


const getProfilePage = async function(profileName, curUserId, pageNum)
{
    let profile = await userModel.getUserDataByName(profileName);

    if(!profile)
        return {ok: false, statusCode: 400, error: "Looks like that user doesn't exist."};

    let userActivity = await userModel.getRecentUserActivity(profile[0].id, curUserId, POSTS_PER_PAGE, pageNum);
    pageNum = parseInt(pageNum) + 1;


    let params = {
        pageNum: pageNum,
        activities: userActivity,
        profileName: profileName
    }
    return {ok: true, params: params};
}



////////////////////////////////////////////////////////
///////////////////////////////////////////////////////
//////////////////////////////////////////////////////


const logIn = function(username, id, loginSession) {
    loginSession.user = username;
    loginSession.userID = id;
    loginSession.loggedIn = true;
}

const isValidUsername = function(username)
{
    //RegEx that checks if username is between 3 and 20 characters long, 
    //and only consists of the alphabet, numbers, underscores and dashes.
    const usernameValidation = new RegExp("^[a-zA-Z0-9_-]{3,20}$");

    return usernameValidation.test(username);
}

const isValidPassword = function(password)
{
    //RegEx that checks for at least one number
    const atLeastOneNum = new RegExp(".*[0-9].*");

    //RegEx that checks for at least one letter
    const atLeastOneAlpha = new RegExp(".*[a-zA-Z].*");

    //RegEx that checks for at least one of the following: [!, @, ., _, -]
    const atLeastOneSpecial = new RegExp(".*[!@._-].*");

    //RegEx that checks that the password is between 8 and 30 characters long,
    //contains only letters, numbers, and special characters
    const passwordValidation = new RegExp("^[a-zA-Z0-9!@._-]{8,30}$")

    return passwordValidation.test(password) && atLeastOneAlpha.test(password) && atLeastOneNum.test(password) && atLeastOneSpecial.test(password);
}


module.exports = {authenticateUser, logOutUser, changeUserSubscription, createUser, getProfilePage};