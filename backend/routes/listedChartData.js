const express = require('express');
const router = express.Router();
const db = require('../db/db');

// ✅ Combo 图接口：柱状图（数量）+ 折线图（金额），按“报告时间”
router.post('/combo1', async (req, res) => {
  const filters = req.body.filters || {};
  const values = [];
  const conditions = []; // 这个数组用于构建最终的 WHERE 条件

  // 始终将 status 过滤作为第一个条件（不依赖外部参数）
  conditions.push(`"status" IS DISTINCT FROM 'delete'`);

  if (filters.province_area) {
    conditions.push(`"省份" = $${values.length + 1}`); // $1, $2... 会根据 values 数组的长度动态生成
    values.push(filters.province_area);
  }
  if (filters.quarter) {
    conditions.push(`"报告时间" = $${values.length + 1}`);
    values.push(filters.quarter);
  }

  // 因为 conditions 数组至少会包含 status 条件，所以 conditions.length 总是 >= 1
  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  try {
    const countSql = `
      SELECT "报告时间", COUNT(*) AS "数据资源入表数量"
      FROM dataasset_listed_companies_2024
      ${whereClause}
      GROUP BY "报告时间"
      ORDER BY "报告时间"
    `;
    const countRes = await db.query(countSql, values);

    const sumSqlF = `
      SELECT "报告时间", SUM("数据资源入表总额（万元）")/10000 AS "数据资源入表总额（单位：亿元）"
      FROM dataasset_listed_companies_2024
      ${whereClause}
      GROUP BY "报告时间"
      ORDER BY "报告时间"
    `;
    const sumResF = await db.query(sumSqlF, values);

    const sumSql = `
      SELECT "报告时间", SUM("数据资源入表总额（万元）") AS "数据资源入表总额（单位：万元）"
      FROM dataasset_listed_companies_2024
      ${whereClause}
      GROUP BY "报告时间"
      ORDER BY "报告时间"
    `;
    const sumRes = await db.query(sumSql, values);

    res.json({
      barSeries: countRes.rows,
      lineSeriesForChart: sumResF.rows,
      amountSeriesForTable: sumRes.rows
    });
  } catch (err) {
    console.error('❌ /combo1 数据获取失败:', err);
    res.status(500).json({ error: '获取 combo 图数据失败' });
  }
});

