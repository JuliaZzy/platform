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

  /**
   * ✅ 新增：从连接池获取一个客户端，用于事务处理或需要多个查询共享连接的场景
   * 使用者必须在完成后调用 client.release() 将客户端释放回连接池。
   */
  getClient: async () => {
    const client = await pool.connect();
    console.log('DB client checked out from pool'); // 可选日志
    // 您可以在这里为获取到的 client 添加一个简单的 query 封装，如果需要的话
    // 例如: const originalQuery = client.query;
    // client.query = (...args) => {
    //   console.log('Executing query on dedicated client:', args[0]);
    //   return originalQuery.apply(client, args);
    // };
    return client;
  }
};
