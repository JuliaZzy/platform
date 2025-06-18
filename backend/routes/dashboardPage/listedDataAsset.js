const express = require('express');
const router = express.Router();
const db = require('../../db/db');
const pdfFormatters = require('../../utils/pdfFormatters');
const { handleSearch } = require('../../utils/buildQueryHandlers');
const { createPdfDocument } = require('../../utils/pdfGenerator');

const tableName = 'dataasset_listed_companies_2024';
const enableHideFlag = false;

// 搜索
router.get('/search/company', handleSearch(db, tableName, '公司', enableHideFlag));
router.get('/search/content', handleSearch(db, tableName, '所属证券行业分布', enableHideFlag));

// PDF 导出
router.post('/export', async (req, res) => {
  try {
    const filters = req.body.filters || {};
    const excludedColumns = req.body.excludedColumns || ["实控人", "市值（亿元）", "市值规模"];
    const distinctQuartersQuery = `
      SELECT DISTINCT "报告时间" 
      FROM "${tableName}" 
      WHERE "status" IS DISTINCT FROM 'delete' 
      ORDER BY "报告时间" DESC
    `;

    let availableQuarters = [];
    try {
      const distinctQuartersResult = await db.query(distinctQuartersQuery);
      availableQuarters = distinctQuartersResult.rows.map(r => r['报告时间']);
    } catch (dbError) {
      console.error('❌ PDF 导出 - 无法从数据库获取可用季度列表:', dbError);
      return res.status(500).json({ error: '获取可用季度选项失败，请稍后再试。' });
    }

    if (availableQuarters.length === 0) {
      return res.status(400).json({ error: '系统中当前没有可供导出的报告时间数据。' });
    }
    if (!filters.quarter || !availableQuarters.includes(filters.quarter)) {
      const availableQuartersMessage = availableQuarters.join(', ');
      return res.status(400).json({ 
        error: `必须选择一个有效的报告时间进行导出。当前有效的报告时间为: ${availableQuartersMessage}。` 
      });
    }

    const exportValues = [filters.quarter];
    const exportConditions = [
      `"报告时间" = $1`,
      `"status" IS DISTINCT FROM 'delete'`
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
            key !== "报告时间" &&
            key !== 'id' &&
            key !== 'status' &&
            key !== 'updated_at' &&
            !excludedColumns.includes(key)
        );
    if (columnKeysToExport.length === 0) {
      return res.status(400).send('没有可导出的数据列（已排除特定列、报告时间、id、status）。');
    }

    // 格式化
    const tableWidths = [];
    const formattingRules = {};

    // 需要格式化的列索引 (0-based)
    const numberFormatIndices = [5, 7, 8, 9];
    const percentageFormatIndex = 6;

    columnKeysToExport.forEach((key, index) => {
        // 1: 前4列列宽50，内容居中
        if (index < 4) {
            tableWidths.push(50);
            formattingRules[key] = (value) => pdfFormatters.alignCenter(value);
        } 
        // 2: 后面的列自动控制列宽
        else {
            tableWidths.push('*');
        }

        // 3: 第6,8,9,10列加千分位、保留两位小数
        if (numberFormatIndices.includes(index)) {
            formattingRules[key] = (value) => pdfFormatters.alignRight(pdfFormatters.formatNumber(value, 2));
        }

        // 4: 第7列百分比格式、保留一位小数
        if (index === percentageFormatIndex) {
            formattingRules[key] = (value) => pdfFormatters.alignRight(pdfFormatters.formatPercentage(value, 2));
        }
    });

    const pdfTableHeaders = columnKeysToExport.map(key => ({ text: key, style: 'tableHeader' }));
    const tableBody = pdfFormatters.applyPdfFormatting(
        rows,
        columnKeysToExport,
        formattingRules
    );
    
    const pdfTableBody = [pdfTableHeaders, ...tableBody];
    const pdfDoc = createPdfDocument({
      title: `A股上市公司数据资产入表清单 - ${filters.quarter}`,
      tableBody: pdfTableBody,
      tableWidths: tableWidths,
    });
    
    if (!pdfDoc) {
        console.error('PDF 导出失败，因为 createPdfDocument 返回 null。');
        return res.status(500).json({ error: '导出PDF失败: 服务器字体或PDF生成配置错误。' });
    }

    const filename = `A股上市公司数据资产入表清单_${filters.quarter}_${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    pdfDoc.pipe(res);
    pdfDoc.end();

  } catch (err) {
      console.error('❌ PDF 导出失败 (/api/lasset/export):', err.message, err.stack);
      res.status(500).json({ error: '导出PDF失败: 服务端错误 - ' + err.message });
  }
});

// Summary
router.post('/summary', async (req, res) => {
  const filters = req.body.filters || {}; 
  const page = parseInt(req.query.page || req.body.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize || req.body.pageSize, 10) || 10;
  const offset = (page - 1) * pageSize;
  
  let queryValues = []; 
  let whereConditions = [`"${tableName}"."status" IS DISTINCT FROM 'delete'`];
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

  const whereClauseString = `WHERE ${whereConditions.join(' AND ')}`;

  try {
    const countSql = `SELECT COUNT(*) FROM "${tableName}" ${whereClauseString}`;
    const countRes = await db.query(countSql, queryValues);
    const total = parseInt(countRes.rows[0].count, 10);
    const dataSql = `
      SELECT * FROM "${tableName}"
      ${whereClauseString} 
      ORDER BY "id" ASC -- ✅ 建议为分页添加稳定的排序
      LIMIT $${queryValues.length + 1} OFFSET $${queryValues.length + 2} 
    `;
    const tableRes = await db.query(dataSql, [...queryValues, pageSize, offset]);
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
