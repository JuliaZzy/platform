const express = require('express');
const router = express.Router();
const dbAdmin = require('../db/db');
const bcrypt = require('bcrypt');

router.post('/', async (req, res) => {
  const { username, password } = req.body;

  console.log('🔐 收到登录请求:', username);

  if (!username || !password) {
    console.warn('⚠️ 缺少用户名或密码');
    return res.status(400).json({ success: false, message: '缺少用户名或密码' });
  }

  try {
    const query = 'SELECT * FROM admins WHERE username = $1';
    const result = await dbAdmin.query(query, [username]);

    if (result.rows.length === 0) {
      console.warn('❌ 登录尝试失败 (用户不存在):', username);
      return res.status(401).json({ success: false, message: '用户名或密码无效' });
    }

    const user = result.rows[0];
    const hashedPasswordFromDb = user.password; 
    const isMatch = await bcrypt.compare(password, hashedPasswordFromDb);

    if (isMatch) {
      console.log('✅ 登录成功:', username);
      return res.status(200).json({ success: true, message: '登录成功' });
    } else {
      console.warn('❌ 登录尝试失败 (密码错误):', username);
      return res.status(401).json({ success: false, message: '用户名或密码无效' });
    }
  } catch (err) {
    console.error('💥 数据库查询或密码比对失败:', err);
    return res.status(500).json({ success: false, message: '服务器错误，请稍后重试' });
  }
});

module.exports = router;