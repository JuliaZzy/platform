const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const db = require('../db/db');
const fs = require('fs');

const upload = multer({ dest: 'uploads/' });

const sanitizeColumnName = (name) => {
  if (typeof name !== 'string') return '';
  return name.trim().replace(/\s+/g, '_').replace(/[\`\"\[\]\(\)]/g, '');
};

const isValidTableName = (name) => /^[a-zA-Z0-9_]+$/.test(name);

const tableKeyColumnConfigs = {
  'dataasset_listed_companies_2024': {
    keyDbColumns: ['公司', '入表科目', '省份', '所属证券行业分布', '实控人', '报告时间'],
    description: "公司, 入表科目, 省份, 所属证券行业分布, 实控人, 报告时间"
  },
  'dataasset_non_listed_companies': {
    keyDbColumns: ['province_area', 'quarter_time', 'month_time', 'district_area', 'company_name'],
    description: "province_area, quarter_time, month_time, district_area, company_name"
  },
  'dataasset_finance_stock': {
    keyDbColumns: ['入股时间', '作价入股企业', '数据资产', '入股公司'],
    description: "入股时间, 作价入股企业, 数据资产, 入股公司"
  },
  'dataasset_finance_other': {
    keyDbColumns: ['融资类型', '日期', '企业'],
    description: "融资类型, 日期, 企业"
  }
};

const columnSpecificDateFormatting = {
  'dataasset_non_listed_companies': {
    'month_time': 'YYYY-MM',
    'register_date': 'YYYY-MM-DD'
  },
  'dataasset_finance_stock': {
    '入股时间': 'YYYY-MM'
  },
  'dataasset_finance_other': {
    '日期': 'YYYY-MM'
  }
};

router.post('/append', upload.single('file'), async (req, res) => {
  const { tableName } = req.query;

  if (!req.file) return res.status(400).json({ error: '未上传文件' });
  if (!tableName || !isValidTableName(tableName)) {
    return res.status(400).json({ error: '表名无效或未提供' });
  }

  const currentTableKeysConfig = tableKeyColumnConfigs[tableName];
  if (!currentTableKeysConfig && tableName !== 'dataasset_finance_bank') {
    fs.unlink(req.file.path, () => {});
    return res.status(400).json({ error: `表 ${tableName} 未配置上传的指定列信息。` });
  }
  if (tableName === 'dataasset_finance_bank') {
    fs.unlink(req.file.path, () => {});
    return res.status(400).json({ error: `表 ${tableName} 不支持数据上传功能。` });
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const dbColumnsRes = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1 AND column_name NOT IN ('id', 'status')
      ORDER BY status;
    `, [tableName]);

    if (dbColumnsRes.rows.length === 0) {
      await client.query('ROLLBACK');
      fs.unlink(req.file.path, () => {});
      return res.status(404).json({ error: `表 ${tableName} 不存在或不包含业务列。` });
    }

    const dbBusinessColumnNames = dbColumnsRes.rows.map(r => r.column_name);
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      await client.query('ROLLBACK');
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: 'Excel工作表不存在' });
    }

    const rawSheetData = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });
    if (rawSheetData.length < 1) {
      await client.query('ROLLBACK');
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: 'Excel表头为空' });
    }

    let excelRawHeaders = rawSheetData[0].map(h => String(h || '').trim());
    let excelDataRows = rawSheetData.slice(1);

    const seqHeaderIndex = excelRawHeaders.findIndex(h => typeof h === 'string' && sanitizeColumnName(h) === '序号');
    if (seqHeaderIndex !== -1) {
      excelRawHeaders.splice(seqHeaderIndex, 1);
      excelDataRows.forEach(row => row.splice(seqHeaderIndex, 1));
    }

    let sanitizedExcelHeadersForIdCheck = excelRawHeaders.map(sanitizeColumnName);
    const idColIndex = sanitizedExcelHeadersForIdCheck.findIndex(h => h.toLowerCase() === 'id');
    if (idColIndex !== -1) {
      console.log(`[excelUpload] 发现并忽略了Excel中的 "id" 列 (原始表头: "${excelRawHeaders[idColIndex]}").`);
      excelRawHeaders.splice(idColIndex, 1);
      excelDataRows.forEach(row => row.splice(idColIndex, 1));
    }

    let currentExcelColumnCount = excelRawHeaders.length;
    while (currentExcelColumnCount > dbBusinessColumnNames.length) {
      const lastColIndex = currentExcelColumnCount - 1;
      const isLastColEmpty = excelDataRows.every(row => row[lastColIndex] === null || String(row[lastColIndex]).trim() === '');
      if (isLastColEmpty) {
        excelRawHeaders.pop();
        excelDataRows.forEach(row => row.pop());
        currentExcelColumnCount--;
      } else {
        await client.query('ROLLBACK');
        fs.unlink(req.file.path, () => {});
        return res.status(400).json({ error: `列数不匹配: Excel有效数据列 (${currentExcelColumnCount}) 多于数据库业务列 (${dbBusinessColumnNames.length})，且尾部多余列不为空。` });
      }
    }

    if (currentExcelColumnCount !== dbBusinessColumnNames.length) {
      await client.query('ROLLBACK');
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: `列数不匹配：Excel最终有效数据列为 ${currentExcelColumnCount}，数据库表 ${tableName} 需要 ${dbBusinessColumnNames.length} 个业务列。` });
    }

    const results = {
      insertedUnique: 0,
      insertedAsRepeat: 0,
      updatedToRepeat: 0,
      ignoredFullDuplicate: 0,
      processedRows: 0,
      affectedRowsForFrontend: []
    };

    const configuredKeyDbNames = currentTableKeysConfig.keyDbColumns;
    if (!configuredKeyDbNames || configuredKeyDbNames.length === 0) {
      await client.query('ROLLBACK');
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: `表 ${tableName} 未正确配置用于重复检查的关键列 (keyDbColumns)。` });
    }

    const currentTableDateFormats = columnSpecificDateFormatting[tableName] || {};

    console.log(`[excelUpload] 表 ${tableName}: 开始处理 ${excelDataRows.length} 行数据...`);

    for (let rowIndex = 0; rowIndex < excelDataRows.length; rowIndex++) {
      const originalExcelRow = excelDataRows[rowIndex];
      results.processedRows++;

      const processedRowValues = originalExcelRow.map((value, colIndex) => {
        let cellValue = typeof value === 'string' ? value.trim() : value;
        const dbColName = dbBusinessColumnNames[colIndex];
        const targetDateFormat = currentTableDateFormats[dbColName];

        if (targetDateFormat) {
          let year, month, day;
          let parsed = false;

          if (typeof cellValue === 'number' && cellValue > 1 && cellValue < 200000) {
            try {
              const dateObj = xlsx.SSF.parse_date_code(cellValue);
              if (dateObj && typeof dateObj.y === 'number' && typeof dateObj.m === 'number' && typeof dateObj.d === 'number') {
                year = dateObj.y;
                month = String(dateObj.m).padStart(2, '0');
                day = String(dateObj.d).padStart(2, '0');
                parsed = true;
              }
            } catch (e) {
              console.warn(`[excelUpload] 日期序列号转换失败:`, e);
            }
          } else if (cellValue instanceof Date && !isNaN(cellValue)) {
            year = cellValue.getFullYear();
            month = String(cellValue.getMonth() + 1).padStart(2, '0');
            day = String(cellValue.getDate()).padStart(2, '0');
            parsed = true;
          }

          if (parsed) {
            return targetDateFormat === 'YYYY-MM-DD' ? `${year}-${month}-${day}` : `${year}-${month}`;
          }
        }
        return cellValue;
      });

      const allMatchConditions = dbBusinessColumnNames.map((col, i) => `"${col}" IS NOT DISTINCT FROM $${i + 1}`);
      const fullMatchQuery = `SELECT id FROM "${tableName}" WHERE ${allMatchConditions.join(' AND ')}`;
      const fullMatchResult = await client.query(fullMatchQuery, processedRowValues);

      if (fullMatchResult.rows.length > 0) {
        results.ignoredFullDuplicate++;
        continue;
      }

      const keyMatchConditions = [];
      const keyMatchValues = [];
      for (const keyCol of configuredKeyDbNames) {
        const indexInExcel = dbBusinessColumnNames.indexOf(keyCol);
        if (indexInExcel !== -1) {
          keyMatchConditions.push(`"${keyCol}" IS NOT DISTINCT FROM $${keyMatchValues.length + 1}`);
          keyMatchValues.push(processedRowValues[indexInExcel]);
        }
      }

      let status = 'unique';
      if (keyMatchConditions.length === configuredKeyDbNames.length) {
        const partialMatchQuery = `SELECT id, status FROM "${tableName}" WHERE ${keyMatchConditions.join(' AND ')}`;
        const partialMatchResult = await client.query(partialMatchQuery, keyMatchValues);

        if (partialMatchResult.rows.length > 0) {
          status = 'repeat';
          results.insertedAsRepeat++;
          for (const row of partialMatchResult.rows) {
            if (row.status !== 'delete' && row.status !== 'repeat') {
              await client.query(`UPDATE "${tableName}" SET status = 'repeat' WHERE id = $1`, [row.id]);
              results.updatedToRepeat++;
            }
          }
        }
      }

      const insertCols = dbBusinessColumnNames.concat('status');
      const insertValues = processedRowValues.concat(status);
      const placeholders = insertCols.map((_, i) => `$${i + 1}`);
      await client.query(`INSERT INTO "${tableName}" (${insertCols.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders.join(', ')})`, insertValues);

      if (status === 'unique') {
        results.insertedUnique++;
      }
    }

    await client.query('COMMIT');
    res.json({ message: '数据上传完成', results });
  } catch (e) {
    console.error(e);
    await client.query('ROLLBACK');
    res.status(500).json({ error: '内部服务器错误' });
  } finally {
    fs.unlink(req.file.path, () => {});
    client.release();
  }
});

module.exports = router;
