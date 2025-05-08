const express = require('express');
const router = express.Router();
const db = require('../db/db');
const {
  handlePaginatedList,
  handleCompanyCount,
  handleCompanyDetail
} = require('../utils/companyListHandlers');

// 表名常量
const NON_LISTED_TABLE = 'non_listed_companies_2025q1';
const LISTED_TABLE = 'non_listed_companies_20250414';

/**
 * 非上市公司接口
 */
router.get('/non-listed-companies', handlePaginatedList(NON_LISTED_TABLE, true));
router.get('/non-listed-companies-count', handleCompanyCount(NON_LISTED_TABLE, true));
router.get('/non-listed-companies-detail', handleCompanyDetail(NON_LISTED_TABLE, true));

/**
 * 上市公司接口
 */
router.get('/listed-companies', handlePaginatedList(LISTED_TABLE, false));
router.get('/listed-companies-count', handleCompanyCount(LISTED_TABLE, false));
router.get('/listed-companies-detail', handleCompanyDetail(LISTED_TABLE, false));

/**
 * ✅ 首页数据整合接口（合并请求）
 */
router.get('/homepage-summary', async (req, res) => {
  try {
    const listedCountRes = await db.query(`SELECT COUNT(*) AS listed_count FROM ${LISTED_TABLE}`);
    const listedDataRes = await db.query(`SELECT * FROM ${LISTED_TABLE} LIMIT 10 OFFSET 0`);

    const nonListedCountRes = await db.query(
      `SELECT COUNT(*) AS non_listed_count FROM ${NON_LISTED_TABLE} WHERE hide_flag NOT LIKE '%是%'`
    );
    const nonListedDataRes = await db.query(
      `SELECT * FROM ${NON_LISTED_TABLE} WHERE hide_flag NOT LIKE '%是%' LIMIT 10 OFFSET 0`
    );

    res.json({
      listedCompanyCount: parseInt(listedCountRes.rows[0].listed_count, 10),
      listedCompanies: listedDataRes.rows,
      nonListedCompanyCount: parseInt(nonListedCountRes.rows[0].non_listed_count, 10),
      nonListedCompanies: nonListedDataRes.rows
    });
  } catch (err) {
    console.error('❌ 首页合并查询失败:', err);
    res.status(500).json({ error: '首页数据加载失败' });
  }
});

module.exports = router;
