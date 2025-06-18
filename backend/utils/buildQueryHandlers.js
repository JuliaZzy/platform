const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

function buildWhereClause(filters, values, enableHideFlag = false, mode = 'non-listed') {
  const conditions = [`"status" IS DISTINCT FROM 'delete'`]; 

  if (enableHideFlag) {
    conditions.push(`"hide_flag" NOT LIKE '%是%'`); 
  }

  if (mode === 'non-listed') {
    if (filters && filters.hasOwnProperty('startDate') && filters.hasOwnProperty('endDate')) {
      
      const startYYYYMM = filters.startDate;
      const endYYYYMM = filters.endDate;
      if (startYYYYMM && typeof startYYYYMM === 'string' && startYYYYMM.match(/^\d{4}-\d{2}$/) && 
          endYYYYMM && typeof endYYYYMM === 'string' && endYYYYMM.match(/^\d{4}-\d{2}$/)) {
          
          console.log("后端 buildWhereClause: 日期格式有效。正在添加 BETWEEN 条件。");
          conditions.push(`"month_time" BETWEEN $${values.length + 1} AND $${values.length + 2}`);
          values.push(startYYYYMM, endYYYYMM); 
      } else {
          console.warn(`后端 buildWhereClause: 日期值为空或格式非YYYY-MM，将忽略日期筛选。收到的 startDate: '${startYYYYMM}', endDate: '${endYYYYMM}'`);
      }
    } else {
      console.log("后端 buildWhereClause: filters 对象中缺少 startDate 或 endDate 属性，或其中之一为空，忽略日期筛选。收到的 filters 对象: " + JSON.stringify(filters));
    }

    if (filters.province) {
      conditions.push(`"province_area" = $${values.length + 1}`);
      values.push(filters.province);
    }
    if (filters.company) {
      conditions.push(`"company_name" ILIKE $${values.length + 1}`);
      values.push(`%${String(filters.company || '').trim().slice(0, 30)}%`);
    }
    if (filters.content) {
      conditions.push(`"dataasset_content" ILIKE $${values.length + 1}`);
      values.push(`%${String(filters.content || '').trim().slice(0, 30)}%`);
    }
    if (filters.company_type) {
      conditions.push(`"company_type" = $${values.length + 1}`);
      values.push(filters.company_type);
    }


  } else if (mode === 'listed') {
    if (filters.quarter && String(filters.quarter).trim() !== '') {
      conditions.push(`"报告时间" = $${values.length + 1}`);
      values.push(filters.quarter);
    }
    if (filters.province_area && String(filters.province_area).trim() !== '') {
      conditions.push(`"省份" = $${values.length + 1}`);
      values.push(filters.province_area);
    }
    if (filters.company && String(filters.company).trim() !== '') {
      conditions.push(`"公司" ILIKE $${values.length + 1}`);
      values.push(`%${String(filters.company).trim().slice(0, 30)}%`);
    }
    if (filters.dataasset_content && String(filters.dataasset_content).trim() !== '') {
      conditions.push(`"所属证券行业分布" ILIKE $${values.length + 1}`);
      values.push(`%${String(filters.dataasset_content).trim().slice(0, 30)}%`);
    }
  }

  if (conditions.length > 0) {
    return 'WHERE ' + conditions.join(' AND ');
  }
  return '';
}

function handleQuery(db, tableName, enableHideFlag) {
  return (req, res) => {
    const { page = 1, pageSize = 10, filters = {} } = req.body;
    const offset = (page - 1) * pageSize;
    const values = [];
    const whereClause = buildWhereClause(filters, values, enableHideFlag); 

    const countSql = `SELECT COUNT(*) AS total FROM "${tableName}" ${whereClause}`;
    db.query(countSql, values, (err, countResult) => {
      if (err) return res.status(500).json({ error: '统计失败', detail: err.message });
      if (!countResult || !countResult.rows || countResult.rows.length === 0) {
        return res.status(500).json({ error: '统计失败：无法获取总数' });
      }
      const total = parseInt(countResult.rows[0].total, 10);
      const dataSql = `
        SELECT * FROM "${tableName}" 
        ${whereClause}
        ORDER BY "id" ASC
        LIMIT $${values.length + 1} OFFSET $${values.length + 2}
      `;

      db.query(dataSql, [...values, pageSize, offset], (err, results) => {
        if (err) return res.status(500).json({ error: '查询失败', detail: err.message });
        res.json({ rows: results.rows, total });
      });
    });
  };
}

