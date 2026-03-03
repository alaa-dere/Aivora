// lib/db.js
require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool(process.env.DATABASE_URL);

pool.getConnection()
  .then(conn => {
    console.log('✅ Connected to MySQL database successfully');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Failed to connect to MySQL:', err.message);
  });

module.exports = pool;