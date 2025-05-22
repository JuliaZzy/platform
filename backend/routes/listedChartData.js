const express = require('express');
const router = express.Router();
const db = require('../db/db');

// ✅ Combo 图接口：柱状图（数量）+ 折线图（金额），按“报告时间”
router.post('/combo1', async (req, res) => {
  const filters = req.body.filters || {};
  const values = [];
  const conditions = [];

  if (filters.province_area) {
    conditions.push(`省份 = $${values.length + 1}`);
    values.push(filters.province_area);
  }
  if (filters.quarter) {
    conditions.push(`"报告时间" = $${values.length + 1}`);
    values.push(filters.quarter);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

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
      lineSeriesForChart: sumResF.rows,  // 金额，亿元单位 (给折线图)
      amountSeriesForTable: sumRes.rows  // 金额，万元单位 (给表格)
    });
  } catch (err) {
    console.error('❌ /combo1 数据获取失败:', err);
    res.status(500).json({ error: '获取 combo 图数据失败' });
  }
});

// ✅ Grouped Bar 图：入表科目 × 报告时间 × 数量 + 金额
router.post('/subject-bars', async (req, res) => {
  const filters = req.body.filters || {};
  const values = [];
  const conditions = [];

  if (filters.province_area) {
    conditions.push(`省份 = $${values.length + 1}`);
    values.push(filters.province_area);
  }
  if (filters.quarter) {
    conditions.push(`"报告时间" = $${values.length + 1}`);
    values.push(filters.quarter);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const prefix = whereClause ? `${whereClause} AND` : 'WHERE';

  try {
    const countSql = `
      SELECT "入表科目", "报告时间", SUM(value) AS value FROM (
        SELECT "入表科目", "报告时间", COUNT(*) AS value
        FROM dataasset_listed_companies_2024
        ${prefix} ("入表科目" = '无形资产' OR "入表科目" = '存货' OR "入表科目" = '开发支出' )
        GROUP BY "入表科目", "报告时间"
        UNION ALL
        SELECT '无形资产' AS "入表科目", "报告时间", COUNT(*) AS value
        FROM dataasset_listed_companies_2024
        ${prefix} ("入表科目" = '无形资产&开发支出' OR "入表科目" = '无形资产?' OR "入表科目" = '存货&无形资产')
        GROUP BY "报告时间"
        UNION ALL
        SELECT '开发支出' AS "入表科目", "报告时间", COUNT(*) AS value
        FROM dataasset_listed_companies_2024
        ${prefix} "入表科目" = '无形资产&开发支出'
        GROUP BY "报告时间"
        UNION ALL
        SELECT '存货' AS "入表科目", "报告时间", COUNT(*) AS value
        FROM dataasset_listed_companies_2024
        ${prefix} ("入表科目" = '存货&无形资产' OR "入表科目" = '存货?')
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

// ✅ 三表格接口：无形资产、开发支出、存货
router.post('/subject-tables', async (req, res) => {
  const filters = req.body.filters || {};
  const values = [];
  const conditions = [];

  if (filters.province_area) {
    conditions.push(`省份 = $${values.length + 1}`);
    values.push(filters.province_area);
  }
  if (filters.quarter) {
    conditions.push(`"报告时间" = $${values.length + 1}`);
    values.push(filters.quarter);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const subjects = [
      {
        name: '无形资产',
        where: `("入表科目" = '无形资产' OR "入表科目" = '无形资产&开发支出' OR "入表科目" = '存货&无形资产' OR "入表科目" = '无形资产?')`,
        moneyField: '"无形资产-数据资源入表金额（万元）"'
      },
      {
        name: '开发支出',
        where: `("入表科目" = '开发支出' OR "入表科目" = '无形资产&开发支出')`,
        moneyField: '"开发支出-数据资源入表金额（万元）"'
      },
      {
        name: '存货',
        where: `("入表科目" = '存货' OR "入表科目" = '存货&无形资产' OR "入表科目" = '存货?')`,
        moneyField: '"存货-数据资源入表金额（万元）"'
      }
    ];

    const result = {};

    for (const subject of subjects) {
      const subjectWhere = whereClause
        ? `${whereClause} AND ${subject.where}`
        : `WHERE ${subject.where}`;

      const countSql = `
        SELECT "报告时间", COUNT(*) AS "${subject.name}-数据资源入表数量"
        FROM dataasset_listed_companies_2024
        ${subjectWhere}
        GROUP BY "报告时间"
        ORDER BY "报告时间"
      `;

      const sumSql = `
        SELECT "报告时间", SUM(${subject.moneyField}) AS "${subject.name}-数据资源入表总额（万元）"
        FROM dataasset_listed_companies_2024
        ${subjectWhere}
        GROUP BY "报告时间"
        ORDER BY "报告时间"
      `;

      const [countRes, sumRes] = await Promise.all([
        db.query(countSql, values),
        db.query(sumSql, values)
      ]);

      result[subject.name] = {
        count: countRes.rows || [],
        total: sumRes.rows || []
      };
    }

    res.json(result);
  } catch (err) {
    console.error('❌ /subject-tables 获取失败:', err);
    res.status(500).json({ error: '获取 subject 表格数据失败' });
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
  const conditions = [];

  if (filters.province_area) {
    conditions.push(`省份 = $${values.length + 1}`);
    values.push(filters.province_area);
  }
  if (filters.quarter) {
    conditions.push(`"报告时间" = $${values.length + 1}`);
    values.push(filters.quarter);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const baseSql = `
      SELECT ${field} AS name, "报告时间", COUNT(*) AS value
      FROM dataasset_listed_companies_2024
      ${whereClause}
      GROUP BY ${field}, "报告时间"
    `;

    const rawRes = await db.query(baseSql, values);
    const rows = rawRes.rows;
    const copyRows = [...rows]; // ✅ 避免原地排序破坏引用结构

    let sortedRows;

    if (field === '市值规模') {
      const order = [
        '50亿以下',
        '50 - 100亿',
        '100 - 500亿',
        '500 - 1000亿',
        '1000 - 5000亿',
        '5000 - 1万亿',
        '1万亿以上'
      ];
      sortedRows = copyRows.sort((a, b) => {
        return order.indexOf(a.name) - order.indexOf(b.name) ||
               a['报告时间'].localeCompare(b['报告时间']);
      });
    } else if (['所属证券行业分布', '省份', '实控人'].includes(field)) {
      const q4Map = {};
      copyRows.forEach(row => {
        if (row['报告时间'] === 'Q4') {
          q4Map[row.name] = (q4Map[row.name] || 0) + parseInt(row.value);
        }
      });
      sortedRows = copyRows.sort((a, b) => {
        const diff = (q4Map[b.name] || 0) - (q4Map[a.name] || 0);
        return diff !== 0 ? diff : a['报告时间'].localeCompare(b['报告时间']);
      });
    } else {
      sortedRows = copyRows.sort((a, b) => {
        return a.name.localeCompare(b.name) ||
               a['报告时间'].localeCompare(b['报告时间']);
      });
    }

    res.json(sortedRows);
  } catch (err) {
    console.error('❌ /group-field 获取失败:', err);
    res.status(500).json({ error: '获取 grouped 图数据失败' });
  }
});

// ✅ 实控人归类表格汇总接口（两个表格）
router.post('/control-summary', async (req, res) => {
  const filters = req.body.filters || {};
  const values = [];
  const conditions = [];

  if (filters.province_area) {
    conditions.push(`省份 = $${values.length + 1}`);
    values.push(filters.province_area);
  }
  if (filters.quarter) {
    conditions.push(`"报告时间" = $${values.length + 1}`);
    values.push(filters.quarter);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  // 分类映射与解释
  const mapping = {
    '个人': ['个人'],
    '地方': ['地方国资委', '地方政府', '地方国有企业'],
    '中央': ['国资委', '中央国家机关', '中央国有企业'],
    '其他': ['大学', '个人;境外', '境外']
  };

  const definitionMap = {
    '个人': '个人',
    '地方': '地方（含地方国资委、地方政府、地方国有企业）',
    '中央': '中央（含国资委、中央国家机关、中央国有企业）',
    '其他': '其他（含大学、个人境外、境外）'
  };

  try {
    // 原始查询
    const rawSql = `
      SELECT "实控人", "报告时间", COUNT(*) AS value
      FROM dataasset_listed_companies_2024
      ${whereClause}
      GROUP BY "报告时间", "实控人"
      ORDER BY "报告时间"
    `;
    const rawRes = await db.query(rawSql, values);

    // 初始化映射表（用于两张表共用）
    const initCategoryData = () => ({
      '个人': {},
      '地方': {},
      '中央': {},
      '其他': {}
    });

    // 构造两个聚合结构
    const originalAgg = initCategoryData();
    const classifiedAgg = initCategoryData();

    for (const row of rawRes.rows) {
      const original = row['实控人'];
      const quarter = row['报告时间'];
      const count = parseInt(row.value, 10);

      for (const [category, groupList] of Object.entries(mapping)) {
        if (groupList.includes(original)) {
          // ✅ 原始表 & 分类表都加上
          originalAgg[category][quarter] = (originalAgg[category][quarter] || 0) + count;
          classifiedAgg[category][quarter] = (classifiedAgg[category][quarter] || 0) + count;
          break;
        }
      }
    }

    // 构造通用返回格式
    const formatCategoryRows = (aggMap) => {
      return Object.entries(aggMap).map(([category, data]) => ({
        name: category,
        definition: definitionMap[category],
        ...data
      }));
    };

    const original = formatCategoryRows(originalAgg);
    const classified = formatCategoryRows(classifiedAgg);

    res.json({
      original,
      classified
    });
  } catch (err) {
    console.error('❌ /control-summary 获取失败:', err);
    res.status(500).json({ error: '获取实控人归类数据失败' });
  }
});


module.exports = router;