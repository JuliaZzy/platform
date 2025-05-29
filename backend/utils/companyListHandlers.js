const db = require('../db/db');

/**
 * 创建一个用于获取分页列表数据的 Express 路由处理器。
 * @param {string} tableName - 需要查询的数据库表名。
 * @param {string} [filterType] - 过滤器类型 ('Q4', 'hide_flag', 或其他自定义类型)。默认为 'none'。
 * @returns {Function} - 返回一个 Express 路由处理器 (async (req, res) => ...)。
 */

// 分页列表查询
function handlePaginatedList(tableName, filterType = 'none') {
  return async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 10; // 每页显示 10 条
    const offset = (page - 1) * limit;

    let baseFilterCondition = ''; // 存放由 filterType 产生的条件

    // 根据 filterType 构建基础的筛选条件
    switch (filterType) {
      case 'Q4':
        baseFilterCondition = `"报告时间" = 'Q4'`;
        break;
      case 'hide_flag':
        baseFilterCondition = `"hide_flag" NOT LIKE '%是%'`; // 假设 hide_flag 是列名
        break;
      case 'none':
      default:
        baseFilterCondition = ''; // 无特定过滤
        break;
    }

    // ✅ 构建最终的 WHERE 子句，总是包含 status 过滤
    const conditions = [`"${tableName}"."status" IS DISTINCT FROM 'delete'`];
    if (baseFilterCondition) {
      conditions.push(`(${baseFilterCondition})`); // 将原有条件用括号包裹
    }
    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // 确保 tableName 是安全的，推荐使用双引号包裹
    // ✅ 假设所有表都有 "id" 列用于排序
    const dataQuery = `SELECT * FROM "${tableName}" ${whereClause} ORDER BY "id" DESC LIMIT $1 OFFSET $2`; 
    const countQuery = `SELECT COUNT(*) AS total FROM "${tableName}" ${whereClause}`;

    const label = `分页数据查询 - ${tableName} (Filter: ${filterType}) - ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    console.time(label);

    try {
      // 注意：这里的查询没有使用参数化filterType的条件，因为它们是硬编码的字符串
      const dataResults = await db.query(dataQuery, [limit, offset]);
      const countResults = await db.query(countQuery); // countQuery 也不需要额外参数

      console.timeEnd(label);

      const total = countResults.rows && countResults.rows[0] ? parseInt(countResults.rows[0].total, 10) : 0;

      res.json({
        data: dataResults.rows, // ✅ 保持和 adminApiService.js 中 finance 接口返回的字段名一致 (data)
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
      case 'Q4':
        baseFilterCondition = `"报告时间" = 'Q4'`;
        break;
      case 'hide_flag':
        baseFilterCondition = `"hide_flag" NOT LIKE '%是%'`;
        break;
      case 'none':
      default:
        baseFilterCondition = '';
        break;
    }

    // ✅ 构建最终的 WHERE 子句，总是包含 status 过滤
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

// 公司详情查询 (✅ 此函数不添加 status 过滤，供 AdminPage 使用)
function handleCompanyDetail(tableName) {
  return async (req, res) => {
    // ✅ AdminPage 需要所有数据，包括各种状态，所以这里不加 "status" IS DISTINCT FROM 'delete'
    // ✅ 确保 SELECT * 会返回 id 和 status 列，以便 AdminPage 处理
    // ✅ 建议添加 ORDER BY "id" ASC 来保证 AdminPage 中数据的顺序稳定性
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
