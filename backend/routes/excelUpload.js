const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const db = require('../db/db');
const fs = require('fs');

const upload = multer({ dest: 'uploads/' });

const sanitizeColumnName = (name) =>
  name.replace(/[\s]/g, '_').replace(/[`"]/g, '');

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

  const columns = Object.keys(sheetData[0]).map(sanitizeColumnName);
  const values = sheetData.map((row) => columns.map((col) => row[col]));

  try {
    if (mode === 'create') {
      const createCols = columns.map(col => `"${col}" TEXT`).join(', ');
      await db.query(`CREATE TABLE "${tableName}" (${createCols})`);

      const insertSQL = `INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(',')}) VALUES ${values.map((_, i) => `(${columns.map((__, j) => `$${i * columns.length + j + 1}`).join(',')})`).join(',')}`;
      const flatValues = values.flat();
      await db.query(insertSQL, flatValues);

      return res.json({
        message: `✅ 成功创建新表 ${tableName} 并导入 ${values.length} 条数据`,
        newRows: sheetData,
        duplicateRows: []
      });
    }

    else if (mode === 'append') {
      // 获取已有列信息
      const { rows: existingColsRes } = await db.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = $1
      `, [tableName]);
      const existingCols = existingColsRes.map(r => r.column_name);
      const mismatch = columns.some(col => !existingCols.includes(col));
      if (mismatch) {
        return res.status(400).json({ error: '表结构不一致，列名不匹配' });
      }

      // 查询所有原始行（排除 id）
      const selectCols = existingCols.filter(c => c !== 'id');
      const { rows: existingRows } = await db.query(`SELECT ${selectCols.map(c => `"${c}"`).join(',')} FROM "${tableName}"`);
      const existingSet = new Set(existingRows.map(r => JSON.stringify(Object.values(r))));

      const newRows = [];
      const duplicateRows = [];
      for (const row of sheetData) {
        const filtered = {};
        for (const col of selectCols) filtered[col] = row[col];
        const signature = JSON.stringify(Object.values(filtered));
        if (existingSet.has(signature)) {
          duplicateRows.push(filtered);
        } else {
          newRows.push(filtered);
        }
      }

      if (newRows.length > 0) {
        const insertSQL = `INSERT INTO "${tableName}" (${selectCols.map(c => `"${c}"`).join(',')}) VALUES ${newRows.map((_, i) => `(${selectCols.map((__, j) => `$${i * selectCols.length + j + 1}`).join(',')})`).join(',')}`;
        const insertValues = newRows.flatMap(r => selectCols.map(c => r[c]));
        await db.query(insertSQL, insertValues);

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
    }

    else {
      return res.status(400).json({ error: '未知导入模式' });
    }
  } catch (err) {
    return res.status(500).json({ error: '导入失败', detail: err.message });
  } finally {
    fs.unlink(req.file.path, () => {});
  }
});

module.exports = router;

/*
const upload = multer({ dest: 'uploads/' });

const sanitizeColumnName = (name) =>
  name.replace(/[\s]/g, '_').replace(/[`]/g, '');

router.post('/:mode', upload.single('file'), (req, res) => {
  const { mode } = req.params;
  const { tableName } = req.query;

  if (!tableName || !/^[a-zA-Z0-9_]+$/.test(tableName)) {
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

  const columns = Object.keys(sheetData[0]).map(sanitizeColumnName);
  const values = sheetData.map((row) => columns.map((col) => row[col]));

  if (mode === 'append') {
    const colQuery = `SHOW COLUMNS FROM \`${tableName}\``;

    db.query(colQuery, (err, result) => {
      if (err) return res.status(500).json({ error: '目标表不存在或查询失败' });

      const existingCols = result.map(r => r.Field);
      const mismatch = columns.some(col => !existingCols.includes(col));
      if (mismatch) {
        return res.status(400).json({ error: '表结构不一致，列名不匹配' });
      }

      // 查询原始数据（不含 id 列）用于去重
      const selectCols = existingCols.filter(col => col !== 'id');
      const selectQuery = `SELECT ${selectCols.map(c => `\`${c}\``).join(',')} FROM \`${tableName}\``;
      db.query(selectQuery, (err, existingRows) => {
        if (err) return res.status(500).json({ error: '原始数据查询失败', detail: err });

        // 构建原始数据签名集合
        const existingSet = new Set(
          existingRows.map(row => JSON.stringify(Object.values(row)))
        );

        const newRows = [];
        const duplicateRows = [];

        for (const row of sheetData) {
          const filteredRow = {};
          for (const col of selectCols) {
            filteredRow[col] = row[col];
          }
          const signature = JSON.stringify(Object.values(filteredRow));
          if (existingSet.has(signature)) {
            duplicateRows.push(filteredRow);
          } else {
            newRows.push(filteredRow);
          }
        }

        // 插入新数据
        if (newRows.length > 0) {
          const insertSQL = `INSERT INTO \`${tableName}\` (${selectCols.map(col => `\`${col}\``).join(',')}) VALUES ?`;
          const newValues = newRows.map((row) => selectCols.map(col => row[col]));

          db.query(insertSQL, [newValues], (err) => {
            if (err) return res.status(500).json({ error: '插入失败', detail: err });

            return res.json({
              message: `✅ 插入 ${newRows.length} 条，检测出 ${duplicateRows.length} 条重复数据`,
              newRows,
              duplicateRows
            });
          });
        } else {
          return res.json({
            message: `⚠️ 所有数据均已存在，共 ${duplicateRows.length} 条重复`,
            newRows: [],
            duplicateRows
          });
        }
      });
    });
  }

  else if (mode === 'create') {
    const createCols = columns.map(col => `\`${col}\` VARCHAR(255)`).join(', ');
    const createSQL = `CREATE TABLE \`${tableName}\` (${createCols})`;

    db.query(createSQL, (err) => {
      if (err) return res.status(500).json({ error: '创建新表失败', detail: err });

      const insertSQL = `INSERT INTO \`${tableName}\` (${columns.map(col => `\`${col}\``).join(',')}) VALUES ?`;
      db.query(insertSQL, [values], (err) => {
        if (err) return res.status(500).json({ error: '插入失败', detail: err });
        return res.json({
          message: `✅ 成功创建新表 ${tableName} 并导入 ${values.length} 条数据`,
          newRows: sheetData,
          duplicateRows: []
        });
      });
    });
  }

  else {
    return res.status(400).json({ error: '未知导入模式' });
  }

  fs.unlink(req.file.path, () => {});
});

module.exports = router;
*/