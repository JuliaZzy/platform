const express = require('express');
const router = express.Router();
const db = require('../db/db');
const axios = require('axios');

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
  let { status } = req.body;

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
    console.log(`[statusUpdateApi] 表 ${tableName}, ID ${rowId} 状态已更新为 ${status} 并提交。`);

    // ✅ 如果是 dataasset_non_listed_companies 表的状态被更新了，则触发 dataasset_finance_bank 的同步
    if (tableName === 'dataasset_non_listed_companies') {
      console.log(`[excelUpload/statusUpdateApi] 检测到 ${tableName} 更新/状态变更，准备同步 dataasset_finance_bank...`); // You can update this log message prefix
      try {
        // 👇 Consider a more backend-specific environment variable name
        const selfApiBase = process.env.VUE_APP_API_URL;

        if (!selfApiBase) {
          console.error(`[CRITICAL ERROR][statusUpdateApi - Sync] 后端API基础URL环境变量 (VUE_APP_API_URL) 未设置! 无法进行内部API调用来同步 dataasset_finance_bank。`);
        } else {
          // 👇 Ensure this URL construction is correct based on your selfApiBase and how financeupload routes are mounted
          const syncUrl = `${selfApiBase}/api/financeupload/sync-bank-table`;
          console.log(`[Sync][statusUpdateApi] Calling sync URL: ${syncUrl}`);

          // 👇 新的非阻塞调用
          axios.post(syncUrl)
            .then(syncResponse => {
              if (syncResponse.data && syncResponse.data.success) {
                console.log(`[Sync][statusUpdateApi] ✅ dataasset_finance_bank 同步成功 (由 ${tableName} 状态更新触发)。`);
              } else {
                console.warn(`[Sync][statusUpdateApi] ⚠️ dataasset_finance_bank 同步请求已发送（由状态更新触发），但响应未明确成功或包含错误:`, syncResponse.data);
              }
            })
            .catch(syncError => {
              console.error(`❌ [Sync][statusUpdateApi] 自动同步 dataasset_finance_bank 失败 (由 ${tableName} 状态更新触发):`,
                syncError.response ? JSON.stringify(syncError.response.data) : syncError.message
              );
            });
        }
      } catch (syncTriggerError) { // This catch is for errors in setting up the call (e.g., env var missing)
        console.error(`❌ [Sync][statusUpdateApi] 触发同步操作时发生意外错误:`, syncTriggerError.message);
      }
    }
    // ✅ 同步触发逻辑结束
    
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