// ✅ Grouped Bar 图：入表科目 × 报告时间 × 数量 + 金额
router.post('/subject-bars', async (req, res) => {
  const filters = req.body.filters || {};
  const values = []; // 用于参数化查询的值 (仅限 filters 中的)
  const filterSpecificConditions = []; // 仅存放来自 req.body.filters 的条件

  if (filters.province_area) {
    filterSpecificConditions.push(`"省份" = $${values.length + 1}`);
    values.push(filters.province_area);
  }
  if (filters.quarter) {
    filterSpecificConditions.push(`"报告时间" = $${values.length + 1}`);
    values.push(filters.quarter);
  }

  // 构建基础的 WHERE 子句，总是包含 status 过滤
  const queryBaseConditions = [`"status" IS DISTINCT FROM 'delete'`];
  if (filterSpecificConditions.length > 0) { // ✅ 使用 filterSpecificConditions
    queryBaseConditions.push(`(${filterSpecificConditions.join(' AND ')})`); // ✅ 使用 filterSpecificConditions
  }
  const whereClause = `WHERE ${queryBaseConditions.join(' AND ')}`;
  
  // 构建用于 UNION ALL 子查询内部的 WHERE 前缀
  const prefixForSubQueryWithStatusAndFilters = `${whereClause} AND`;

  try {
    const countSql = `
      SELECT "入表科目", "报告时间", SUM(value) AS value FROM (
        SELECT "入表科目", "报告时间", COUNT(*) AS value
        FROM dataasset_listed_companies_2024
        ${prefixForSubQueryWithStatusAndFilters} ("入表科目" = '无形资产' OR "入表科目" = '存货' OR "入表科目" = '开发支出' )
        GROUP BY "入表科目", "报告时间"
        UNION ALL
        SELECT '无形资产' AS "入表科目", "报告时间", COUNT(*) AS value
        FROM dataasset_listed_companies_2024
        ${prefixForSubQueryWithStatusAndFilters} ("入表科目" = '无形资产&开发支出' OR "入表科目" = '无形资产?' OR "入表科目" = '存货&无形资产')
        GROUP BY "报告时间"
        UNION ALL
        SELECT '开发支出' AS "入表科目", "报告时间", COUNT(*) AS value
        FROM dataasset_listed_companies_2024
        ${prefixForSubQueryWithStatusAndFilters} "入表科目" = '无形资产&开发支出'
        GROUP BY "报告时间"
        UNION ALL
        SELECT '存货' AS "入表科目", "报告时间", COUNT(*) AS value
        FROM dataasset_listed_companies_2024
        ${prefixForSubQueryWithStatusAndFilters} ("入表科目" = '存货&无形资产' OR "入表科目" = '存货?')
        GROUP BY "报告时间"
      ) AS raw
      GROUP BY "入表科目", "报告时间"
      ORDER BY "报告时间", "入表科目" DESC
    `;
    const countRes = await db.query(countSql, values);

    const sumSql = `
      SELECT * FROM (
        SELECT '无形资产' AS "入表科目", "报告时间", SUM("无形资产-数据资源入表金额（万元）")/10000 AS value
        FROM dataasset_listed_companies_2024
        ${whereClause} 
        GROUP BY "报告时间"
        UNION ALL 
        SELECT '开发支出' AS "入表科目", "报告时间", SUM("开发支出-数据资源入表金额（万元）")/10000 AS value
        FROM dataasset_listed_companies_2024
        ${whereClause}
        GROUP BY "报告时间"
        UNION ALL 
        SELECT '存货' AS "入表科目", "报告时间", SUM("存货-数据资源入表金额（万元）")/10000 AS value
        FROM dataasset_listed_companies_2024
        ${whereClause}
        GROUP BY "报告时间"
      ) raw
      ORDER BY "报告时间"
    `;
    const sumRes = await db.query(sumSql, values);

    res.json({
      countSeries: countRes.rows,
      sumSeries: sumRes.rows
    });
  } catch (err) {
    console.error('❌ /subject-bars 数据获取失败:', err);
    res.status(500).json({ error: '获取 grouped 图数据失败' });
  }
});

