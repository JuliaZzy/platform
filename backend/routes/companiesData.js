const express = require('express');
const router = express.Router();
const db = require('../db/db');
const {
  handlePaginatedList,
  handleCompanyCount,
  handleCompanyDetail
} = require('../utils/companyListHandlers');

// 表名常量
const NON_LISTED_TABLE = 'dataasset_non_listed_companies';
const LISTED_TABLE = 'dataasset_listed_companies_2024';
const FINANCING_TABLE = 'dataasset_finance_bank';

/**
 * 非上市公司接口
 */
router.get('/non-listed-companies', handlePaginatedList(NON_LISTED_TABLE, 'hide_flag'));
router.get('/non-listed-companies-count', handleCompanyCount(NON_LISTED_TABLE, 'hide_flag'));
router.get('/non-listed-companies-detail', handleCompanyDetail(NON_LISTED_TABLE));

/**
 * 上市公司接口
 */
router.get('/listed-companies', handlePaginatedList(LISTED_TABLE, 'Q4'));
router.get('/listed-companies-count', handleCompanyCount(LISTED_TABLE, 'Q4'));
router.get('/listed-companies-detail', handleCompanyDetail(LISTED_TABLE));

/**
 * 数据资产融资接口
 */
router.get('/data-asset-financing', handlePaginatedList(FINANCING_TABLE));
router.get('/data-asset-financing-count', handleCompanyCount(FINANCING_TABLE));
router.get('/data-asset-financing-detail', handleCompanyDetail(FINANCING_TABLE));

/**
 * ✅ 首页数据整合接口（合并请求）
 */
router.get('/homepage-summary', async (req, res) => {
  try {
    // 使用 Promise.all 并行执行所有数据库查询
    const [
      listedCountRes,
      listedDataRes,

      latestMonthRes,
      nonListedCountRes,
      nonListedDataRes,

      FinanceCountRes,
      FinanceDataRes
    ] = await Promise.all([
      db.query(`SELECT COUNT(*) AS count FROM ${LISTED_TABLE} WHERE "报告时间"='Q4' AND "status" IS DISTINCT FROM 'delete'`),
      db.query(`SELECT "公司" AS company_name, "报告时间" FROM ${LISTED_TABLE} WHERE "报告时间"='Q4' AND "status" IS DISTINCT FROM 'delete' ORDER BY "数据资源入表总额（万元）" DESC`),

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
        ORDER BY finance_value DESC
      `),
      
      db.query(`
        SELECT SUM(count) AS sum
          FROM (
          SELECT COUNT(*) AS count
          FROM ${FINANCING_TABLE}
          WHERE "status" IS DISTINCT FROM 'delete'

          UNION ALL

          SELECT COUNT(*) AS count
          FROM dataasset_finance_stock
          WHERE "status" IS DISTINCT FROM 'delete'

          UNION ALL

          SELECT COUNT(*) AS count
          FROM dataasset_finance_other
          WHERE "status" IS DISTINCT FROM 'delete'
        ) t
      `),
      db.query(`
        SELECT show_name AS name 
        FROM ${FINANCING_TABLE}
        WHERE "status" IS DISTINCT FROM 'delete'
        ORDER BY CAST(finance_value AS NUMERIC) IS NULL, CAST(finance_value AS NUMERIC) DESC
      `),

      
    ]);

    const listedCount = listedCountRes.rows && listedCountRes.rows[0] ? parseInt(listedCountRes.rows[0].count, 10) : 0;
    const nonListedCount = nonListedCountRes.rows && nonListedCountRes.rows[0] ? parseInt(nonListedCountRes.rows[0].count, 10) : 0;
        
    const financingCount = FinanceCountRes.rows && FinanceCountRes.rows[0] 
                     ? parseInt(FinanceCountRes.rows[0].sum, 10) 
                     : 0;
    const financingCompanies = FinanceDataRes.rows || []; 


    const latestNonListedMonthValue = latestMonthRes.rows && latestMonthRes.rows[0] 
                                    ? latestMonthRes.rows[0].latest_month 
                                    : null; 

    res.json({
      listedCompanyCount: listedCount,
      listedCompanies: listedDataRes.rows || [], // 加上 || [] 增加健壮性
      latestNonListedMonth: latestNonListedMonthValue, // <--- 添加到响应中
      nonListedCompanyCount: nonListedCount,
      nonListedCompanies: nonListedDataRes.rows || [], // 加上 || [] 增加健壮性
      financeCompanyCount: financingCount,
      financingCompanies: financingCompanies // 现在发送的是对象数组

    });

  } catch (err) {
    console.error('❌ 首页合并查询失败:', err);
    res.status(500).json({ error: '首页数据加载失败' });
  }
});


module.exports = router;
