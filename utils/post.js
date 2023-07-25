"use strict";
const db = require(baseDir + "/utils/db");
const dbCon = db.pool;
const mysql = db.mysql;


const loadPost = async function (req, res)
{
    let query = "SELECT * from posts WHERE id = ?;";
    query = mysql.format(query, [req.params.postId]);
    let result = (await dbCon.query(query))[0];

    if(result.length == 0)
    {
        res.status(404).send("Page not found.");
    }
    else
    {
        let params = {
            subreddit: req.subredditObj,
            post: result[0]
        }
        if (req.session.loggedIn)
        {
            params.username = req.session.user;
        }
        res.render(baseDir + "/views/post", params);
    }
}

module.exports = {loadPost};