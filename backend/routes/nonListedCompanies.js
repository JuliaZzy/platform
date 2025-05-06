const express = require('express');
const router = express.Router();
const dbDataAsset = require('../db/dbDataAsset');

// ✅ 原分页接口保留（非上市公司）
router.get('/non-listed-companies', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;

  const dataQuery = 'SELECT * FROM non_listed_companies_2025q1 LIMIT ? OFFSET ?';
  const countQuery = 'SELECT COUNT(*) AS total FROM non_listed_companies_2025q1';

  // 查询数据和总数
  dbDataAsset.query(dataQuery, [limit, offset], (err, dataResults) => {
    if (err) return res.status(500).send('数据库查询失败');

    dbDataAsset.query(countQuery, (err, countResults) => {
      if (err) return res.status(500).send('数据库统计失败');

      res.json({
        data: dataResults,
        total: countResults[0].total,
        page,
        pageSize: limit
      });
    });
  });
});

// ✅ 总数量接口
router.get('/non-listed-companies-count', (req, res) => {
  const query = 'SELECT COUNT(DISTINCT company_name) AS count FROM non_listed_companies_2025q1';
  dbDataAsset.query(query, (err, results) => {
    if (err) {
      console.error('查询错误:', err);
      return res.status(500).send('数据库查询失败');
    }
    res.json({ count: results[0].count });
  });
});

// ✅ 用于前端分页的“全量数据接口”
router.get('/non-listed-companies-detail', (req, res) => {
  const query = 'SELECT * FROM non_listed_companies_2025q1';
  dbDataAsset.query(query, (err, results) => {
    if (err) {
      console.error('查询错误:', err);
      return res.status(500).send('数据库查询失败');
    }
    res.json(results); // ✅ 返回所有数据给前端分页
  });
});

// ✅ 可选总数接口（全量分页用不到也没关系）
router.get('/non-listed-companies-detail-count', (req, res) => {
  const query = 'SELECT COUNT(DISTINCT company_name) AS count FROM non_listed_companies_2025q1';
  dbDataAsset.query(query, (err, results) => {
    if (err) {
      console.error('查询错误:', err);
      return res.status(500).send('数据库查询失败');
    }
    res.json({ count: results[0].count });
  });
});

module.exports = router;
