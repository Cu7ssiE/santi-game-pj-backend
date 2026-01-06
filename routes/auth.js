// routes/auth.js
import express from 'express';
import bcrypt from 'bcrypt';

export default function (pool) {
    const router = express.Router();

    // ✅ API สมัครสมาชิก
    router.post('/register', async (req, res) => {
        const { username, password, email, phone, birthdate, address, thai_id } = req.body;

        // 1. 🟡 แก้ SQL: เช็คว่ามี Username หรือ Email หรือ Phone ซ้ำไหม (ใช้ OR)
        const checkSql = "SELECT username, email, phone FROM user WHERE username = ? OR email = ? OR phone = ?";
        
        // ส่ง parameter ไป 3 ตัวตามลำดับใน SQL
        pool.query(checkSql, [username, email, phone], async (err, results) => {
            if (err) return res.status(500).json({ error: err.message });

            // 2. 🟡 ตรวจสอบผลลัพธ์: ถ้าเจอข้อมูลซ้ำ ให้เช็คว่าซ้ำที่ตรงไหน
            if (results.length > 0) {
                const existingUser = results[0];

                if (existingUser.username === username) {
                    return res.status(400).json({ error: "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว!" });
                }
                if (existingUser.email === email) {
                    return res.status(400).json({ error: "อีเมลนี้ถูกใช้งานแล้ว!" });
                }
                if (existingUser.phone === phone) {
                    return res.status(400).json({ error: "เบอร์โทรศัพท์นี้ถูกใช้งานแล้ว!" });
                }
            }

            // ถ้าไม่ซ้ำเลย ก็ไปต่อ (Hash รหัส -> บันทึกข้อมูล)
            try {
                const hashedPassword = await bcrypt.hash(password, 10);
                const insertSql = "INSERT INTO user (username, password, email, phone, birthdate, address, thai_id) VALUES (?, ?, ?, ?, ?, ?, ?)";
                
                pool.query(insertSql, [username, hashedPassword, email, phone, birthdate, address, thai_id], (err, result) => {
                    if (err) return res.status(500).json({ error: "สมัครสมาชิกไม่สำเร็จ: " + err.message });
                    res.json({ message: "สมัครสมาชิกเรียบร้อย!", userId: result.insertId });
                });
            } catch (hashError) {
                res.status(500).json({ error: "เกิดข้อผิดพลาดในการเข้ารหัส" });
            }
        });
    });

    // ... (ส่วน Login เหมือนเดิม) ...
    router.post('/login', (req, res) => {
        // ... โค้ดเดิม ...
        const { username, password } = req.body;
        const sql = "SELECT * FROM user WHERE username = ?";
        pool.query(sql, [username], async (err, results) => {
           // ... (Login logic) ...
           if (err) return res.status(500).json({ error: err.message });
           if (results.length > 0) {
               const user = results[0];
               const match = await bcrypt.compare(password, user.password);
               if (match) {
                   res.json({ success: true, user: { id: user.id, username: user.username, email: user.email } });
               } else {
                   res.status(401).json({ error: "รหัสผ่านไม่ถูกต้อง" });
               }
           } else {
               res.status(401).json({ error: "ไม่พบชื่อผู้ใช้นี้" });
           }
        });
    });

    return router;
};