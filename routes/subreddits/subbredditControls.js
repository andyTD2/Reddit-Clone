const express = require('express');
const router = express.Router();

const db = require(baseDir + "/utils/db");
const dbCon = db.pool;
const mysql = db.mysql;


async function subredditExists(subredditName) {
    let query = "SELECT * from subreddits WHERE title = ?";
    query = mysql.format(query, [subredditName]);
    let result = await dbCon.query(query);
    result = result[0];

    if (result.length === 0)
    {
        return false;
    }
    return true;
}


/*
    This middleware checks if the subreddit the user is trying to access exists.
    If not, send 404, otherwise continue
*/

router.use("/r/:subreddit", async function(req, res, next){
    console.log("SU");
    if(await subredditExists(req.params.subreddit))
    {
        next();
    }
    else
    {
        res.status(404).send("Page not found");
    }
})


router.post("/createSubreddit", async function(req, res) {
    if(!req.session.loggedIn)
    {
        res.send("You must be logged in to do that.");
    }
    else
    {
        if(await subredditExists(req.body.subredditName))
        {
            res.send("This subreddit name has already been taken.");
        }
        else
        {
            let query = "INSERT INTO subreddits (title, description, sidebar, createdBy) VALUES(?, ?, ?, ?)"
            query = mysql.format(query, [req.body.subredditName, req.body.description, req.body.sidebar, req.session.userID]);
            result = await dbCon.query(query);
            res.redirect(`/r/${req.body.subredditName}`);
        }
    }
})


router.get("/r/:subreddit", async function(req, res){
    let accountInfo = "noAccount.ejs";
    if (req.session.loggedIn)
    {
        res.render("subreddit", {
            subredditName: req.params.subreddit,
            accountControls: "hasAccount.ejs",
            username: req.session.user,
            createPostLink: `/r/${req.params.subreddit}/newPost`
        });
    }
    else
    {
        res.render("subreddit", {
            subredditName: req.params.subreddit,
            accountControls: "noAccount.ejs",
            createPostLink: `/r/${req.params.subreddit}/newPost`
        });
    }
})


router.get("/r/:subreddit/newPost", async function(req, res) {
    res.render("createPost", {createPostLink: `/r/${req.params.subreddit}/newPost`})
})

router.post("/r/:subreddit/newPost", async function(req, res) {
    if(!req.session.loggedIn)
    {
        res.send("You must be logged in to do that.");
    }
    else
    {
        let subID = await dbCon.query(mysql.format("SELECT id FROM subreddits WHERE title = ?", [req.params.subreddit]));
        subID = subID[0][0].id;
        console.log(subID);
        let query = "INSERT INTO posts (title, content, subreddit_id, user_id) VALUES (?, ?, ?, ?)";
        query = mysql.format(query, [req.body.postTitle, req.body.content, subID, req.session.userID]);
        let result = await dbCon.query(query);
        res.redirect(`/r/${req.params.subreddit}/post/${result[0].insertId}`);
    }
})

router.get("/r/:subreddit/post/:postId", async function(req, res) {
    
})


module.exports = router;