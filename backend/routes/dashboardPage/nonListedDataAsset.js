const express = require('express');
const router = express.Router();
const db = require('../../db/db');
const pdfFormatters = require('../../utils/pdfFormatters');
const {
  buildWhereClause,
  handleSearch
} = require('../../utils/buildQueryHandlers');
const { createPdfDocument } = require('../../utils/pdfGenerator');

const tableName = 'dataasset_non_listed_companies';
const enableHideFlag = true; // 启用 hide_flag 筛选

// 搜索
router.get('/search/company', handleSearch(db, tableName, 'company_name', enableHideFlag));
router.get('/search/content', handleSearch(db, tableName, 'dataasset_content', enableHideFlag));

// 导出PDF
router.post('/export', async (req, res) => {
  try {
    const filters = req.body.filters || {};
    const values = [];
    let whereClauseFromBuilder = buildWhereClause(filters, values, enableHideFlag, 'non-listed');
    const finalConditions = [`"${tableName}"."status" IS DISTINCT FROM 'delete'`];
    if (whereClauseFromBuilder) {
      if (whereClauseFromBuilder.toUpperCase().startsWith('WHERE ')) {
        finalConditions.push(`(${whereClauseFromBuilder.substring(6)})`);
      } else {
        finalConditions.push(`(${whereClauseFromBuilder})`);
      }
    }
    const whereClause = `WHERE ${finalConditions.join(' AND ')}`;
    
    const sql = `
      SELECT id, month_time, province_area, company_name, dataasset_content, dataasset_register_addr 
      FROM "${tableName}" ${whereClause}
      ORDER BY "id" ASC 
    `;
    const result = await db.query(sql, values);
    const rows = result.rows;

    if (!rows.length) {
      return res.status(404).send('没有符合当前筛选条件的数据可导出（或所有相关数据已标记删除）。');
    }

    // 2. 中文列名
    const columnMap = {
      month_time: '入表月份',
      province_area: '省级行政区',
      company_name: '入表企业',
      dataasset_content: '数据资产内容',
      dataasset_register_addr: '数据资产登记机构'
    };
    const orderedDbKeys = Object.keys(columnMap); 

    const pdfTableHeaders = orderedDbKeys.map(dbKey => ({ text: columnMap[dbKey], style: 'tableHeader' }));
        const pdfTableBody = [
            pdfTableHeaders,
            ...rows.map(row => orderedDbKeys.map((dbKey, index) => {
                const originalValue = row[dbKey];
                let cellText = originalValue !== null && originalValue !== undefined ? String(originalValue) : '';

                if (dbKey === 'month_time') {
                    cellText = pdfFormatters.formatYearMonth(originalValue);
                }
                const cellProperties = { text: cellText, margin: [0, 2, 0, 2] };
                if (index < 2) {
                    cellProperties.alignment = 'center';
                }
                
                return cellProperties;
            }))
        ];
        
        const tableWidths = [80, 80, 'auto', 'auto', 'auto'];

        const pdfDoc = createPdfDocument({
            title: `非上市公司数据资产入表清单`,
            tableBody: pdfTableBody,
            tableWidths: tableWidths,
        });

        if (!pdfDoc) {
            return res.status(500).json({ error: '导出PDF失败: 服务器字体或PDF生成配置错误。' });
        }

        const filename = `非上市公司数据资产入表清单_${Date.now()}.pdf`; 
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`); 
        pdfDoc.pipe(res);
        pdfDoc.end();

    } catch (err) {
        console.error('❌ PDF 导出失败 (/api/nlasset/export):', err.message, err.stack);
        res.status(500).json({ error: '导出PDF失败(非上市): 服务端错误 - ' + err.message });
    }
});

// Summary
router.post('/summary', async (req, res) => {
  const filters = req.body.filters || {};
  const page = parseInt(req.query.page || req.body.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize || req.body.pageSize, 10) || 10;
  const offset = (page - 1) * pageSize;
  const values = [];
  const whereClauseForQueries = buildWhereClause(filters, values, enableHideFlag, 'non-listed'); 
  const cumulativeComboChartSql = `
    WITH quarterly_data AS (
      SELECT
        "quarter_time",
        COUNT(1) AS quarterly_count,
        SUM("finance_value") / 10000 AS quarterly_value
      FROM "dataasset_non_listed_companies"
      ${whereClauseForQueries}
      GROUP BY "quarter_time"
    )
    SELECT
      "quarter_time",
      SUM(quarterly_count) OVER (ORDER BY "quarter_time" ASC) AS "cumulative_count",
      SUM(quarterly_value) OVER (ORDER BY "quarter_time" ASC) AS "cumulative_value"
    FROM quarterly_data
    ORDER BY "quarter_time" ASC;
  `;

  try {
    const chartFields = [
      'province_area', 'company_business_type', 'company_type',
      'admin_level', 'dataasset_type', 'dataasset_register_addrtype'
    ];
    const chartPromises = chartFields.map(field => {
      if (!/^[a-zA-Z0-9_]+$/.test(field)) return Promise.resolve({ rows: [] });
      const chartSql = `
        SELECT "${field}" AS name, COUNT(*) AS value
        FROM "${tableName}"
        ${whereClauseForQueries}
        GROUP BY "${field}"
        ORDER BY value DESC
      `;
      return db.query(chartSql, values);
    });

    const countSql = `SELECT COUNT(*) FROM "${tableName}" ${whereClauseForQueries}`;
    const dataSql = `
      SELECT * FROM "${tableName}"
      ${whereClauseForQueries}
      ORDER BY "id" ASC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;

    const distinctBaseConditions = [`"status" IS DISTINCT FROM 'delete'`];
    if (enableHideFlag) {
        distinctBaseConditions.push(`"hide_flag" NOT LIKE '%是%'`);
    }
    const distinctWhereClause = `WHERE ${distinctBaseConditions.join(' AND ')}`;
    const optionsSql1 = `SELECT DISTINCT month_time FROM "${tableName}" ${distinctWhereClause} ORDER BY month_time`;
    const optionsSql2 = `SELECT DISTINCT province_area FROM "${tableName}" ${distinctWhereClause} ORDER BY province_area`;

    const allPromises = [
      ...chartPromises,
      db.query(countSql, values),
      db.query(dataSql, [...values, pageSize, offset]),
      db.query(optionsSql1),
      db.query(optionsSql2),
      db.query(cumulativeComboChartSql, values)
    ];

    const results = await Promise.all(allPromises);
    const chartResults = results.slice(0, chartFields.length);
    const countRes = results[chartFields.length];
    const tableRes = results[chartFields.length + 1];
    const opt1Res = results[chartFields.length + 2];
    const opt2Res = results[chartFields.length + 3];
    const cumulativeComboChartRes = results[results.length - 1];

    const chartData = {};
    chartFields.forEach((field, index) => {
        chartData[field] = chartResults[index].rows;
    });

    const total = parseInt(countRes.rows[0].count, 10);

    res.json({
      cumulativeComboChart: cumulativeComboChartRes.rows,
      charts: chartData,
      table: { 
        rows: tableRes.rows,
        total: total
      },
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
