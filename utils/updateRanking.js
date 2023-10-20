"use strict"

const errors = require(baseDir + "/utils/error");
const db = require(baseDir + "/utils/db");
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

const updateRank = async function(postId)
{
    let result = await queryDb("SELECT UNIX_TIMESTAMP(created_at) as created_at, numVotes FROM posts WHERE id = ?", [postId]);
    let newRank = calculateRank(result[0].numVotes, new Date(result[0].created_at * 1000));
    await queryDb("UPDATE posts SET score = ? WHERE id = ?", [newRank, postId]);
}

module.exports = {updateRank, calculateRank};