// ✅ 通用 GroupBy 图接口（证券行业/市值规模/省份/实控人）
router.post('/group-field', async (req, res) => {
  const filters = req.body.filters || {};
  const field = req.body.field;

  if (!['所属证券行业分布', '市值规模', '省份', '实控人'].includes(field)) {
    return res.status(400).json({ error: '不支持的字段' });
  }

  const values = []; 
  const filterSpecificConditions = []; // 仅存放来自 req.body.filters 的条件

  if (filters.province_area) {
    filterSpecificConditions.push(`"省份" = $${values.length + 1}`);
    values.push(filters.province_area);
  }
  if (filters.quarter) {
    filterSpecificConditions.push(`"报告时间" = $${values.length + 1}`);
    values.push(filters.quarter);
  }

  // 构建基础的 WHERE 子句，总是包含 status 过滤
  const queryBaseConditions = [`"status" IS DISTINCT FROM 'delete'`];
  if (filterSpecificConditions.length > 0) { // ✅ 使用 filterSpecificConditions
    queryBaseConditions.push(`(${filterSpecificConditions.join(' AND ')})`); // ✅ 使用 filterSpecificConditions
  }
  const baseWhereClause = `WHERE ${queryBaseConditions.join(' AND ')}`;
  
  let rawRes;
  let rows;

  try {
    if (field === '实控人') {
      const buildCategoryWhere = (baseWhereWithStatusAndFilters, categorySpecificCondition) => {
        return `${baseWhereWithStatusAndFilters} AND (${categorySpecificCondition})`;
      };

      const sqlActualController = `
        SELECT * FROM (
            SELECT '个人' AS name, "报告时间", COUNT(*) AS value
            FROM dataasset_listed_companies_2024
            ${buildCategoryWhere(baseWhereClause, `"实控人" = '个人'`)}
            GROUP BY "报告时间"
            UNION ALL
            SELECT '地方' AS name, "报告时间", COUNT(*) AS value
            FROM dataasset_listed_companies_2024
            ${buildCategoryWhere(baseWhereClause, `"实控人" = '地方国资委' OR "实控人" = '地方政府' OR "实控人" = '地方国有企业'`)}
            GROUP BY "报告时间"
            UNION ALL
            SELECT '中央' AS name, "报告时间", COUNT(*) AS value
            FROM dataasset_listed_companies_2024
            ${buildCategoryWhere(baseWhereClause, `"实控人" = '国资委' OR "实控人" = '中央国家机关' OR "实控人" = '中央国有企业'`)}
            GROUP BY "报告时间"
            UNION ALL
            SELECT '其他' AS name, "报告时间", COUNT(*) AS value
            FROM dataasset_listed_companies_2024
            ${buildCategoryWhere(baseWhereClause, `"实控人" = '大学' OR "实控人" = '个人;境外' OR "实控人" = '境外'`)}
            GROUP BY "报告时间"
        ) AS t
      `;
      rawRes = await db.query(sqlActualController, values); 
      rows = rawRes.rows;

    } else { 
      const baseSql = `
        SELECT "${field}" AS name, "报告时间", COUNT(*) AS value 
        FROM dataasset_listed_companies_2024
        ${baseWhereClause} 
        GROUP BY "${field}", "报告时间"
      `;
      rawRes = await db.query(baseSql, values);
      rows = rawRes.rows;
    }
    
    const copyRows = [...rows]; 
    let sortedRows;

    // --- 排序逻辑 (保持不变) ---
    if (field === '市值规模') {
      const order = [
        '50亿以下', '50 - 100亿', '100 - 500亿', '500 - 1000亿',
        '1000 - 5000亿', '5000 - 1万亿', '1万亿以上'
      ];
      sortedRows = copyRows.sort((a, b) => {
        return order.indexOf(a.name) - order.indexOf(b.name) ||
               a['报告时间'].localeCompare(b['报告时间']);
      });
    } else if (field === '实控人') {
      const actualControllerOrder = ['个人', '中央', '地方', '其他'];
      sortedRows = copyRows.sort((a, b) => {
        const indexA = actualControllerOrder.indexOf(a.name);
        const indexB = actualControllerOrder.indexOf(b.name);
        const effectiveIndexA = indexA === -1 ? Infinity : indexA;
        const effectiveIndexB = indexB === -1 ? Infinity : indexB;
        if (effectiveIndexA !== effectiveIndexB) {
          return effectiveIndexA - effectiveIndexB;
        } else {
          return a['报告时间'].localeCompare(b['报告时间']);
        }
      });
    } else if (['所属证券行业分布', '省份'].includes(field)) {
      const q4Map = {};
      copyRows.forEach(row => {
        if (row['报告时间'] === 'Q4') {
          q4Map[row.name] = (q4Map[row.name] || 0) + parseInt(row.value, 10);
        }
      });
      sortedRows = copyRows.sort((a, b) => {
        const diff = (q4Map[b.name] || 0) - (q4Map[a.name] || 0);
        return diff !== 0 ? diff : a['报告时间'].localeCompare(b['报告时间']);
      });
    } else {
      sortedRows = copyRows.sort((a, b) => {
        return String(a.name).localeCompare(String(b.name)) ||
               String(a['报告时间']).localeCompare(String(b['报告时间']));
      });
    }
    // --- 排序逻辑结束 ---

    res.json(sortedRows);
  } catch (err) {
    console.error('❌ /group-field 获取失败:', err);
    res.status(500).json({ error: '获取 grouped 图数据失败' });
  }
});

module.exports = router;