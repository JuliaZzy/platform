const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const db = require('../../db/db');

// 导出 Excel 接口
router.get('/:tableName', async (req, res) => {
  const { tableName } = req.params;
  if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
    return res.status(400).json({ error: '非法表名，必须是英文、数字、下划线组成' });
  }

  try {
    const result = await db.query(`SELECT * FROM "${tableName}"`);
    const rows = result.rows;

    if (rows.length === 0) {
      return res.status(404).json({ error: '该表没有数据可导出' });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(tableName);

    const columns = Object.keys(rows[0]);
    worksheet.columns = columns.map(col => ({
      header: col,
      key: col,
      width: 20
    }));

    rows.forEach(row => worksheet.addRow(row));

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
