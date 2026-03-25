'use strict';
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  user:     process.env.DB_USER     || 'chopuser',
  password: process.env.DB_PASSWORD || 'choppass',
  database: process.env.DB_NAME     || 'chopchopin',
  waitForConnections: true,
  connectionLimit: 10
});

module.exports = pool;
