// lib/db.ts
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

const pool = mysql.createPool(process.env.DATABASE_URL);

// اختبار الاتصال
pool.getConnection()
  .then(conn => {
    console.log('✅ Connected to MySQL database successfully');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Failed to connect to MySQL:', err.message);
  });

// تصدير الـ pool مباشرة
export default pool;