/*
const mysql = require('mysql2');
const dbAdmin = mysql.createConnection({
  host: 'trolley.proxy.rlwy.net',
  user: 'root',
  password: 'ePLJlyMyIidxMYJyxOaQpFwBQWxLvtoU',
  database: 'admin_db',
  port: 56770
});
dbAdmin.connect(err => {
  if (err) throw err;
  console.log('Connected to admin_db');
});
module.exports = dbAdmin;
*/

// db.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });  // ✅ 加载 .env 配置

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Neon 的要求
  },
});

// 可选：只在第一次 pool 初始化时测试连接
pool.query('SELECT 1', (err) => {
  if (err) {
    console.error('❌ Neon 数据库连接失败:', err);
  } else {
    console.log('✅ 已连接到 Neon PostgreSQL 数据库');
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
