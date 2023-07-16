const express = require('express');
const router = express.Router();

const db = require("./../../db");
const dbCon = db.pool;
const mysql = db.mysql;

router.post("/createSubreddit", async function(req, res) {
    if(!req.session.loggedIn)
    {
        res.send("You must be logged in to do that.");
    }
    else
    {
        let query = "SELECT title FROM subreddits WHERE title = ?;"
        query = mysql.format(query, [req.body.subredditName]);

        let result = await dbCon.query(query);
        result = result[0];
        if(result.length > 0)
        {
            res.send("This subreddit name has already been taken.");
        }
        else
        {
            query = "INSERT INTO subreddits (title, description, sidebar, createdBy) VALUES(?, ?, ?, ?)"
            query = mysql.format(query, [req.body.subredditName, req.body.description, req.body.sidebar, req.session.userID]);
            result = await dbCon.query(query);
            res.redirect(`/r/${req.body.subredditName}`);
        }
    }
})

router.get("/r/:subreddit", async function(req, res){
    let query = "SELECT * FROM subreddits WHERE title = ?";
    query = mysql.format(query, [req.params.subreddit]);
    let result = await dbCon.query(query);
    result = result[0];

    if(result.length === 0)
    {
        res.status(404).send("Page not found");
    }
    else
    {
        let accountInfo = "noAccount.ejs";
        if (req.session.loggedIn)
        {
            res.render("subreddit", {
                subredditName: result[0].title,
                accountControls: "hasAccount.ejs",
                username: req.session.user
            });
        }
        else
        {
            res.render("subreddit", {
                subredditName: result[0].title,
                accountControls: "noAccount.ejs"
            });
        }
    }
})

module.exports = router;