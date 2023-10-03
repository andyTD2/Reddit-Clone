"use strict";
const express = require('express');
const router = express.Router();
const User = require(baseDir + "/controllers/accountController");

router.use(function(req, res, next) {
    console.log("ACCOUNT CONTROLS MIDDLEWARE");
    next();
})

router.get("/userLogout", User.logOut);

router.post('/userLogin', User.authenticateUser);

router.post('/changeSubscription', User.changeUserSubscription);

router.post('/createUser', User.createUser);

router.get("/u/:username", User.getProfilePage);

router.get("/u/:username/next/page=:pageNum", User.getNextProfilePage);


module.exports = router;