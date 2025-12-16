require('dotenv').config({ path: `../.env.${process.env.NODE_ENV || 'development'}` });

const mysql = require("mysql2");
// const dbConfig = require("./config/db.config.js")

// // Create a connection to the database
// const connection = mysql.createPool({
//     connectionLimit: 20,
//     host: dbConfig.HOST,
//     user: dbConfig.USER,
//     password: dbConfig.PASSWORD,
//     database: dbConfig.DB
// });

// module.exports = connection;

module.exports =  mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});