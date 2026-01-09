// server.js

import express from 'express';
import cors from 'cors';
import { createPool } from 'mysql2';
import bcrypt from 'bcrypt';

// Import Route
import authRoute from './routes/auth.js';
import questionRoute from './routes/questions.js';

const app = express();

// 🚩 จุดแก้ที่ 1: รับค่า PORT จาก Railway (สำคัญมาก ไม่งั้นโดน Kill)
const port = process.env.PORT || 4000;
// ต้องมี '0.0.0.0'
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
});

app.use(cors());
app.use(express.json());

// สร้าง Pool (แนะนำให้ใช้ process.env เพื่อความปลอดภัยดึงค่าจาก Railway)
const pool = createPool({
  host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
  port: process.env.DB_PORT || 4000,
  user: '3J3R4CVkCymAtX5.root',
  password: 'XIEOhSrELG3xvkRA',
  database: 'sati_game',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true
    }
});

console.log('✅ Connected to database (via pool)');

// เรียกใช้ Route โดยส่ง pool เข้าไป
app.use('/', authRoute(pool)); 
app.use('/questions', questionRoute(pool));

// 🚩 จุดแก้ที่ 2: เพิ่ม '0.0.0.0' เพื่อให้ Railway มองเห็น Server เรา
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
