"use strict";
const express = require('express');
const router = express.Router();
const userController = require(baseDir + "/src/User/user-controller");
const { getPageNum } = require(baseDir + "/src/misc/middlewares/misc");


router.get('/userLogout', userController.handleLogOutRequest);

router.post('/userLogin', userController.handleAuthRequest);

router.post('/changeSubscription', userController.handleSubscriptionChangeRequest);

router.post('/createUser', userController.handleNewUserRequest);

router.use("/u/:profileName", getPageNum);
router.get("/u/:profileName", userController.handleProfilePageRequest);

router.use("/u/:profileName/next/page=:pageNum", getPageNum);
router.get("/u/:profileName/next/page=:pageNum", userController.handleNextProfilePageRequest);


module.exports = router;