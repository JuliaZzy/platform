const db = require('../db/db');

// 分页列表查询
function handlePaginatedList(tableName, enableHideFlag = false) {
  return async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    const whereClause = enableHideFlag ? `WHERE hide_flag NOT LIKE '%是%'` : '';

    const dataQuery = `SELECT * FROM ${tableName} ${whereClause} LIMIT $1 OFFSET $2`;
    const countQuery = `SELECT COUNT(*) AS total FROM ${tableName} ${whereClause}`;

    const label = `分页数据查询 - ${tableName} - ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    console.time(label);

    try {
      const dataResults = await db.query(dataQuery, [limit, offset]);
      const countResults = await db.query(countQuery);

      console.timeEnd(label);
      res.json({
        data: dataResults.rows,
        total: parseInt(countResults.rows[0].total, 10),
        page,
        pageSize: limit
      });
    } catch (err) {
      console.error(`❌ 分页查询失败 - ${tableName}:`, err);
      res.status(500).json({ error: '分页数据查询失败' });
    }
  };
}

// 公司数量统计
function handleCompanyCount(tableName, enableHideFlag = false) {
  return async (req, res) => {
    const whereClause = enableHideFlag ? `WHERE hide_flag NOT LIKE '%是%'` : '';
    const countQuery = `SELECT COUNT(*) AS count FROM ${tableName} ${whereClause}`;

    try {
      const result = await db.query(countQuery);
      res.json({ count: parseInt(result.rows[0].count, 10) });
    } catch (err) {
      console.error(`❌ 公司数量统计失败 - ${tableName}:`, err);
      res.status(500).json({ error: '公司数量统计失败' });
    }
  };
}

// 公司详情查询
function handleCompanyDetail(tableName, enableHideFlag = false) {
  return async (req, res) => {
    const whereClause = enableHideFlag ? `WHERE hide_flag NOT LIKE '%是%'` : '';
    const detailQuery = `SELECT * FROM ${tableName} ${whereClause}`;

    try {
      const result = await db.query(detailQuery);
      res.json(result.rows);
    } catch (err) {
      console.error(`❌ 公司详情查询失败 - ${tableName}:`, err);
      res.status(500).json({ error: '公司详情查询失败' });
    }
  };
}

// ✅ 正确导出
module.exports = {
  handlePaginatedList,
  handleCompanyCount,
  handleCompanyDetail
};
