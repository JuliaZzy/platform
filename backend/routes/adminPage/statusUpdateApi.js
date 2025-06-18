const express = require('express');
const router = express.Router();
const db = require('../../db/db');
const axios = require('axios');

const ALLOWED_TABLES_FOR_STATUS_UPDATE = [
  'dataasset_listed_companies_2024',
  'dataasset_non_listed_companies',
  'dataasset_finance_bank',
  'dataasset_finance_stock',
  'dataasset_finance_other'
];

const isValidStatus = (status) => {
  return status === null || status === '' || ['repeat', 'delete', 'kept'].includes(status);
};

/**
 * 触发 dataasset_finance_bank 表的同步操作
 * @param {string} triggerSource
 */
function triggerBankTableSync(triggerSource = 'UnknownSource') {
  console.log(`[SyncTrigger from ${triggerSource}] 检测到数据变更，准备同步 dataasset_finance_bank...`);
  try {
    const internalApiBase = process.env.VUE_APP_API_URL;

    if (!internalApiBase) {
      console.error(`[CRITICAL ERROR][SyncTrigger from ${triggerSource}] 后端API基础URL环境变量未设置! 无法进行内部API调用来同步 dataasset_finance_bank。`);
      return;
    }
    const syncUrl = `${internalApiBase}/api/financeupload/sync-bank-table`;
    console.log(`[SyncTrigger from ${triggerSource}] Calling sync URL: ${syncUrl}`);

    axios.post(syncUrl)
      .then(syncResponse => {
        if (syncResponse.data && syncResponse.data.success) {
          console.log(`[SyncTrigger from ${triggerSource}] ✅ dataasset_finance_bank 同步成功。`);
        } else {
          console.warn(`[SyncTrigger from ${triggerSource}] ⚠️ dataasset_finance_bank 同步请求已发送，但响应未明确成功或包含错误:`, syncResponse.data);
        }
      })
      .catch(syncError => {
        console.error(`❌ [SyncTrigger from ${triggerSource}] 自动同步 dataasset_finance_bank 失败:`,
          syncError.response ? JSON.stringify(syncError.response.data) : syncError.message
        );
      });
  } catch (syncSetupError) {
    console.error(`❌ [SyncTrigger from ${triggerSource}] 触发同步操作时发生意外错误:`, syncSetupError.message);
  }
}

router.put('/status/:tableName/:rowId', async (req, res) => {
  const { tableName, rowId } = req.params;
  let { status } = req.body;

  console.log(`[API] Received status update request for table: ${tableName}, rowId: ${rowId}, newStatus: ${status}`);

  if (!ALLOWED_TABLES_FOR_STATUS_UPDATE.includes(tableName)) {
    return res.status(400).json({ error: `表 ${tableName} 不允许状态更新或表名无效。` });
  }

  const id = parseInt(rowId, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: '无效的行ID。' });
  }

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

    if (result.rowCount > 0) {
        await client.query('COMMIT');
        console.log(`[statusUpdateApi] 表 ${tableName}, ID ${rowId} 状态已更新为 ${status} 并提交。`);

        if (tableName === 'dataasset_non_listed_companies') {
          triggerBankTableSync(`statusUpdate for table ${tableName}`);
        }

        res.json({
          success: true,
          message: `表 ${tableName} 中 ID 为 ${id} 的行状态已更新为 ${status === null ? 'NULL' : status}。`,
          updatedRow: result.rows[0]
        });
    } else {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: `未找到要更新的行。表: ${tableName}, ID: ${id}` });
    }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`❌ 更新状态失败 (表: ${tableName}, ID: ${id}):`, err);
    res.status(500).json({ error: '数据库更新状态失败。', detail: err.message });
  } finally {
    client.release();
  }
});

module.exports = {
  router,
  triggerBankTableSync
};