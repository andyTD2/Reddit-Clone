"use strict"

const errors = require(baseDir + "/src/utils/error");
const db = require(baseDir + "/src/utils/db");
const dbCon = db.pool;
const mysql = db.mysql;
const queryDb = db.queryDb;

const EPOCH = new Date(1970, 0, 1);
const DEPLOY_DATE = new Date(2023, 6, 1);
const DEPLOY_DATE_TIMESTAMP_SECONDS = DEPLOY_DATE.getTime() / 1000;

//in seconds
function getEpochDiff(dateSinceEpochStart)
{
    return Math.abs(dateSinceEpochStart - EPOCH) / 1000;
}

const calculateRank = function(voteSum, dateCreated) 
{
    let order = Math.log10(Math.max(Math.abs(voteSum), 1));
    let sign;

    if (voteSum > 0)
    {
        sign = 1;
    }
    else if (voteSum < 0)
    {
        sign = -1;
    }
    else
    {
        sign = 0;
    }

    let seconds = getEpochDiff(dateCreated) - DEPLOY_DATE_TIMESTAMP_SECONDS;
    return (sign * order + seconds / 45000).toFixed(7);
}
module.exports = {calculateRank};