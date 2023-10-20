"use strict";

require("express-async-errors")
const errors = require(baseDir + "/utils/error")

const db = require(baseDir + "/utils/db");
const dbCon = db.pool;
const mysql = db.mysql;
const queryDb = db.queryDb;

const getPageNum = function(req, res, next) {
    req.pageNum = parseInt(req.params.pageNum || 1);
    next();
};

const getFilter = function(req, res, next) {
    req.filter = req.params.filter || "hot";
    next();
}


module.exports = { getPageNum, getFilter };