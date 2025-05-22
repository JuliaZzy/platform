// ✅ buildQueryHandlers.js - 优化版（支持 GIN 索引 + 防止慢查 + 精简逻辑）
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

function buildWhereClause(filters, values, enableHideFlag = false, mode = 'non-listed') { // 添加 mode 参数
  const conditions = [];

  if (enableHideFlag) {
    // 确保 "hide_flag" 是正确的列名，并用双引号包裹以防是保留字或含特殊字符
    conditions.push(`"hide_flag" NOT LIKE '%是%'`); 
  }

  if (mode === 'non-listed') {
    // 非上市公司筛选逻辑 (来自你之前的代码)
    if (filters.startDate && filters.endDate) {
      conditions.push(`"month_time" BETWEEN $${values.length + 1} AND $${values.length + 2}`);
      values.push(filters.startDate, filters.endDate);
    }
    if (filters.province) { // 非上市用 'province' 对应数据库 'province_area'
      conditions.push(`"province_area" = $${values.length + 1}`);
      values.push(filters.province);
    }
    if (filters.company) { // 非上市用 'company' 对应数据库 'company_name'
      conditions.push(`"company_name" ILIKE $${values.length + 1}`);
      values.push(`%${String(filters.company || '').trim().slice(0, 30)}%`);
    }
    if (filters.content) { // 非上市用 'content' 对应数据库 'dataasset_content'
      conditions.push(`"dataasset_content" ILIKE $${values.length + 1}`);
      values.push(`%${String(filters.content || '').trim().slice(0, 30)}%`);
    }
    if (filters.company_type) {
      conditions.push(`"company_type" = $${values.length + 1}`);
      values.push(filters.company_type);
    }
  } else if (mode === 'listed') {
    // 上市公司筛选逻辑
    if (filters.quarter && String(filters.quarter).trim() !== '') {
      conditions.push(`"报告时间" = $${values.length + 1}`);
      values.push(filters.quarter);
    }
    if (filters.province_area && String(filters.province_area).trim() !== '') { // 前端用 'province_area'
      conditions.push(`"省份" = $${values.length + 1}`); // 数据库列名是 "省份"
      values.push(filters.province_area);
    }
    if (filters.company && String(filters.company).trim() !== '') { // 前端用 'company'
      conditions.push(`"公司" ILIKE $${values.length + 1}`); // 数据库列名是 "公司"
      values.push(`%${String(filters.company).trim().slice(0, 30)}%`);
    }
    if (filters.dataasset_content && String(filters.dataasset_content).trim() !== '') { // 前端用 'dataasset_content'
      conditions.push(`"所属证券行业分布" ILIKE $${values.length + 1}`); // 数据库列名是 "所属证券行业分布"
      values.push(`%${String(filters.dataasset_content).trim().slice(0, 30)}%`);
    }
  }

  return conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
}

function handleQuery(db, tableName, enableHideFlag) {
  return (req, res) => {
    const { page = 1, pageSize = 10, filters = {} } = req.body;
    const offset = (page - 1) * pageSize;
    const values = [];
    const whereClause = buildWhereClause(filters, values, enableHideFlag);

    const countSql = `SELECT COUNT(*) FROM ${tableName} ${whereClause}`;
    db.query(countSql, values, (err, countResult) => {
      if (err) return res.status(500).json({ error: '统计失败' });

      const total = parseInt(countResult.rows[0].count, 10);

      const dataSql = `
        SELECT month_time, province_area, company_name, dataasset_content,
                accounting_subject, valuation_method, book_value, assess_value,
                dataasset_register_addr
        FROM ${tableName}
        ${whereClause}
        LIMIT $${values.length + 1} OFFSET $${values.length + 2}
      `;

      db.query(dataSql, [...values, pageSize, offset], (err, results) => {
        if (err) return res.status(500).json({ error: '查询失败' });
        res.json({ rows: results.rows, total });
      });
    });
  };
}

