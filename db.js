const db = require("mysql2/promise");
const config = require('./credentials.json');
const options = {
    host: '127.0.0.1',
    port: 3306,
    user: config.user,
    password: config.password,
    database: config.db_name
}

newPool = db.createPool(options);

module.exports = {
    pool: newPool,
    mysql: db,
    options: options
}