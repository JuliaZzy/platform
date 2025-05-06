const express = require('express');
const router = express.Router();
const db = require('../db/dbDataAsset');

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

module.exports = router;
