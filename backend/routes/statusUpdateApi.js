const express = require('express');
const router = express.Router();
const db = require('../db/db'); // 确保路径正确
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
    console.log(`[statusUpdateApi] 表 ${tableName}, ID ${rowId} 状态已更新为 ${status} 并提交。`);

    // ✅ 如果是 dataasset_non_listed_companies 表的状态被更新了，则触发 dataasset_finance_bank 的同步
    if (tableName === 'dataasset_non_listed_companies') {
      console.log(`[excelUpload/statusUpdateApi] 检测到 ${tableName} 更新/状态变更，准备同步 dataasset_finance_bank...`);
      try {
        const selfApiBase = process.env.SELF_API_BASE_URL; // ✅ 读取环境变量

        if (!selfApiBase) {
          console.error(`[CRITICAL ERROR] SELF_API_BASE_URL 环境变量未设置! 无法进行内部API调用来同步 dataasset_finance_bank。`);
          // 根据您的错误处理策略，这里可以选择：
          // 1. 静默失败并记录 (如下面的 console.warn)
          // 2. 抛出错误，但这可能会影响主操作的成功响应
          // 3. 对于开发环境，可以尝试回退到 localhost:PORT，但生产环境必须配置此变量
          // throw new Error('服务器内部配置错误，无法完成同步操作。'); 
        }

        // 只有在 selfApiBase 有效时才尝试调用
        if (selfApiBase) {
            const syncUrl = `${selfApiBase}/api/financeupload/sync-bank-table`; // ✅ 构建完整的URL
            console.log(`[Sync] Calling sync URL: ${syncUrl}`);
            const syncResponse = await axios.post(syncUrl); // ✅ 使用 axios

            if (syncResponse.data && syncResponse.data.success) {
              console.log(`[Sync] ✅ dataasset_finance_bank 同步成功 (由 ${tableName} 更新触发)。`);
            } else {
              console.warn(`[Sync] ⚠️ dataasset_finance_bank 同步请求已发送，但响应未明确成功或包含错误:`, syncResponse.data);
            }
        } else {
            // 如果 selfApiBase 未配置，记录一个更严重的警告或错误
            console.error(`[Sync] ⚠️ 未能执行 dataasset_finance_bank 同步，因为 SELF_API_BASE_URL 未配置。`);
        }

      } catch (syncError) {
        console.error(`❌ [Sync] 自动同步 dataasset_finance_bank 失败:`, 
          syncError.response ? JSON.stringify(syncError.response.data) : syncError.message
        );
        // 这个错误不应该中断主操作（如文件上传或状态更新）的成功响应，但需要被充分记录
      }
    }
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