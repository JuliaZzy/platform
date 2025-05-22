const express = require('express');
const router = express.Router();
const db = require('../db/db');

// ✅ 增信银行贷款逻辑表：分页数据接口
router.get('/bank-detail', async (req, res) => {
  console.log('📥 收到 /api/finance/bank-detail 请求');
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize, 10) || 1000;
  const offset = (page - 1) * pageSize;

  const label = `增信银行贷款查询 - ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  console.time(label);

  const query = `
    SELECT 
      month_time, 
      CASE 
        WHEN parent_company_report = '' THEN company_name 
        ELSE parent_company_report || '（' || company_name || '）'
      END AS show_name,
      dataasset_content, 
      finance_value,
      finance_type,
      finance_orgs 
    FROM dataasset_non_listed_companies
    WHERE finance_value > 0 
      AND finance_type NOT ILIKE '%作价入股%'
      AND finance_type NOT ILIKE '%交易收入%' 
      AND hide_flag NOT LIKE '%是%'
    LIMIT $1 OFFSET $2
  `;

  try {
    const result = await db.query(query, [pageSize, offset]);
    console.timeEnd(label);
    res.json(result.rows);
  } catch (err) {
    console.error('❌ 增信银行贷款数据查询失败：', err);
    res.status(500).json({ error: '增信银行贷款数据查询失败' });
  }
});

// ✅ 新增接口：同步逻辑视图结果至物理表
router.post('/sync-bank-table', async (req, res) => {
  const label = `🛠️ 同步创建表 dataasset_finance_bank - ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  console.time(label);

  const dropQuery = `DROP TABLE IF EXISTS dataasset_finance_bank`;

  const createQuery = `
    CREATE TABLE dataasset_finance_bank AS
    SELECT 
      month_time, 
      CASE 
        WHEN parent_company_report = '' THEN company_name 
        ELSE parent_company_report || '（' || company_name || '）'
      END AS show_name,
      dataasset_content, 
      finance_value,
      finance_type,
      finance_orgs 
    FROM dataasset_non_listed_companies
    WHERE finance_value > 0 
      AND finance_type NOT ILIKE '%作价入股%'
      AND finance_type NOT ILIKE '%交易收入%' 
      AND hide_flag NOT LIKE '%是%'
  `;

  try {
    await db.query(dropQuery);
    await db.query(createQuery);
    console.timeEnd(label);
    res.json({ success: true, message: '✅ 表 dataasset_finance_bank 同步成功' });
  } catch (err) {
    console.error('❌ 表同步失败：', err);
    res.status(500).json({ error: '表同步失败', detail: err.message });
  }
});

module.exports = router;
