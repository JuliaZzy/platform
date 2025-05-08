const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const db = require('../db/db');

// 导出 Excel 接口
router.get('/:tableName', async (req, res) => {
  const { tableName } = req.params;

  // 表名校验
  if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
    return res.status(400).json({ error: '非法表名，必须是英文、数字、下划线组成' });
  }

  try {
    // 查询数据（PostgreSQL 无需反引号）
    const result = await db.query(`SELECT * FROM "${tableName}"`);
    const rows = result.rows;

    if (rows.length === 0) {
      return res.status(404).json({ error: '该表没有数据可导出' });
    }

    // 创建 Excel 文件
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(tableName);

    const columns = Object.keys(rows[0]);
    worksheet.columns = columns.map(col => ({
      header: col,
      key: col,
      width: 20
    }));

    rows.forEach(row => worksheet.addRow(row));

    // 响应头
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${tableName}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error('导出失败:', err);
    return res.status(500).json({ error: '查询或导出失败', detail: err.message });
  }
});

module.exports = router;


/*
// 导出 Excel 接口
router.get('/:tableName', async (req, res) => {
  const { tableName } = req.params;

  // 表名校验
  if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
    return res.status(400).json({ error: '非法表名，必须是英文、数字、下划线组成' });
  }

  // 查询数据
  const query = `SELECT * FROM \`${tableName}\``;
  db.query(query, async (err, rows) => {
    if (err) {
      console.error('查询失败:', err);
      return res.status(500).json({ error: '查询失败' });
    }

    if (rows.length === 0) {
      return res.status(404).json({ error: '该表没有数据可导出' });
    }

    // 构建 Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(tableName);

    // 添加表头
    const columns = Object.keys(rows[0]);
    worksheet.columns = columns.map(col => ({
      header: col,
      key: col,
      width: 20
    }));

    // 添加数据行
    rows.forEach(row => worksheet.addRow(row));

    // 设置响应头
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${tableName}.xlsx`);

    // 写入流响应
    await workbook.xlsx.write(res);
    res.end();
  });
});

module.exports = router;
*/