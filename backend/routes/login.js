const express = require('express');
const router = express.Router();
const dbAdmin = require('../db/db');

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

    console.log('📥 查询结果:', result.rows);

    if (result.rows.length === 0) {
      console.warn('❌ 用户不存在:', username);
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const user = result.rows[0];

    if (password === user.password) {
      console.log('✅ 登录成功:', username);
      return res.status(200).json({ success: true, message: '登录成功' });
    } else {
      console.warn('❌ 密码错误:', username);
      return res.status(400).json({ success: false, message: '密码错误' });
    }
  } catch (err) {
    console.error('💥 数据库查询失败:', err);
    return res.status(500).json({ success: false, message: '服务器错误，请稍后重试' });
  }
});

module.exports = router;


/*
router.post('/', (req, res) => {
  const { username, password } = req.body;

  console.log('收到登录请求:', username);

  if (!username || !password) {
    return res.status(400).json({ success: false, message: '缺少用户名或密码' });
  }

  // PostgreSQL 使用 $1 占位符，返回的是 rows 数组
  const query = 'SELECT * FROM admins WHERE username = ?';

  dbAdmin.execute(query, [username], (err, result) => {
    if (err) {
      console.error('数据库错误:', err);
      return res.status(500).json({ success: false, message: '数据库查询失败' });
    }

    if (result.length === 0) {
      console.log('用户不存在:', username);
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const user = result[0];

    if (password === user.password) {
      console.log('登录成功:', username);
      return res.status(200).json({ success: true, message: '登录成功' });
    } else {
      console.log('密码错误:', username);
      return res.status(400).json({ success: false, message: '密码错误' });
    }
  });
});
*/

module.exports = router;