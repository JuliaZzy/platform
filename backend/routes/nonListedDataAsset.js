const express = require('express');
const router = express.Router();
const db = require('../db/dbDataAsset');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// 通用筛选条件（附加 hide_flag != "是"）
function buildWhereClause(filters, values) {
  let conditions = ['hide_flag != "是"'];

  if (filters.startDate && filters.endDate) {
    conditions.push('month_time BETWEEN ? AND ?');
    values.push(filters.startDate, filters.endDate);
  }

  if (filters.province) {
    conditions.push('province_area = ?');
    values.push(filters.province);
  }

  if (filters.company) {
    conditions.push('company_name LIKE ?');
    values.push(`%${filters.company}%`);
  }

  if (filters.content) {
    conditions.push('dataasset_content LIKE ?');
    values.push(`%${filters.content}%`);
  }
  
  if (filters.company_type) {
    conditions.push('company_type = ?');
    values.push(filters.company_type);
  }  

  return conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
}

// ✅ 1. 查询分页数据（附加 total）
router.post('/query', (req, res) => {
  const { page = 1, pageSize = 10, filters = {} } = req.body;
  const offset = (page - 1) * pageSize;
  const values = [];

  const whereClause = buildWhereClause(filters, values);

  // 获取总数
  const countSql = `
    SELECT COUNT(*) AS count
    FROM non_listed_companies_2025q1
    ${whereClause}
  `;

  db.query(countSql, values.slice(), (err, countResult) => {
    if (err) {
      console.error('统计总数失败:', err);
      return res.status(500).json({ error: '查询失败' });
    }

    const total = countResult[0].count;

    // 获取分页数据
    const sql = `
      SELECT month_time, province_area, company_name, dataasset_type,
             accounting_subject, valuation_method, dataasset_register_addr,
             book_value, finance_value
      FROM non_listed_companies_2025q1
      ${whereClause}
      LIMIT ? OFFSET ?
    `;
    values.push(pageSize, offset);

    db.query(sql, values, (err, results) => {
      if (err) {
        console.error('查询分页数据失败:', err);
        return res.status(500).json({ error: '查询失败' });
      }
      res.json({ rows: results, total });
    });
  });
});

// ✅ 2. 获取图表聚合数据
router.post('/stats', (req, res) => {

  const { field, filters = {} } = req.body;
  const values = [];
  const whereClause = buildWhereClause(filters, values);

  const sql = `
    SELECT \`${field}\` AS name, COUNT(*) AS value
    FROM non_listed_companies_2025q1
    ${whereClause}
    GROUP BY \`${field}\`
    ORDER BY value DESC
  `;

  db.query(sql, values, (err, results) => {
    if (err) {
      console.error('图表统计失败:', err);
      return res.status(500).json({ error: '统计失败' });
    }
    res.json(results);
  });
});

// ✅ 3. 获取静态筛选选项（用于年月 & 省份）
router.get('/options', (req, res) => {
  const fields = ['month_time', 'province_area'];
  const queries = fields.map(field =>
    new Promise((resolve, reject) => {
      db.query(
        `SELECT DISTINCT \`${field}\` AS value FROM non_listed_companies_2025q1 WHERE hide_flag != "是" ORDER BY \`${field}\``,
        (err, results) => {
          if (err) reject(err);
          else resolve({ field, options: results.map(r => r.value) });
        }
      );
    })
  );

  Promise.all(queries)
    .then(data => {
      const response = {};
      data.forEach(d => {
        response[d.field] = d.options;
      });
      res.json(response);
    })
    .catch(err => {
      console.error('筛选项获取失败:', err);
      res.status(500).json({ error: '获取选项失败' });
    });
});

// ✅ 4. 模糊搜索公司名称（用于远程 el-select）
router.get('/search/company', (req, res) => {
  const query = req.query.q;
  if (!query) return res.json([]);
  db.query(
    `SELECT DISTINCT company_name FROM non_listed_companies_2025q1 
     WHERE hide_flag != "是" AND company_name LIKE ? LIMIT 20`,
    [`%${query}%`],
    (err, results) => {
      if (err) {
        console.error('公司名称搜索失败:', err);
        return res.status(500).json({ error: '搜索失败' });
      }
      res.json(results.map(r => r.company_name));
    }
  );
});

// ✅ 5. 模糊搜索数据资产内容
router.get('/search/content', (req, res) => {
  const query = req.query.q;
  if (!query) return res.json([]);
  db.query(
    `SELECT DISTINCT dataasset_content FROM non_listed_companies_2025q1 
     WHERE hide_flag != "是" AND dataasset_content LIKE ? LIMIT 20`,
    [`%${query}%`],
    (err, results) => {
      if (err) {
        console.error('数据资产内容搜索失败:', err);
        return res.status(500).json({ error: '搜索失败' });
      }
      res.json(results.map(r => r.dataasset_content));
    }
  );
});

// ✅ 6. 导出 Excel 文件
router.post('/export', (req, res) => {
  const filters = req.body.filters || {};  // ✅ 正确提取
  const values = [];

  const whereClause = buildWhereClause(filters, values);
  const sql = `
    SELECT month_time, province_area, company_name, dataasset_type,
           accounting_subject, valuation_method, dataasset_register_addr,
           book_value, finance_value
    FROM non_listed_companies_2025q1
    ${whereClause}
  `;

  db.query(sql, values, (err, results) => {
    if (err) {
      console.error('导出查询失败:', err);
      return res.status(500).json({ error: '导出失败' });
    }

    const worksheet = XLSX.utils.json_to_sheet(results);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '导出数据');

    const tempDir = path.join(__dirname, '../../temp');
    const tempPath = path.join(tempDir, 'export.xlsx');

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    XLSX.writeFile(workbook, tempPath);


    res.download(tempPath, '导出结果.xlsx', () => {
      fs.unlinkSync(tempPath);
    });
  });
});

module.exports = router;
