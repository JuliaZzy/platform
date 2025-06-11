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
const enableHideFlag = true; // 此表启用 hide_flag 筛选

// ✅ 搜索路由 - status 过滤逻辑应在 handleSearch 内部 (buildQueryHandlers.js)
router.get('/search/company', handleSearch(db, tableName, 'company_name', enableHideFlag));
router.get('/search/content', handleSearch(db, tableName, 'dataasset_content', enableHideFlag));

// ✅ 导出 PDF 文件
router.post('/export', async (req, res) => {
  try {
    const filters = req.body.filters || {}; // 获取前端传递的筛选条件
    const values = [];
    
    // 1. 从 buildWhereClause 获取基础的筛选条件
    let whereClauseFromBuilder = buildWhereClause(filters, values, enableHideFlag, 'non-listed');

    // 2. 准备最终的 WHERE 子句，确保包含 status 过滤
    const finalConditions = [`"${tableName}"."status" IS DISTINCT FROM 'delete'`];
    if (whereClauseFromBuilder) {
      // 如果 buildWhereClause 返回的是完整的 "WHERE ..." 子句
      if (whereClauseFromBuilder.toUpperCase().startsWith('WHERE ')) {
        finalConditions.push(`(${whereClauseFromBuilder.substring(6)})`); // 去掉 "WHERE " 并用括号包裹
      } else { // 如果返回的只是 "condition1 AND condition2"
        finalConditions.push(`(${whereClauseFromBuilder})`);
      }
    }
    const whereClause = `WHERE ${finalConditions.join(' AND ')}`;
    
    const sql = `
      SELECT id, month_time, province_area, company_name, dataasset_content, dataasset_register_addr 
      FROM "${tableName}" ${whereClause}
      ORDER BY "id" ASC 
    `; // ✅ 增加了 id 列以备用, 并添加了排序
    const result = await db.query(sql, values);
    const rows = result.rows;

    if (!rows.length) {
      return res.status(404).send('没有符合当前筛选条件的数据可导出（或所有相关数据已标记删除）。');
    }

    // 2. 中文列名映射和顺序 (不包含id和status)
    const columnMap = {
      month_time: '入表月份',
      province_area: '省级行政区',
      company_name: '入表企业',
      dataasset_content: '数据资产内容',
      dataasset_register_addr: '数据资产登记机构'
    };
    const orderedDbKeys = Object.keys(columnMap); 

    const pdfTableHeaders = orderedDbKeys.map(dbKey => ({ text: columnMap[dbKey], style: 'tableHeader' }));
    // ✨ 2. 修改此处的 PDF 表格主体生成逻辑
        const pdfTableBody = [
            pdfTableHeaders,
            ...rows.map(row => orderedDbKeys.map((dbKey, index) => { // ✨ 获取列的索引 index
                const originalValue = row[dbKey];
                let cellText = originalValue !== null && originalValue !== undefined ? String(originalValue) : '';

                // --- 应用格式化规则 ---

                // 要求 2: 对 'month_time' 列进行日期格式化
                if (dbKey === 'month_time') {
                    cellText = pdfFormatters.formatYearMonth(originalValue);
                }

                // 创建基础的单元格属性对象
                const cellProperties = { text: cellText, margin: [0, 2, 0, 2] };

                // 要求 1: 对前两列内容居中
                if (index < 2) {
                    cellProperties.alignment = 'center';
                }
                
                return cellProperties;
            }))
        ];
        
        const tableWidths = [80, 80, 'auto', 'auto', 'auto']; // 调整了第二列宽度以适应居中

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

// ✅ Summary 接口 (通常用于前端Dashboard页面的图表和表格数据加载)
router.post('/summary', async (req, res) => {
  const filters = req.body.filters || {};
  const page = parseInt(req.query.page || req.body.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize || req.body.pageSize, 10) || 10;
  const offset = (page - 1) * pageSize;
  const values = []; // 用于参数化查询的值

  // 注意：这里的 'non-listed' 是针对 buildWhereClause 的，请确保它适用于新表
  // 如果新表的字段名或逻辑不同，你可能需要一个独立的 whereClause
  const whereClauseForQueries = buildWhereClause(filters, values, enableHideFlag, 'non-listed'); 
  
  // ▼▼▼ 新增代码开始 ▼▼▼
  // 1. 定义新 Combo 图表的累积数据查询 SQL
  //    请注意表名 "dataasset_non_listed_companies" 是硬编码的，因为它不同于主表 tableName
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
  // ▲▲▲ 新增代码结束 ▲▲▲

  try {
    // 📊 图表字段 (这些查询也需要应用 status 过滤)
    const chartFields = [
      'province_area', 'company_business_type', 'company_type',
      'admin_level', 'dataasset_type', 'dataasset_register_addrtype'
    ];
    // 将原有的 chartFields 查询转换为 promise 数组
    const chartPromises = chartFields.map(field => {
      if (!/^[a-zA-Z0-9_]+$/.test(field)) return Promise.resolve({ rows: [] }); // 安全检查
      const chartSql = `
        SELECT "${field}" AS name, COUNT(*) AS value
        FROM "${tableName}"
        ${whereClauseForQueries}
        GROUP BY "${field}"
        ORDER BY value DESC
      `;
      return db.query(chartSql, values);
    });

    // 📋 表格分页 (查询也需要应用 status 过滤)
    const countSql = `SELECT COUNT(*) FROM "${tableName}" ${whereClauseForQueries}`;
    const dataSql = `
      SELECT * FROM "${tableName}"
      ${whereClauseForQueries}
      ORDER BY "id" ASC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;

    // 🎯 静态筛选项
    const distinctBaseConditions = [`"status" IS DISTINCT FROM 'delete'`];
    if (enableHideFlag) {
        distinctBaseConditions.push(`"hide_flag" NOT LIKE '%是%'`);
    }
    const distinctWhereClause = `WHERE ${distinctBaseConditions.join(' AND ')}`;
    const optionsSql1 = `SELECT DISTINCT month_time FROM "${tableName}" ${distinctWhereClause} ORDER BY month_time`;
    const optionsSql2 = `SELECT DISTINCT province_area FROM "${tableName}" ${distinctWhereClause} ORDER BY province_area`;

    // ▼▼▼ 修改代码开始 ▼▼▼
    // 2. 将所有数据库查询Promise放入一个数组中，实现完全并行
    const allPromises = [
      ...chartPromises,
      db.query(countSql, values),
      db.query(dataSql, [...values, pageSize, offset]),
      db.query(optionsSql1),
      db.query(optionsSql2),
      db.query(cumulativeComboChartSql, values) // <-- 将新图表的查询加入并行队列
    ];

    const results = await Promise.all(allPromises);
    // ▲▲▲ 修改代码结束 ▲▲▲

    // 解构所有结果
    const chartResults = results.slice(0, chartFields.length);
    const countRes = results[chartFields.length];
    const tableRes = results[chartFields.length + 1];
    const opt1Res = results[chartFields.length + 2];
    const opt2Res = results[chartFields.length + 3];
    // ▼▼▼ 新增代码开始 ▼▼▼
    const cumulativeComboChartRes = results[results.length - 1]; // 新图表的结果是最后一个
    // ▲▲▲ 新增代码结束 ▲▲▲

    const chartData = {};
    chartFields.forEach((field, index) => {
        chartData[field] = chartResults[index].rows;
    });

    const total = parseInt(countRes.rows[0].count, 10);

    res.json({
      // ▼▼▼ 新增代码开始 ▼▼▼
      // 3. 将新图表的数据添加到返回的 JSON 对象中
      cumulativeComboChart: cumulativeComboChartRes.rows,
      // ▲▲▲ 新增代码结束 ▲▲▲
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
