require('dotenv').config();

const { Pool } = require('pg');
const isProduction = process.env.NODE_ENV === 'production';
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
};

if (!isProduction) {
  dbConfig.ssl = {
    rejectUnauthorized: false,
  };
}

const pool = new Pool(dbConfig);

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