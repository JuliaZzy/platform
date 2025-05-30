const express = require('express');
const router = express.Router();
const db = require('../db/db'); // 确保路径正确

// AdminPage 各标签页对应的数据库表名、可搜索列、可筛选列
// 您需要根据实际情况完善 searchableColumns 和 filterableColumns
const adminTableConfigs = {
  'listed': {
    tableName: 'dataasset_listed_companies_2024',
    searchableColumns: ['"公司"', '"入表科目"', '"省份"', '"所属证券行业分布"', '"实控人"', '"市值规模"', '"报告时间"', '"status"'],
    filterableColumns: ['"公司"', '"入表科目"', '"省份"', '"所属证券行业分布"', '"实控人"', '"市值规模"', '"报告时间"', "status"]
  },
  'nonlisted': { 
    tableName: 'dataasset_non_listed_companies',
    searchableColumns: ['"province_area"', '"quarter_time"', '"month_time"', '"district_area"', '"company_name"', '"register_addr"', '"register_date"',
                        '"register_type"', '"sm_tech_flag"', '"high_tech_flag"', '"actual_controller"', '"company_type"', '"company_type_old"', '"admin_level"',
                        '"dataasset_register_addrtype"', '"dataasset_register_addr"', '"dataasset_content"', '"dataasset_type"', '"dataasset_type_old"', '"accounting_subject"', '"valuation_method"',
                        '"finance_type"', '"finance_orgs"', '"finance_memo"', '"meaning"', '"other_comment"', '"links"', '"company_name_now"',
                        '"bond_issuer"', '"parent_company_report"', '"company_business_type"', '"hide_flag"', '"status"'],
    filterableColumns: ['"province_area"', '"quarter_time"', '"month_time"', '"district_area"', '"company_name"', '"register_addr"', '"register_date"',
                        '"register_type"', '"sm_tech_flag"', '"high_tech_flag"', '"actual_controller"', '"company_type"', '"company_type_old"', '"admin_level"',
                        '"dataasset_register_addrtype"', '"dataasset_register_addr"', '"dataasset_content"', '"dataasset_type"', '"dataasset_type_old"', '"accounting_subject"', '"valuation_method"',
                        '"finance_type"', '"finance_orgs"', '"finance_memo"', '"meaning"', '"other_comment"', '"links"', '"company_name_now"',
                        '"bond_issuer"', '"parent_company_report"', '"company_business_type"', '"hide_flag"', "status"]
  },
  'finance-bank':{
    tableName: 'dataasset_finance_bank',
    searchableColumns: ['"month_time"', '"show_name"', '"dataasset_content"', '"finance_value"', '"finance_type"', '"finance_orgs"', '"status"'],
    filterableColumns: ['"month_time"', '"show_name"', '"dataasset_content"', '"finance_value"', '"finance_type"', '"finance_orgs"', "status"]
  },
  'finance-stock':{ 
    tableName: 'dataasset_finance_stock',
    searchableColumns: ['"入股时间"', '"作价入股企业"', '"数据资产"', '"入股公司"', '"status"'],
    filterableColumns: ['"入股时间"', '"作价入股企业"', '"数据资产"', '"入股公司"', "status"]
  },
  'finance-other':{ 
    tableName: 'dataasset_finance_other',
    searchableColumns: ['"融资类型"', '"日期"', '"企业"', '"数据内容"', '"产品"', '"融资支持机构"', '"融资金额（万元）"', '"status"'],
    filterableColumns: ['"融资类型"', '"日期"', '"企业"', '"数据内容"', '"产品"', '"融资支持机构"', '"融资金额（万元）"', "status"]
  }
};

