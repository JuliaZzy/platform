const express = require('express');
const router = express.Router();
const db = require('../db/db');
function isValidTableName(name) {
  return /^[a-zA-Z0-9_]+$/.test(name);
}

// 分页查询
router.get('/:tableName/page', async (req, res) => {
  const { tableName } = req.params;
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize, 10) || 30;
  const offset = (page - 1) * pageSize;

  if (!isValidTableName(tableName)) {
    return res.status(400).json({ error: '非法表名' });
  }

  const queryData = `SELECT * FROM ${tableName} LIMIT $1 OFFSET $2`;
  const queryCount = `SELECT COUNT(*) AS total FROM ${tableName}`;

  const label = `分页查询 - ${tableName} - ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  console.time(label);
  console.log(`🔍 正在查询表：${tableName}，第 ${page} 页，每页 ${pageSize} 条`);

  try {
    const countResult = await db.query(queryCount);
    const dataResult = await db.query(queryData, [pageSize, offset]);

    console.timeEnd(label);
    res.json({
      rows: dataResult.rows,
      total: parseInt(countResult.rows[0].total, 10),
      page,
      pageSize
    });
  } catch (err) {
    console.error(`❌ 查询失败 - 表 ${tableName}：`, err);
    res.status(500).json({ error: '分页数据查询失败', detail: err.message });
  }
});


module.exports = router;


