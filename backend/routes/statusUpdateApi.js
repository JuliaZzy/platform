const express = require('express');
const router = express.Router();
const db = require('../db/db'); // 确保路径正确

// 白名单，允许更新状态的表名
const ALLOWED_TABLES_FOR_STATUS_UPDATE = [
  'dataasset_listed_companies_2024',
  'dataasset_non_listed_companies',
  'dataasset_finance_bank',
  'dataasset_finance_stock',
  'dataasset_finance_other'
];

// 验证状态值是否有效
const isValidStatus = (status) => {
  return status === null || status === '' || ['repeat', 'delete', 'kept'].includes(status);
};

// PUT /status/:tableName/:rowId
router.put('/status/:tableName/:rowId', async (req, res) => {
  const { tableName, rowId } = req.params;
  let { status } = req.body; // newStatus 可以是 null, 'repeat', 'delete', 'kept'

  console.log(`[API] Received status update request for table: ${tableName}, rowId: ${rowId}, newStatus: ${status}`);

  // 1. 验证表名
  if (!ALLOWED_TABLES_FOR_STATUS_UPDATE.includes(tableName)) {
    return res.status(400).json({ error: `表 ${tableName} 不允许状态更新或表名无效。` });
  }

  // 2. 验证 rowId (假设是数字)
  const id = parseInt(rowId, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: '无效的行ID。' });
  }

  // 3. 验证 status 值
  // 如果前端传来空字符串，我们可能希望在数据库中存为 NULL
  if (status === '') {
    status = null;
  }
  if (!isValidStatus(status)) {
    return res.status(400).json({ error: `无效的状态值: ${status}。允许的值为 null, '', 'repeat', 'delete', 'kept'。` });
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const updateQuery = `UPDATE "${tableName}" SET status = $1 WHERE id = $2 RETURNING *`;
    const result = await client.query(updateQuery, [status, id]);

    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: `未找到要更新的行。表: ${tableName}, ID: ${id}` });
    }

    await client.query('COMMIT');
    res.json({ 
      success: true, 
      message: `表 ${tableName} 中 ID 为 ${id} 的行状态已更新为 ${status === null ? 'NULL' : status}。`,
      updatedRow: result.rows[0] 
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`❌ 更新状态失败 (表: ${tableName}, ID: ${id}):`, err);
    res.status(500).json({ error: '数据库更新状态失败。', detail: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;