function handleStats(db, tableName, enableHideFlag) {
  return (req, res) => {
    const { field, filters = {} } = req.body;
    if (!field || !/^[a-zA-Z0-9_"]+$/.test(field.replace(/\"/g, ''))) {
        return res.status(400).json({ error: '提供的字段名不合法' });
    }

    const values = [];
    const whereClause = buildWhereClause(filters, values, enableHideFlag); 
    const safeField = field.startsWith('"') && field.endsWith('"') ? field : `"${field}"`;
    const sql = `
      SELECT ${safeField} AS name, COUNT(*) AS value
      FROM "${tableName}" 
      ${whereClause}
      GROUP BY ${safeField}
      ORDER BY value DESC
    `;

    const start = Date.now();
    db.query(sql, values, (err, results) => {
      console.log(`⏱️ handleStats ${field} - ${Date.now() - start}ms`);
      if (err) return res.status(500).json({ error: '统计失败', detail: err.message });
      res.json(results.rows);
    });
  };
}

function handleOptions(db, tableName, fields, enableHideFlag) {
  return async (req, res) => {
    try {
      const results = {};
      for (const field of fields) {
        if (!field || !/^[a-zA-Z0-9_"]+$/.test(field.replace(/\"/g, ''))) {
            results[field] = [];
            console.warn(`handleOptions: 非法字段名 '${field}' 被跳过 for table ${tableName}`);
            continue;
        }
        const safeField = field.startsWith('"') && field.endsWith('"') ? field : `"${field}"`;
        
        const conditions = [`"status" IS DISTINCT FROM 'delete'`];
        if (enableHideFlag) {
          conditions.push(`"hide_flag" NOT LIKE '%是%'`);
        }
        const whereClause = `WHERE ${conditions.join(' AND ')}`;
        
        const sql = `SELECT DISTINCT ${safeField} AS value FROM "${tableName}" ${whereClause} ORDER BY ${safeField}`;
        const result = await db.query(sql);
        results[field] = result.rows.map(r => r.value);
      }
      res.json(results);
    } catch (err) {
      console.error(`❌ handleOptions 获取选项失败 (表: ${tableName}):`, err);
      res.status(500).json({ error: '获取选项失败', detail: err.message });
    }
  };
}

function handleSearch(db, tableName, field, enableHideFlag) {
  return async (req, res) => {
    const query = req.query.q?.trim();
    if (!query || query.length < 2) return res.json([]);

    if (!field || !/^[a-zA-Z0-9_"\u4e00-\u9fa5]+$/.test(field.replace(/\"/g, ''))) {
        return res.status(400).json({ error: '搜索字段名不合法' });
    }
    const safeField = field.startsWith('"') && field.endsWith('"') ? field : `"${field}"`;

    const values = [];
    const whereParts = [`"${tableName}"."status" IS DISTINCT FROM 'delete'`];

    if (enableHideFlag) {
      whereParts.push(`"${tableName}"."hide_flag" NOT LIKE '%是%'`);
    }

    if (query.length < 3) {
      whereParts.push(`${safeField} ILIKE $${values.length + 1}`);
      values.push(`%${query}%`);
    } else {
      whereParts.push(`${safeField} % $${values.length + 1}`);
      values.push(query);
    }

    const sql = `
      SELECT DISTINCT ${safeField}
      FROM "${tableName}" 
      WHERE ${whereParts.join(' AND ')}
      ORDER BY ${safeField} ASC
      LIMIT 10
    `;

    try {
      const result = await db.query(sql, values);
      res.json(result.rows.map(r => r[field]));
    } catch (err) {
      console.error('❌ handleSearch 错误:', err);
      res.status(500).json({ error: '搜索失败', detail: err.message });
    }
  };
}

function handleExport(db, tableName, enableHideFlag) { 
  return async (req, res) => {
    try {
      const filters = req.body.filters || {};
      const values = [];
      const whereClause = buildWhereClause(filters, values, enableHideFlag); 
      const columnsToExport = [
        "month_time", "province_area", "company_name", "dataasset_content",
        "accounting_subject", "valuation_method", "book_value", "assess_value",
        "dataasset_register_addr"
      ];
      const selectClause = columnsToExport.map(c => `"${c}"`).join(', ');

      const sql = `
        SELECT ${selectClause} 
        FROM "${tableName}" ${whereClause}
        ORDER BY "id" ASC -- ✅ 建议添加稳定排序 (假设有id列)
      `; 
      const result = await db.query(sql, values);
      const rows = result.rows;

      // 中文列名
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
          if (row.hasOwnProperty(key)) {
            newRow[columnMap[key]] = row[key];
          }
        }
        return newRow;
      });

      res.json({ rows: translatedRows });
    } catch (err) {
      console.error(`❌ 导出数据准备失败 (表: ${tableName}):`, err);
      res.status(500).json({ error: '导出数据准备失败', detail: err.message });
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
