"use strict";
const express = require('express');
const router = express.Router();
const User = require(baseDir + "/utils/user");

router.use(function(req, res, next) {
    console.log("ACCOUNT CONTROLS MIDDLEWARE");
    next();
})

router.get("/userLogout", User.logOut);

router.post('/userLogin', User.authenticateUser);

router.post('/createUser', User.createUser);


module.exports = router;