// backend/routes/dataTable.js
const express = require('express');
const router = express.Router();
const db = require('../db/db');

// 工具函数：防止 SQL 注入
function isValidTableName(name) {
  return /^[a-zA-Z0-9_]+$/.test(name);
}

// ✅ 分页查询接口：/api/dataTable/:tableName/page?page=1&pageSize=30
router.get('/:tableName/page', (req, res) => {
  const { tableName } = req.params;
  let page = parseInt(req.query.page) || 1;
  let pageSize = parseInt(req.query.pageSize) || 30;
  const offset = (page - 1) * pageSize;

  if (!isValidTableName(tableName)) {
    return res.status(400).json({ error: '非法表名' });
  }

  const queryData = `SELECT * FROM ${tableName} LIMIT $1 OFFSET $2`;
  const queryCount = `SELECT COUNT(*) AS total FROM ${tableName}`;

  // const queryData = `SELECT * FROM \`${tableName}\` LIMIT ? OFFSET ?`;
  // const queryCount = `SELECT COUNT(*) AS total FROM \`${tableName}\``;

  db.query(queryCount, [], (err, countResult) => {
    if (err) return res.status(500).json({ error: '统计失败' });
    const total = countResult.rows[0].total;

    db.query(queryData, [pageSize, offset], (err, dataResult) => {
      if (err) return res.status(500).json({ error: '查询失败' });
      res.json({ rows: dataResult.rows, total });
    });
  });
});

/*
db.query(queryCount, (err, countResult) => {
  if (err) return res.status(500).json({ error: '统计失败' });
  const total = countResult[0].total;

  db.query(queryData, [pageSize, offset], (err, dataResult) => {
    if (err) return res.status(500).json({ error: '查询失败' });
    res.json({ rows: dataResult, total });
  });
});
});
*/

module.exports = router;


