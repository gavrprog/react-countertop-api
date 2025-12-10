const mysql = require("mysql2");
const dbConfig = require("./config/db.config.js")

// Create a connection to the database
const connection = mysql.createPool({
    connectionLimit: 20,
    host: dbConfig.HOST,
    user: dbConfig.USER,
    password: dbConfig.PASSWORD,
    database: dbConfig.DB
});

module.exports = connection;