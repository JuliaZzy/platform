const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const db = require('../db/db');
const fs = require('fs');
const axios = require('axios');

const upload = multer({ dest: 'uploads/' });

const sanitizeColumnName = (name) =>
  name.replace(/\s/g, '_').replace(/[\`\"]/g, '');

const isValidTableName = (name) =>
  /^[a-zA-Z0-9_]+$/.test(name);

router.post('/:mode', upload.single('file'), async (req, res) => {
  const { mode } = req.params;
  const { tableName } = req.query;

  if (!tableName || !isValidTableName(tableName)) {
    return res.status(400).json({ error: '表名必须由英文字母、数字或下划线组成' });
  }

  if (!req.file) {
    return res.status(400).json({ error: '未上传文件' });
  }

  const workbook = xlsx.readFile(req.file.path);
  const sheetName = workbook.SheetNames[0];
  const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null });

  if (!sheetData.length) {
    return res.status(400).json({ error: 'Excel 无数据内容' });
  }

  let columns = Object.keys(sheetData[0]).map(sanitizeColumnName);
  const values = sheetData.map((row) => columns.map((col) => row[col]));

  try {
    // 自动去掉“序号”列
    const index = columns.findIndex(c => c === '序号');
    if (index !== -1) {
      columns.splice(index, 1);
      for (let row of values) row.splice(index, 1);
    }

    if (mode === 'create') {
      const createCols = columns.map(col => `"${col}" TEXT`).join(', ');
      await db.query(`CREATE TABLE "${tableName}" (${createCols})`);

      const insertSQL = `INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(',')}) VALUES ${values.map((_, i) => `(${columns.map((__, j) => `$${i * columns.length + j + 1}`).join(',')})`).join(',')}`;
      const flatValues = values.flat();
      await db.query(insertSQL, flatValues);

      // ✅ 自动同步融资表（仅当为非上市公司）
      if (tableName === 'dataasset_non_listed_companies') {
        await axios.post('http://localhost:3000/api/finance/sync-bank-table');
        //await axios.post(`${process.env.SERVER_BASE_URL}/api/finance/sync-bank-table`);
        console.log('✅ 自动同步 dataasset_finance_bank 表成功');
      }

      return res.json({
        message: `✅ 成功创建新表 ${tableName} 并导入 ${values.length} 条数据`,
        newRows: sheetData,
        duplicateRows: []
      });
    } else if (mode === 'append') {
      const { rows: existingColsRes } = await db.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = $1
      `, [tableName]);
      const existingCols = existingColsRes.map(r => r.column_name);
      const selectCols = existingCols.filter(c => c !== 'id');

      const { rows: existingRows } = await db.query(`SELECT ${selectCols.map(c => `"${c}"`).join(',')} FROM "${tableName}"`);
      const existingSet = new Set(existingRows.map(r => JSON.stringify(Object.values(r))));

      const newRows = [], duplicateRows = [];
      for (const row of sheetData) {
        const filtered = {};
        for (const col of selectCols) filtered[col] = row[col];
        const signature = JSON.stringify(Object.values(filtered));
        if (existingSet.has(signature)) duplicateRows.push(filtered);
        else newRows.push(filtered);
      }

      if (newRows.length > 0) {
        const insertSQL = `INSERT INTO "${tableName}" (${selectCols.map(c => `"${c}"`).join(',')}) VALUES ${newRows.map((_, i) => `(${selectCols.map((__, j) => `$${i * selectCols.length + j + 1}`).join(',')})`).join(',')}`;
        const insertValues = newRows.flatMap(r => selectCols.map(c => r[c]));
        await db.query(insertSQL, insertValues);

        if (tableName === 'dataasset_non_listed_companies') {
          await axios.post('http://localhost:3000/api/finance/sync-bank-table');
          //await axios.post(`${process.env.SERVER_BASE_URL}/api/finance/sync-bank-table`);
          console.log('✅ 自动同步 dataasset_finance_bank 表成功');
        }

        return res.json({
          message: `✅ 插入 ${newRows.length} 条，检测出 ${duplicateRows.length} 条重复数据`,
          newRows,
          duplicateRows
        });
      } else {
        return res.json({
          message: `⚠️ 所有数据均已存在，共 ${duplicateRows.length} 条重复`,
          newRows: [],
          duplicateRows
        });
      }
    } else {
      return res.status(400).json({ error: '未知导入模式' });
    }
  } catch (err) {
    return res.status(500).json({ error: '导入失败', detail: err.message });
  } finally {
    fs.unlink(req.file.path, () => {});
  }
});

module.exports = router;
