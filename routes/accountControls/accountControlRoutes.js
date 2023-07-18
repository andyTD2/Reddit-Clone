const express = require('express');
const router = express.Router();
const User = require(baseDir + "/utils/user");

router.use(function(req, res, next) {
    console.log("ACCOUNT CONTROLS MIDDLEWARE");
    next();
})

router.get("/userLogout", async function(req, res)
{
    User.logOut(req);
    res.redirect("/");
});

router.post('/userLogin', function(req, res) {
    User.authenticateUser(req, res)
});

router.post('/createUser', async function(req, res) {
    User.createUser(req, res);
});


module.exports = router;