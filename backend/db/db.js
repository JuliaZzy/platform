// db.js
require('dotenv').config(); // 建议在主文件(server.js)顶部加载，这里也可保留作为后备

const { Pool } = require('pg');

// 1. 判断当前是否为生产环境
const isProduction = process.env.NODE_ENV === 'production';

// 2. 创建一个基础的数据库配置对象
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
};

// 3. 关键逻辑：只有在非生产环境（例如您的本地电脑连接Neon）时，才添加SSL配置
if (!isProduction) {
  dbConfig.ssl = {
    rejectUnauthorized: false, // 仅在非生产环境（如本地开发）时使用
  };
}

// 4. 使用我们动态生成的配置来创建连接池
const pool = new Pool(dbConfig);


// 可选：更新连接测试的日志，使其更通用
pool.query('SELECT 1', (err) => {
  if (err) {
    console.error('❌ 数据库连接测试失败:', err);
  } else {
    console.log(`✅ 数据库连接测试成功 (环境: ${process.env.NODE_ENV || 'development'})`);
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: async () => {
    const client = await pool.connect();
    console.log('DB client checked out from pool');
    return client;
  }
};