const express = require('express');
const router = express.Router();
const dbDataAsset = require('../db/dbDataAsset');

// 获取公司列表（分页）
router.get('/listed-companies', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;  // ✅ 每页 30 条
  const offset = (page - 1) * limit;

  const query = 'SELECT * FROM non_listed_companies_20250414 LIMIT ? OFFSET ?';
  dbDataAsset.query(query, [limit, offset], (err, results) => {
    if (err) {
      console.error('查询错误:', err);
      return res.status(500).send('数据库查询失败');
    }

    res.json(results);
  });
});

// 获取公司总数
router.get('/listed-companies-count', (req, res) => {
  const query = 'SELECT COUNT(DISTINCT company_name) AS count FROM non_listed_companies_20250414';

  dbDataAsset.query(query, (err, results) => {
    if (err) {
      console.error('查询错误:', err);
      return res.status(500).send('数据库查询失败');
    }

    res.json({ count: results[0].count });
  });
});

// 获取上市公司数据（全量）
router.get('/listed-companies-detail', (req, res) => {
  const query = 'SELECT * FROM non_listed_companies_20250414';
  dbDataAsset.query(query, (err, results) => {  // ✅ 修复 db → dbDataAsset
    if (err) {
      console.error('查询错误:', err);
      return res.status(500).send('数据库查询失败');
    }
    res.json(results); // ✅ 返回全量数据供前端分页
  });
});

// 获取上市公司总数（可选）
router.get('/listed-companies-detail-count', (req, res) => {
  const query = 'SELECT COUNT(DISTINCT company_name) AS count FROM non_listed_companies_20250414';
  dbDataAsset.query(query, (err, results) => {
    if (err) {
      console.error('查询错误:', err);
      return res.status(500).send('数据库查询失败');
    }
    res.json({ count: results[0].count });
  });
});

module.exports = router;
