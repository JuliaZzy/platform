const express = require('express');
const router = express.Router();
const db = require('../db/db'); // 确保路径正确

// AdminPage 各标签页对应的数据库表名、可搜索列、可筛选列
// 您需要根据实际情况完善 searchableColumns 和 filterableColumns
const adminTableConfigs = {
  'listed': {
    tableName: 'dataasset_listed_companies_2024',
    searchableColumns: ['"公司"', '"入表科目"', '"省份"', '"所属证券行业分布"', '"实控人"', '"市值规模"', '"报告时间"'],
    filterableColumnsMap: {
      "公司": '"公司"',
      "入表科目": '"入表科目"',
      "入表科目": '"入表科目"',
      "省份": '"省份"',
      "实控人": '"实控人"',
      "市值规模": '"市值规模"',
      "报告时间": '"报告时间"'
    }
  },
  'nonlisted': { tableName: 'dataasset_non_listed_companies' },
  'finance-bank':{ tableName: 'dataasset_finance_bank' },
  'finance-stock':{ tableName: 'dataasset_finance_stock' },
  'finance-other':{ tableName: 'dataasset_finance_other' }
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

  // 1. ✅ 处理列筛选 (clientFilters) - 已恢复
  if (filterableColumns && typeof clientFilters === 'object' && Object.keys(clientFilters).length > 0) {
    for (const rawColName in clientFilters) { // rawColName 来自前端，可能是 "公司" 或 "month_time"
      if (Object.prototype.hasOwnProperty.call(clientFilters, rawColName) && 
          Array.isArray(clientFilters[rawColName]) && 
          clientFilters[rawColName].length > 0) {
        
        // 确保列名在SQL中是安全的 (例如，使用双引号)
        // filterableColumns 中的列名应该已经是加了引号的或者是不需要引号的安全名称
        const dbColName = filterableColumns.find(fc => fc.replace(/"/g, '') === rawColName.replace(/"/g, ''));

        if (dbColName) { // 只有在配置中允许筛选的列才处理
            const filterValuesForColumn = clientFilters[rawColName];
            
            if (filterValuesForColumn.length === 1) {
                // 对于单个值，使用 IS NOT DISTINCT FROM 处理 NULL
                // (如果筛选值本身可能代表NULL，例如用户选择了一个“空”选项)
                // 但通常筛选值是具体的数据值
                if (filterValuesForColumn[0] === null || filterValuesForColumn[0] === 'NULL_VALUE_PLACEHOLDER') { // 假设用特殊值代表筛NULL
                    whereConditions.push(`${dbColName} IS NULL`);
                } else {
                    whereConditions.push(`${dbColName} = $${queryValues.length + 1}`);
                    queryValues.push(filterValuesForColumn[0]);
                }
            } else {
                // 对于多个值，使用 IN。注意：IN 不会直接匹配 NULL。
                // 如果需要 IN 也匹配 NULL，需要额外处理或确保筛选值列表不含代表NULL的项。
                const placeholders = filterValuesForColumn.map(() => {
                    queryValues.push(0); // 先用0占位
                    return `$${queryValues.length}`;
                });
                filterValuesForColumn.forEach((val, i) => {
                    queryValues[queryValues.length - filterValuesForColumn.length + i] = val; // 回填真实值
                });
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
    ORDER BY id ASC 
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