// 通用数据获取接口: GET /api/admindata/tabledata/:tabKey?page=1&pageSize=15&filters={...}&searchKeyword=...
router.get('/tabledata/:tabKey', async (req, res) => {
  const { tabKey } = req.params;
  const config = adminTableConfigs[tabKey];

  if (!config) {
    return res.status(404).json({ error: `无效的表格类型或未配置 (admin): ${tabKey}` });
  }

  const { tableName, searchableColumns, filterableColumns } = config;
  
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize, 10) || 15;
  const clientFiltersString = req.query.filters;
  const searchKeyword = req.query.searchKeyword ? String(req.query.searchKeyword).trim().toLowerCase() : '';
  const offset = (page - 1) * pageSize;

  let clientFilters = {};
  if (clientFiltersString) {
    try {
      clientFilters = JSON.parse(clientFiltersString);
    } catch (e) {
      console.error("解析 filters JSON 字符串失败:", e);
      return res.status(400).json({ error: "筛选条件格式错误" });
    }
  }

  const queryValues = [];
  let whereConditions = [];

  // 1. ✅ 处理列筛选 (clientFilters)
  if (filterableColumns && typeof clientFilters === 'object' && Object.keys(clientFilters).length > 0) {
    for (const rawColName in clientFilters) {
      if (Object.prototype.hasOwnProperty.call(clientFilters, rawColName) &&
          Array.isArray(clientFilters[rawColName]) &&
          clientFilters[rawColName].length > 0) {
  
        const dbColName = filterableColumns.find(fc => fc.replace(/"/g, '') === rawColName.replace(/"/g, ''));
  
        if (dbColName) { // 如果找到了有效的数据库列名
          const filterValuesForColumn = clientFilters[rawColName]; // 获取这一列选中的所有筛选值，例如 ['北京', '上海']
  
          if (filterValuesForColumn.length === 1) {
            // --- 处理单个筛选值 ---
            const singleValue = filterValuesForColumn[0];
            if (singleValue === null || singleValue === 'NULL_VALUE_PLACEHOLDER') { // 假设用特殊值代表筛NULL
              whereConditions.push(`${dbColName} IS NULL`);
            } else {
              whereConditions.push(`${dbColName} = $${queryValues.length + 1}`);
              queryValues.push(singleValue); // ✅ **补充：将单个值添加到 queryValues**
            }
          } else {
            // --- 处理多个筛选值 (IN 子句) ---
            // 1. 为IN子句生成占位符 (例如 $N, $N+1, ...)
            //    同时，在 queryValues 中用临时值（比如0）占据这些位置
            const placeholders = filterValuesForColumn.map(() => {
              queryValues.push(0); // 先用任意值占位，这个值会被下面的循环替换
              return `$${queryValues.length}`;
            });
  
            // 2. 用真实的筛选值替换 queryValues 中的占位值
            filterValuesForColumn.forEach((val, i) => {
              queryValues[queryValues.length - filterValuesForColumn.length + i] = val;
            });
  
            // 3. 构建 IN 条件
            whereConditions.push(`${dbColName} IN (${placeholders.join(', ')})`);
          }
        } else {
          console.warn(`[AdminDataService] 尝试筛选未配置的列: ${rawColName}`);
        }
      }
    }
  }
  
  // 2. 处理全局关键词搜索 (searchKeyword)
  if (searchKeyword && searchableColumns && searchableColumns.length > 0) {
    const searchSubConditions = searchableColumns.map(col => {
      queryValues.push(`%${searchKeyword}%`);
      // col 在 searchableColumns 中应该已经是带引号的或安全的
      return `${col}::text ILIKE $${queryValues.length}`; 
    });
    whereConditions.push(`(${searchSubConditions.join(' OR ')})`);
  }

  // 3. 构建 WHERE 子句
  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const dataQuery = `
    SELECT * FROM "${tableName}" 
    ${whereClause} 
    ORDER BY status DESC, id ASC 
    LIMIT $${queryValues.length + 1} OFFSET $${queryValues.length + 2}
  `;
  const countQuery = `SELECT COUNT(*) AS total FROM "${tableName}" ${whereClause}`;

  console.log(`[AdminDataService] Tab: ${tabKey}, Data Query: ${dataQuery}`);
  console.log(`[AdminDataService] Data Values for query:`, [...queryValues, pageSize, offset]);
  console.log(`[AdminDataService] Tab: ${tabKey}, Count Query: ${countQuery}`);
  console.log(`[AdminDataService] Count Values for query:`, queryValues);


  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const countResult = await client.query(countQuery, queryValues);
    const totalRows = countResult.rows?.[0] ? parseInt(countResult.rows[0].total, 10) : 0;
    const dataResult = await client.query(dataQuery, [...queryValues, pageSize, offset]);
    await client.query('COMMIT');
    res.json({
      data: dataResult.rows,
      total: totalRows
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`❌ Admin - 查询失败 - 表 ${tableName} (tab: ${tabKey}):`, err);
    res.status(500).json({ error: 'Admin 后端数据查询失败', detail: err.message, stack: err.stack });
  } finally {
    client.release();
  }
});

module.exports = router;
