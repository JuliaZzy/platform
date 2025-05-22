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
 * 数据资产融资接口
 */
router.get('/data-asset-financing', handlePaginatedList(FINANCING_TABLE, false));
router.get('/data-asset-financing-count', handleCompanyCount(FINANCING_TABLE, false));
router.get('/data-asset-financing-detail', handleCompanyDetail(FINANCING_TABLE, false));

/**
 * ✅ 首页数据整合接口（合并请求）
 */
router.get('/homepage-summary', async (req, res) => {
  try {
    // 总数统计
    const listedCountRes = await db.query(`SELECT COUNT(*) AS listed_count FROM ${LISTED_TABLE}`);
    const nonListedCountRes = await db.query(
      `SELECT COUNT(*) AS non_listed_count FROM ${NON_LISTED_TABLE} WHERE hide_flag NOT LIKE '%是%'`
    );

    // 获取三张融资表的公司名称
    const allFinancingRes = await db.query(`
      SELECT name 
      FROM (
          SELECT show_name AS name, 
                CAST(finance_value AS NUMERIC) AS amount
          FROM dataasset_finance_bank
        
          UNION ALL
        
          SELECT "作价入股企业" AS name, 
                CAST("融资金额（万元）" AS NUMERIC) AS amount
          FROM dataasset_finance_stock
        
          UNION ALL
        
          SELECT "企业" AS name,
                CASE 
                  WHEN "融资金额（万元）" ~ '^[0-9]+(\\\.[0-9]+)?$'
                  THEN CAST("融资金额（万元）" AS NUMERIC)
                  ELSE NULL
                END AS amount
          FROM dataasset_finance_other
        ) as combined
      ORDER BY amount IS NULL, amount DESC;
    `);

    const financingCompanies = allFinancingRes.rows.map(c => c.name);
    const financingCount = financingCompanies.length;

    // 查询上市公司全字段（含“公司”与“报告时间”列，供 Q1~Q4 分类）
    const listedDataRes = await db.query(`SELECT "公司", "报告时间" FROM ${LISTED_TABLE} ORDER BY "数据资源入表总额（万元）" DESC`);

    // 非上市公司仅查询部分字段
    const nonListedDataRes = await db.query(
      `SELECT 
        CASE 
          WHEN parent_company_report = '' THEN company_name 
          ELSE parent_company_report || '（' || company_name || '）'
        END AS company_name
      FROM ${NON_LISTED_TABLE} 
      WHERE hide_flag NOT LIKE '%是%' 
      ORDER BY finance_value DESC 
      LIMIT 10 OFFSET 0`
    );

    res.json({
      listedCompanyCount: parseInt(listedCountRes.rows[0].listed_count, 10),
      listedCompanies: listedDataRes.rows,
      nonListedCompanyCount: parseInt(nonListedCountRes.rows[0].non_listed_count, 10),
      nonListedCompanies: nonListedDataRes.rows,
      financeCompanyCount: financingCount,
      financingCompanies: financingCompanies
    });
  } catch (err) {
    console.error('❌ 首页合并查询失败:', err);
    res.status(500).json({ error: '首页数据加载失败' });
  }
});


module.exports = router;
