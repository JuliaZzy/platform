const express = require('express');
const router = express.Router();
const db = require('../db/db');

// Neon (PostgreSQL) 获取所有用户表名
router.get('/', async (req, res) => {
  const query = `
    SELECT tablename
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'public'
  `;

  try {
    const result = await db.query(query);
    const tableNames = result.rows.map(row => row.tablename);
    res.json(tableNames);
  } catch (err) {
    console.error('获取表列表失败:', err);
    res.status(500).json({ error: '无法获取表名列表' });
  }
});

/*
// 获取当前数据库中所有表名
router.get('/', (req, res) => {
  const query = 'SHOW TABLES';

  db.query(query, (err, results) => {
    if (err) {
      console.error('获取表列表失败:', err);
      return res.status(500).json({ error: '无法获取表名列表' });
    }

    // 提取表名字段（根据数据库名自动识别字段名）
    const tableKey = Object.keys(results[0])[0];
    const tableNames = results.map(row => row[tableKey]);

    res.json(tableNames);
  });
});
*/

module.exports = router;
