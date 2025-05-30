const express = require('express');
const router = express.Router();
const db = require('../db/db');
const {
  handlePaginatedList,
  handleCompanyCount,
  handleCompanyDetail
} = require('../utils/companyListHandlers');

// 表名常量
const LISTED_TABLE = 'dataasset_listed_companies_2024';
const NON_LISTED_TABLE = 'dataasset_non_listed_companies';
const FINANCING_TABLE = 'dataasset_finance_bank';

// 上市公司接口
router.get('/listed-companies', handlePaginatedList(LISTED_TABLE, '2024Q4'));
router.get('/listed-companies-count', handleCompanyCount(LISTED_TABLE, '2024Q4'));

// 非上市公司接口
router.get('/non-listed-companies', handlePaginatedList(NON_LISTED_TABLE, 'hide_flag'));
router.get('/non-listed-companies-count', handleCompanyCount(NON_LISTED_TABLE, 'hide_flag'));

//数据资产融资接口
router.get('/data-asset-financing', handlePaginatedList(FINANCING_TABLE));
router.get('/data-asset-financing-count', handleCompanyCount(FINANCING_TABLE));
router.get('/data-asset-financing-detail', handleCompanyDetail(FINANCING_TABLE));

//首页数据整合接口
router.get('/homepage-summary', async (req, res) => {
  try {
    const [
      listedCountRes,
      listedDataRes,
      latestMonthRes,
      nonListedCountRes,
      nonListedDataRes,
      FinanceCountRes,
      FinanceDataRes
    ] = await Promise.all([
      db.query(`SELECT COUNT(*) AS count FROM ${LISTED_TABLE} WHERE "报告时间"='2024Q4' AND "status" IS DISTINCT FROM 'delete'`),
      db.query(`SELECT "公司" AS company_name, "报告时间" FROM ${LISTED_TABLE} WHERE "报告时间"='2024Q4' AND "status" IS DISTINCT FROM 'delete' ORDER BY "数据资源入表总额（万元）" DESC`),
      db.query(`SELECT MAX(month_time) AS latest_month FROM ${NON_LISTED_TABLE} WHERE hide_flag NOT LIKE '%是%' AND "status" IS DISTINCT FROM 'delete'`),
      db.query(`SELECT COUNT(*) AS count FROM ${NON_LISTED_TABLE} WHERE hide_flag NOT LIKE '%是%' AND "status" IS DISTINCT FROM 'delete'`),
      db.query(`
        SELECT 
          CASE 
            WHEN parent_company_report = '' THEN company_name 
            ELSE parent_company_report || '（' || company_name || '）'
          END AS company_name
        FROM ${NON_LISTED_TABLE} 
        WHERE hide_flag NOT LIKE '%是%' AND "status" IS DISTINCT FROM 'delete'
        ORDER BY finance_value DESC NULLS LAST
      `),
      db.query(`
        SELECT SUM(count) AS sum
          FROM (
          SELECT COUNT(*) AS count FROM ${FINANCING_TABLE}
          UNION ALL
          SELECT COUNT(*) AS count FROM dataasset_finance_stock WHERE "status" IS DISTINCT FROM 'delete'
          UNION ALL
          SELECT COUNT(*) AS count FROM dataasset_finance_other WHERE "status" IS DISTINCT FROM 'delete'
        ) t
      `),
      db.query(`
        SELECT show_name AS name 
        FROM ${FINANCING_TABLE} -- dataasset_finance_bank
        WHERE "status" IS DISTINCT FROM 'delete'
        ORDER BY 
          CASE WHEN finance_value::text = '未披露' THEN 2 WHEN finance_value IS NULL THEN 1 ELSE 0 END,
          CAST(NULLIF(finance_value::text, '未披露') AS NUMERIC) DESC NULLS LAST, 
          show_name ASC
      `),
    ]);

    const listedCount = listedCountRes.rows?.[0] ? parseInt(listedCountRes.rows[0].count, 10) : 0;
    const nonListedCount = nonListedCountRes.rows?.[0] ? parseInt(nonListedCountRes.rows[0].count, 10) : 0;
    const financingCount = FinanceCountRes.rows?.[0] ? parseInt(FinanceCountRes.rows[0].sum, 10) : 0;
    const financingCompanies = FinanceDataRes.rows || [];
    const latestNonListedMonthValue = latestMonthRes.rows?.[0] ? latestMonthRes.rows[0].latest_month : null;

    res.json({
      listedCompanyCount: listedCount,
      listedCompanies: listedDataRes.rows || [],
      latestNonListedMonth: latestNonListedMonthValue,
      nonListedCompanyCount: nonListedCount,
      nonListedCompanies: nonListedDataRes.rows || [],
      financeCompanyCount: financingCount,
      financingCompanies: financingCompanies
    });

  } catch (err) {
    console.error('❌ 首页合并查询失败:', err);
    res.status(500).json({ error: '首页数据加载失败' });
  }
});

module.exports = router;