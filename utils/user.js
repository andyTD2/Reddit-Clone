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
        res.status(200).send("Already logged in.");
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
        res.status(401).send("Incorrect password or user does not exist.");
        return;
    }

    logIn(result[0].userName, result[0].id, req);
    res.status(200).send("Successfully logged in.");
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
    //check if input matches format
    const usernameValidation = new RegExp("^[a-zA-Z0-9_-]{3,20}$");
    if(!usernameValidation.test(req.body.username))
    {
        res.status(400).send("Username does not meet requirements!");
        return;
    }

    //check if passwords meets format
    const atLeastOneNum = new RegExp(".*[0-9].*");
    const atLeastOneAlpha = new RegExp(".*[a-zA-Z].*");
    const atLeastOneSpecial = new RegExp(".*[!@._-].*");
    const passwordValidation = new RegExp("^[a-zA-Z0-9!@._-]{8,30}$")

    if (!passwordValidation.test(req.body.password) || !atLeastOneAlpha.test(req.body.password) || !atLeastOneNum.test(req.body.password) || !atLeastOneSpecial.test(req.body.password))
    {
        res.status(400).send("Password does not meet requirements!");
        return;
    }

    //checking if username exists
    let sql = "SELECT * FROM users WHERE userName = ?;";
    sql = mysql.format(sql, [req.body.username]);
    let result = await dbCon.query(sql);

    if(result[0].length > 0)
    {
        res.status(400).send("Username already taken!");
        return;
    }

    //hashing password and creating user
    let hashedPassword = await bcrypt.hash(req.body.password, 10);
    sql = "INSERT INTO users (userName, userPassword) VALUES(?, ?);";
    sql = mysql.format(sql, [req.body.username, hashedPassword]);
    result = await dbCon.query(sql);
    logIn(req.body.username, result[0].insertId, req);
    res.status(200).send("Account Created!");
}


class User {
    constructor(id, username)
    {
        this.id = id;
        this.username = username;
    }

}




module.exports = {authenticateUser, logOut, createUser};