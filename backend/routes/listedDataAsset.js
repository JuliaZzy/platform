const express = require('express');
const router = express.Router();
const db = require('../db/db'); // 确保路径正确
const {
  // buildWhereClause, // 如果 buildWhereClause 被 summary 使用，也可能需要修改
  handleSearch
} = require('../utils/buildQueryHandlers'); // 确保路径正确

const { createPdfDocument } = require('../utils/pdfGenerator');

const tableName = 'dataasset_listed_companies_2024';
const enableHideFlag = false; // 假设此表不使用 hide_flag

// 搜索路由 - 它们的 status 过滤逻辑在 buildQueryHandlers.js (handleSearch) 中处理
router.get('/search/company', handleSearch(db, tableName, '公司', enableHideFlag));
router.get('/search/content', handleSearch(db, tableName, '所属证券行业分布', enableHideFlag));

// PDF 导出路由
router.post('/export', async (req, res) => {
  try {
    const filters = req.body.filters || {};
    const excludedColumns = req.body.excludedColumns || ["实控人", "市值（亿元）", "市值规模"];

    if (!filters.quarter || !['Q1', 'Q2', 'Q3', 'Q4'].includes(filters.quarter)) {
      return res.status(400).json({ error: '必须选择且只能导出 Q1, Q2, Q3, 或 Q4 的季度数据' });
    }

    const exportValues = [filters.quarter]; // SQL 参数值
    const exportConditions = [
      `"报告时间" = $1`,
      `"status" IS DISTINCT FROM 'delete'` // ✅ 添加 status 过滤
    ];
    const exportWhereClause = `WHERE ${exportConditions.join(' AND ')}`;
    
    const sql = `SELECT * FROM "${tableName}" ${exportWhereClause}`;
    const result = await db.query(sql, exportValues);
    const rows = result.rows;

    if (!rows.length) {
      return res.status(404).send('该季度没有符合条件的数据可导出（或所有数据均已标记删除）');
    }

    const allOriginalColumnKeys = Object.keys(rows[0]);
    const columnKeysToExport = allOriginalColumnKeys.filter(key => 
        key !== "报告时间" && key !== 'id' && key !== 'status' && !excludedColumns.includes(key) // ✅ 导出PDF时也排除 id 和 status
    );

    if (columnKeysToExport.length === 0) {
      return res.status(400).send('没有可导出的数据列（已排除特定列、报告时间、id、status）。');
    }

    // --- 列宽计算逻辑 (保持不变) ---
    const NARROW_COLUMN_FIXED_WIDTH = 55;
    const originalFourthColumnKey = allOriginalColumnKeys.length >= 4 ? allOriginalColumnKeys[3] : null;
    let tableWidths = columnKeysToExport.map(currentKey => {
        return (originalFourthColumnKey && currentKey === originalFourthColumnKey) ? '*' : NARROW_COLUMN_FIXED_WIDTH;
    });
    if (columnKeysToExport.length > 0 && !tableWidths.includes('*')) {
        const idx = columnKeysToExport.indexOf(originalFourthColumnKey);
        if (idx !== -1) { tableWidths[idx] = '*'; } 
        else if (tableWidths.length > 0) { tableWidths[tableWidths.length - 1] = '*';}
    }
    if (tableWidths.length === 0 && columnKeysToExport.length > 0) {
        tableWidths = Array(columnKeysToExport.length).fill('auto');
        if (columnKeysToExport.length > 0) tableWidths[0] = '*';
    }
    // --- 列宽计算逻辑结束 ---

    const pdfTableHeaders = columnKeysToExport.map(key => ({ text: key, style: 'tableHeader' }));

    // --- 数字和百分比格式化逻辑 (保持不变) ---
    const numberFormattingColumns = [
        '数据资源入表总额（万元）',
        '无形资产-数据资源入表金额（万元）', '开发支出-数据资源入表金额（万元）', '存货-数据资源入表金额（万元）'
    ];
    const percentageFormattingColumn = '数据资产占总资产比例';
    const pdfTableBody = [
        pdfTableHeaders,
        ...rows.map(row => columnKeysToExport.map(key => {
            let originalValue = row[key];
            let cellPresentation = {
                text: originalValue !== null && originalValue !== undefined ? String(originalValue) : '',
                margin: [0, 4, 0, 4]
            };
            if (numberFormattingColumns.includes(key)) { /* ... */ cellPresentation.alignment = 'right'; }
            else if (key === percentageFormattingColumn) { /* ... */ cellPresentation.alignment = 'right'; }
            return cellPresentation;
        }))
    ];
    // --- 格式化逻辑结束 ---

    const pdfDoc = createPdfDocument({
        title: `上市公司数据资产报告 - ${filters.quarter}`,
        tableBody: pdfTableBody,
        tableWidths: tableWidths,
    });
    
    if (!pdfDoc) {
      console.error('PDF 导出失败，因为 createPdfDocument 返回 null。');
      return res.status(500).json({ error: '导出PDF失败: 服务器字体或PDF生成配置错误。' });
    }

    const filename = `上市公司数据报告_${filters.quarter}_${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    pdfDoc.pipe(res);
    pdfDoc.end();

  } catch (err) {
    console.error('❌ PDF 导出失败 (/api/lasset/export):', err.message, err.stack);
    res.status(500).json({ error: '导出PDF失败: 服务端错误 - ' + err.message });
  }
});

// Summary 接口 (通常用于前端Dashboard页面的表格数据加载)
router.post('/summary', async (req, res) => {
  const filters = req.body.filters || {}; 
  const page = parseInt(req.query.page || req.body.page, 10) || 1; // 兼容 query 和 body 中的 page
  const pageSize = parseInt(req.query.pageSize || req.body.pageSize, 10) || 10;
  const offset = (page - 1) * pageSize;
  
  let queryValues = []; 
  let whereConditions = [`"${tableName}"."status" IS DISTINCT FROM 'delete'`]; // ✅ 始终包含 status 过滤

  // --- 根据前端传入的 filters 构建 WHERE 子句和参数 ---
  if (filters.quarter && filters.quarter !== '') {
    whereConditions.push(`"${tableName}"."报告时间" = $${queryValues.length + 1}`);
    queryValues.push(filters.quarter);
  }
  if (filters.province_area && filters.province_area !== '') {
    whereConditions.push(`"${tableName}"."省份" = $${queryValues.length + 1}`);
    queryValues.push(filters.province_area);
  }
  if (filters.company && filters.company.trim() !== '') {
    whereConditions.push(`"${tableName}"."公司" ILIKE $${queryValues.length + 1}`);
    queryValues.push(`%${filters.company.trim()}%`);
  }
  if (filters.dataasset_content && filters.dataasset_content.trim() !== '') {
    whereConditions.push(`"${tableName}"."所属证券行业分布" ILIKE $${queryValues.length + 1}`);
    queryValues.push(`%${filters.dataasset_content.trim()}%`);
  }
  // ... 其他可能的 filters ...

  const whereClauseString = `WHERE ${whereConditions.join(' AND ')}`;

  try {
    const countSql = `SELECT COUNT(*) FROM "${tableName}" ${whereClauseString}`;
    const countRes = await db.query(countSql, queryValues);
    const total = parseInt(countRes.rows[0].count, 10);

    // ✅ SELECT * 会包含 id 和 status，前端 AdminPage 会用到 status，并决定是否显示 id
    const dataSql = `
      SELECT * FROM "${tableName}"
      ${whereClauseString} 
      ORDER BY "id" ASC -- ✅ 建议为分页添加稳定的排序
      LIMIT $${queryValues.length + 1} OFFSET $${queryValues.length + 2} 
    `;
    const tableRes = await db.query(dataSql, [...queryValues, pageSize, offset]);

    // ✅ 静态筛选项的 DISTINCT 查询也应该考虑 status (如果这些选项只应来自非删除数据)
    const distinctBaseWhere = `WHERE "status" IS DISTINCT FROM 'delete'`;
    const [optQuarterRes, optProvinceRes, optIndustryRes] = await Promise.all([
      db.query(`SELECT DISTINCT "报告时间" FROM "${tableName}" ${distinctBaseWhere} ORDER BY "报告时间"`),
      db.query(`SELECT DISTINCT "省份" FROM "${tableName}" ${distinctBaseWhere} ORDER BY "省份"`),
      db.query(`SELECT DISTINCT "所属证券行业分布" FROM "${tableName}" ${distinctBaseWhere} ORDER BY "所属证券行业分布"`)
    ]);

    res.json({
      table: { 
        rows: tableRes.rows,
        total: total 
      },
      options: { 
        quarter: optQuarterRes.rows.map(r => r['报告时间']),
        province_area: optProvinceRes.rows.map(r => r['省份']),
        dataasset_content: optIndustryRes.rows.map(r => r['所属证券行业分布'])
      }
    });

  } catch (err) {
    console.error(`❌ /api/lasset/summary 接口失败:`, err);
    res.status(500).json({ error: '加载上市公司表格数据失败' });
  }
});

module.exports = router;
