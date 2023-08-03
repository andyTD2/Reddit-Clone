"use strict";
require("express-async-errors")
const errors = require("./error")

const db = require(baseDir + "/utils/db");
const dbCon = db.pool;
const mysql = db.mysql;

const bcrypt = require("bcrypt");


/*  
    THIS FILE CONTAINS THE USER CLASS AND RELATED UTILITY FUNCTIONS
    - user authentication, login/logout
    - user creation
    - retrieving user data
*/


const authenticateUser = async function(req, res) {
    if (req.session.loggedIn)
    {
        res.redirect("back");
        return;
    }

    let sql = "SELECT * FROM users where userName = ?;";
    sql = mysql.format(sql, [req.body.username]);
    let result = await dbCon.query(sql);
    result = result[0];

    if (result.length > 1)
    {
        throw new Error(`Multiple users with username: ${req.body.username}`);
    }

    if(result.length === 0 || !(await bcrypt.compare(req.body.password, result[0].userPassword)))
    {
        res.send("Incorrect password or user does not exist.");
        return;
    }

    logIn(result[0].userName, result[0].id, req);
    res.redirect("/");
};


const logIn = function(username, id, req) {
    req.session.user = username;
    req.session.userID = id;
    req.session.loggedIn = true;
}


const logOut = function(req, res)
{
    if(req.session.loggedIn)
    {
        req.session.destroy();
    }
    res.redirect("/");
}


const createUser = async function(req, res)
{
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
    logIn(req.body.username, result[0].insertId, req);
    res.send("Account Created!");
}


class User {
    constructor(id, username)
    {
        this.id = id;
        this.username = username;
    }

}




module.exports = {authenticateUser, logOut, createUser};