const express = require('express');
const router = express.Router();
const dbDataAsset = require('../db/dbDataAsset');

// 获取任意表的数据（注意安全性）
router.get('/:tableName', (req, res) => {
  const { tableName } = req.params;

  // 简单防止 SQL 注入（只允许字母、数字、下划线）
  if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
    return res.status(400).json({ error: '非法表名' });
  }

  const query = `SELECT * FROM \`${tableName}\``;

  console.log('即将执行 SQL 查询：', query);

  dbDataAsset.query(query, (err, results) => {
    if (err) {
      console.error('查询数据失败:', err);
      return res.status(500).json({ error: '查询失败' });
    }

    res.json(results);
  });
});

module.exports = router;