function handleStats(db, tableName, enableHideFlag) {
  return (req, res) => {
    const { field, filters = {} } = req.body;
    if (!field) return res.status(400).json({ error: '字段不合法' });

    const values = [];
    const whereClause = buildWhereClause(filters, values, enableHideFlag);
    const sql = `
      SELECT ${field} AS name, COUNT(*) AS value
      FROM ${tableName}
      ${whereClause}
      GROUP BY ${field}
      ORDER BY value DESC
    `;

    const start = Date.now();
    db.query(sql, values, (err, results) => {
      console.log(`⏱️ handleStats ${field} - ${Date.now() - start}ms`);
      if (err) return res.status(500).json({ error: '统计失败' });
      res.json(results.rows);
    });
  };
}

function handleOptions(db, tableName, fields, enableHideFlag) {
  return async (req, res) => {
    try {
      const results = {};
      for (const field of fields) {
        const whereClause = enableHideFlag ? `WHERE hide_flag NOT LIKE '%是%'` : '';
        const sql = `SELECT DISTINCT ${field} AS value FROM ${tableName} ${whereClause} ORDER BY ${field}`;
        const result = await db.query(sql);
        results[field] = result.rows.map(r => r.value);
      }
      res.json(results);
    } catch (err) {
      res.status(500).json({ error: '获取选项失败' });
    }
  };
}

function handleSearch(db, tableName, field, enableHideFlag) {
  return async (req, res) => {
    const query = req.query.q?.trim();
    if (!query || query.length < 2) return res.json([]);

    const values = [];
    const whereParts = [];

    if (enableHideFlag) {
      whereParts.push(`hide_flag NOT LIKE '%是%'`);
    }

    if (query.length < 3) {
      // ✅ 关键词太短，退回到 ILIKE 匹配（但不推荐频繁使用）
      whereParts.push(`${field} ILIKE $${values.length + 1}`);
      values.push(`%${query}%`);
    } else {
      // ✅ 关键词够长，走 trigram + GIN 索引
      whereParts.push(`${field} % $${values.length + 1}`);
      values.push(query);
    }

    const sql = `
      SELECT DISTINCT ${field}
      FROM ${tableName}
      WHERE ${whereParts.join(' AND ')}
      LIMIT 10
    `;

    try {
      const result = await db.query(sql, values);
      res.json(result.rows.map(r => r[field]));
    } catch (err) {
      console.error('❌ handleSearch 错误:', err);
      res.status(500).json({ error: '搜索失败' });
    }
  };
}

function handleExport(db, tableName, enableHideFlag) {
  return async (req, res) => {
    try {
      const filters = req.body.filters || {};
      const values = [];
      const whereClause = buildWhereClause(filters, values, enableHideFlag);

      const sql = `
        SELECT month_time, province_area, company_name, dataasset_content,
              accounting_subject, valuation_method, book_value, assess_value,
              dataasset_register_addr
        FROM ${tableName} ${whereClause}
      `;
      const result = await db.query(sql, values);
      const rows = result.rows;

      // ✅ 映射为中文列名（一次性处理）
      const columnMap = {
        month_time: '入表月份',
        province_area: '省级行政区',
        company_name: '入表企业',
        dataasset_content: '数据资产内容',
        accounting_subject: '入表会计科目',
        valuation_method: '评估方法',
        book_value: '账面金额（万元）',
        assess_value: '评估金额（万元）',
        dataasset_register_addr: '数据资产登记机构'
      };
      const orderedKeys = Object.keys(columnMap);

      const translatedRows = rows.map(row => {
        const newRow = {};
        for (const key of orderedKeys) {
          newRow[columnMap[key]] = row[key];
        }
        return newRow;
      });

      res.json({ rows: translatedRows });
    } catch (err) {
      console.error('❌ 导出失败:', err);
      res.status(500).json({ error: '导出失败' });
    }
  };
}

module.exports = {
  buildWhereClause,
  handleQuery,
  handleStats,
  handleOptions,
  handleSearch,
  handleExport
};
