const express = require('express');
const router = express.Router();
const db = require('../db/db');
const {
  handleSearch,
  handleExport,
  buildWhereClause
} = require('../utils/buildQueryHandlers');

const tableName = 'non_listed_companies_2025q1';
const enableHideFlag = true;

// ✅ 1. 模糊搜索公司名称
router.get('/search/company', handleSearch(db, tableName, 'company_name', enableHideFlag));

// ✅ 2. 模糊搜索数据资产内容
router.get('/search/content', handleSearch(db, tableName, 'dataasset_content', enableHideFlag));

// ✅ 3. 导出 Excel 文件
router.post('/export', handleExport(db, tableName, enableHideFlag));

// ✅ 4. 合并图表 + 表格 + 筛选项的 summary 接口
router.post('/summary', async (req, res) => {
  const filters = req.body.filters || {};
  const page = req.body.page || 1;
  const pageSize = req.body.pageSize || 10;
  const offset = (page - 1) * pageSize;
  const values = [];

  const whereClause = buildWhereClause(filters, values, enableHideFlag);

  try {
    // 📊 图表字段
    const chartFields = [
      'province_area',
      'company_business_type',
      'company_type',
      'admin_level',
      'dataasset_type',
      'dataasset_register_addrtype'
    ];

    // 📊 图表统计（并行执行）
    const chartData = {};
    await Promise.all(chartFields.map(async field => {
      const chartSql = `
        SELECT ${field} AS name, COUNT(*) AS value
        FROM ${tableName}
        ${whereClause}
        GROUP BY ${field}
        ORDER BY value DESC
      `;
      const result = await db.query(chartSql, values);
      chartData[field] = result.rows;
    }));

    // 📋 表格分页
    const countSql = `SELECT COUNT(*) FROM ${tableName} ${whereClause}`;
    const countRes = await db.query(countSql, values);
    const total = parseInt(countRes.rows[0].count, 10);

    const dataSql = `
      SELECT month_time, province_area, company_name, dataasset_content,
             accounting_subject, valuation_method, book_value, assess_value,
             dataasset_register_addr
      FROM ${tableName}
      ${whereClause}
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;
    const tableRes = await db.query(dataSql, [...values, pageSize, offset]);

    // 🎯 静态筛选项（可提速）
    const staticWhere = enableHideFlag ? `WHERE hide_flag NOT LIKE '%是%'` : '';
    const [opt1Res, opt2Res] = await Promise.all([
      db.query(`SELECT DISTINCT month_time FROM ${tableName} ${staticWhere} ORDER BY month_time`),
      db.query(`SELECT DISTINCT province_area FROM ${tableName} ${staticWhere} ORDER BY province_area`)
    ]);

    res.json({
      charts: chartData,
      table: { rows: tableRes.rows, total },
      options: {
        month_time: opt1Res.rows.map(r => r.month_time),
        province_area: opt2Res.rows.map(r => r.province_area)
      }
    });

  } catch (err) {
    console.error('❌ summary 接口失败:', err);
    res.status(500).json({ error: '加载 summary 数据失败' });
  }
});

module.exports = router;
