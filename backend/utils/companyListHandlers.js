const db = require('../db/db');

/**
 * 分页列表
 * @param {string} tableName - 需要查询的数据库表名。
 * @param {string} [filterType] - 过滤器类型
 * @returns {Function}
 */

// 分页列表查询
function handlePaginatedList(tableName, filterType = 'none') {
  return async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 10; // 每页显示 10 条
    const offset = (page - 1) * limit;

    let baseFilterCondition = '';

    switch (filterType) {
      case '2024Q4':
        baseFilterCondition = `"报告时间" = '2024Q4'`;
        break;
      case 'hide_flag':
        baseFilterCondition = `"hide_flag" NOT LIKE '%是%'`;
        break;
      case 'none':
      default:
        baseFilterCondition = '';
        break;
    }

    const conditions = [`"${tableName}"."status" IS DISTINCT FROM 'delete'`];
    if (baseFilterCondition) {
      conditions.push(`(${baseFilterCondition})`);
    }
    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const dataQuery = `SELECT * FROM "${tableName}" ${whereClause} ORDER BY "id" DESC LIMIT $1 OFFSET $2`; 
    const countQuery = `SELECT COUNT(*) AS total FROM "${tableName}" ${whereClause}`;

    const label = `分页数据查询 - ${tableName} (Filter: ${filterType}) - ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    console.time(label);

    try {
      const dataResults = await db.query(dataQuery, [limit, offset]);
      const countResults = await db.query(countQuery);

      console.timeEnd(label);

      const total = countResults.rows && countResults.rows[0] ? parseInt(countResults.rows[0].total, 10) : 0;

      res.json({
        data: dataResults.rows,
        total: total,
        page,
        pageSize: limit
      });
    } catch (err) {
      console.error(`❌ 分页查询失败 - ${tableName} (Filter: ${filterType}):`, err);
      res.status(500).json({ error: '分页数据查询失败', detail: err.message });
    }
  };
}

// 公司数量统计
function handleCompanyCount(tableName, filterType = 'none') {
  return async (req, res) => {
    let baseFilterCondition = ''; 

    switch (filterType) {
      case '2024Q4':
        baseFilterCondition = `"报告时间" = '2024Q4'`;
        break;
      case 'hide_flag':
        baseFilterCondition = `"hide_flag" NOT LIKE '%是%'`;
        break;
      case 'none':
      default:
        baseFilterCondition = '';
        break;
    }

    const conditions = [`"${tableName}"."status" IS DISTINCT FROM 'delete'`];
    if (baseFilterCondition) {
      conditions.push(`(${baseFilterCondition})`);
    }
    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    
    const countQuery = `SELECT COUNT(*) AS count FROM "${tableName}" ${whereClause}`;

    console.log(`Executing query: ${countQuery}`); 

    try {
      const result = await db.query(countQuery);
      const count = result.rows && result.rows[0] ? parseInt(result.rows[0].count, 10) : 0;
      res.json({ count: count });
    } catch (err) {
      console.error(`❌ 公司数量统计失败 - ${tableName} (Filter: ${filterType}):`, err);
      res.status(500).json({ error: '公司数量统计失败', detail: err.message });
    }
  };
}

function handleCompanyDetail(tableName) {
  return async (req, res) => {
    const detailQuery = `SELECT * FROM "${tableName}" ORDER BY "id" ASC`;

    const label = `Admin公司详情查询(全部状态数据) - ${tableName} - ${Date.now()}`;
    console.time(label);
    console.log(`Executing Admin Detail Query: ${detailQuery}`);


    try {
      const result = await db.query(detailQuery);
      console.timeEnd(label);
      res.json(result.rows); 
    } catch (err) {
      console.timeEnd(label); 
      console.error(`❌ Admin公司详情查询失败 - ${tableName}:`, err);
      res.status(500).json({ error: 'Admin公司详情数据查询失败', detail: err.message });
    }
  };
}

module.exports = {
  handlePaginatedList,
  handleCompanyCount,
  handleCompanyDetail
};
