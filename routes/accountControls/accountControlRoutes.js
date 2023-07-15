const express = require('express');
const router = express.Router();

const bcrypt = require("bcrypt");
const db = require("./../../db");
const dbCon = db.pool;
const mysql = db.mysql;

router.get("/userLogout", async function(req, res)
    {
        if(req.session.loggedIn)
        {
            req.session.destroy();
            res.redirect("/");
        }
        else
            res.redirect("/");
    });

router.post('/userLogin', async function(req, res) {
    let sql = "SELECT * FROM users WHERE userName = ?;";
    sql = mysql.format(sql, [req.body.username]);
    result = await dbCon.query(sql);
    result = result[0];


    if (result.length > 1)
    {
        res.send("Something went horribly wrong.");
        return;
    }
    if(result.length === 0 || !(await bcrypt.compare(req.body.password, result[0].userPassword)))
    {
        res.send("Incorrect password or user does not exist.");
        return;
    }

    req.session.user = result[0].userName;
    req.session.loggedIn = true;

    res.redirect("/");
    return;
});

router.post('/createUser', async function(req, res) {

    //checking if username exists
    let sql = "SELECT * FROM users WHERE userName = ?;";
    sql = mysql.format(sql, [req.body.username]);
    result = await dbCon.query(sql);
    if(result[0].length > 0)
    {
        res.send("Username already taken!");
        return;
    }

    //hashing password and creating user
    let hashedPassword = await bcrypt.hash(req.body.password, 10);
    sql = "INSERT INTO users (userName, userPassword) VALUES(?, ?);";
    sql = mysql.format(sql, [req.body.username, hashedPassword]);
    result = await dbCon.query(sql);
    res.send("Account Created!");
});


module.exports = router;