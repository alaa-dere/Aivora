require('dotenv').config();
const mysql=require('mysql2/promise');
const raw=process.env.DATABASE_URL||'';
const url=raw.replace(/"/g,'');
(async()=>{
  const u=new URL(url);
  const conn=await mysql.createConnection({
    host:u.hostname,
    port:Number(u.port||3306),
    user:u.username,
    password:u.password,
    database:u.pathname.slice(1),
  });
  const [rows]=await conn.query('SELECT id, courseId, moduleId, lessonId, LEFT(questionText,80) AS q FROM course_question_bank ORDER BY createdAt DESC LIMIT 20');
  console.table(rows);
  const [c]=await conn.query('SELECT courseId,moduleId,lessonId,COUNT(*) cnt FROM course_question_bank GROUP BY courseId,moduleId,lessonId ORDER BY cnt DESC');
  console.table(c);
  const [mods]=await conn.query('SELECT id,title,courseId FROM module ORDER BY createdAt DESC LIMIT 20');
  console.table(mods);
  await conn.end();
})().catch((e)=>{console.error(e); process.exit(1);});
