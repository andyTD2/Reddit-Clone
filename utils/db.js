const db = require("mysql2/promise");
const config = require(baseDir + '/config/credentials.json');
const options = {
    host: '127.0.0.1',
    port: 3306,
    user: config.user,
    password: config.password,
    database: config.db_name
}

let newPool = db.createPool(options);

if (!newPool)
{
    throw new error("Failed to connect do DB");
}

const queryDb = async function(sql, params)
{
    let query = db.format(sql, params);
    console.log(query);
    let result = await newPool.query(query);
    return result[0];
}


module.exports = {
    pool: newPool,
    mysql: db,
    options: options,
    queryDb
}