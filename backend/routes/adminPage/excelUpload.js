const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const db = require('../../db/db');
const fs = require('fs');
const { triggerBankTableSync } = require('./statusUpdateApi');
const upload = multer({ dest: 'uploads/' });

// 清理列名函数
const sanitizeColumnName = (name) => {
  if (typeof name !== 'string') return '';
  return name.trim().replace(/\s+/g, '_').replace(/[\`\"\[\]\(\)]/g, '');
};

// 验证表名函数
const isValidTableName = (name) => /^[a-zA-Z0-9_]+$/.test(name);

// “部分重复”检查
const tableKeyColumnConfigs = {
  'dataasset_listed_companies_2024': {
    keyDbColumns: ['证券代码', '报告时间'], 
    description: "证券代码, 报告时间"
  },
  'dataasset_non_listed_companies': {
    keyDbColumns: ['province_area', 'month_time', 'company_name','dataasset_content'], 
    description: "province_area, month_time, company_name, dataasset_content"
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

// 日期格式转换
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

async function handleUploadError(client, filePath, res, statusCode, errorMessage) {
  if (client) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Rollback failed:', rollbackError);
    }
  }
  if (filePath) {
    fs.unlink(filePath, (unlinkErr) => {
      if (unlinkErr) console.error('Failed to delete temporary upload file during error handling:', unlinkErr);
    });
  }
  return res.status(statusCode).json({ error: errorMessage });
}

router.post('/append', upload.single('file'), async (req, res) => {
  const { tableName } = req.query;

  if (!req.file) {
    return await handleUploadError(null, null, res, 400, '未上传文件');
  }
  if (!tableName || !isValidTableName(tableName)) {
    return await handleUploadError(null, req.file.path, res, 400, '表名无效或未提供');
  }
  
  const currentTableKeysConfig = tableKeyColumnConfigs[tableName];

  if (!currentTableKeysConfig && tableName !== 'dataasset_finance_bank') {
    return await handleUploadError(null, req.file.path, res, 400, `表 ${tableName} 未配置上传的指定列信息。`);
  }
  if (tableName === 'dataasset_finance_bank') {
    return await handleUploadError(null, req.file.path, res, 400, `表 ${tableName} 不支持数据上传功能。`);
  }

  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    const dbColumnsRes = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1 AND column_name NOT IN ('id', 'status')
      ORDER BY ordinal_position;
    `, [tableName]);

    if (dbColumnsRes.rows.length === 0) {
      return await handleUploadError(client, req.file.path, res, 404, `表 ${tableName} 不存在或不包含业务列。`);
    }

    const dbBusinessColumnNames = dbColumnsRes.rows.map(r => r.column_name);

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
      return await handleUploadError(client, req.file.path, res, 400, 'Excel工作表不存在');
    }

    const rawSheetData = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });

    if (rawSheetData.length < 1) {
      return await handleUploadError(client, req.file.path, res, 400, 'Excel表头为空');
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
      const isLastColEffectivelyEmpty = excelDataRows.every(row => row[lastColIndex] === null || String(row[lastColIndex]).trim() === '');
      if (isLastColEffectivelyEmpty) {
        excelRawHeaders.pop();
        excelDataRows.forEach(row => row.pop());
        currentExcelColumnCount--;
      } else {
        return await handleUploadError(client, req.file.path, res, 400, `列数不匹配: Excel有效数据列 (<span class="math-inline">\{currentExcelColumnCount\}\) 多于数据库业务列 \(</span>{dbBusinessColumnNames.length})，且尾部多余列不为空。`);
      }

    }

    if (currentExcelColumnCount !== dbBusinessColumnNames.length) {
      return await handleUploadError(client, req.file.path, res, 400, `列数不匹配：Excel最终有效数据列为 ${currentExcelColumnCount}，数据库表 ${tableName} 需要 ${dbBusinessColumnNames.length} 个业务列。`);
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
      return await handleUploadError(client, req.file.path, res, 400, `表 ${tableName} 未正确配置用于重复检查的关键列 (keyDbColumns)。`);
    }
    
    const currentTableDateFormats = columnSpecificDateFormatting[tableName] || {};

    console.log(`[excelUpload] 表 ${tableName}: 开始处理 ${excelDataRows.length} 行数据...`);
    console.log(`[excelUpload] 表 ${tableName}: 数据库业务列 (DB): `, dbBusinessColumnNames);
    console.log(`[excelUpload] 表 ${tableName}: 用于部分重复检查的DB键列: `, configuredKeyDbNames);
    console.log(`[excelUpload] 表 ${tableName}: 日期转换配置: `, currentTableDateFormats);

    for (let rowIndex = 0; rowIndex < excelDataRows.length; rowIndex++) {
      const originalExcelRowArray = excelDataRows[rowIndex];
      results.processedRows++;

      const processedExcelRowValues = originalExcelRowArray.map((value, colIndex) => {
        let cellValue = (typeof value === 'string') ? value.trim() : value;
        const dbColName = dbBusinessColumnNames[colIndex];
        const targetDateFormat = currentTableDateFormats[dbColName];

        if (targetDateFormat) {
          let year, month, day;
          let dateParsedSuccessfully = false;

          if (typeof cellValue === 'number' && cellValue > 1 && cellValue < 200000) { 
            try {
              const dateObj = xlsx.SSF.parse_date_code(cellValue);
              if (dateObj && typeof dateObj.y === 'number' && typeof dateObj.m === 'number' && typeof dateObj.d === 'number') {
                year = dateObj.y;
                month = String(dateObj.m).padStart(2, '0');
                day = String(dateObj.d).padStart(2, '0');
                dateParsedSuccessfully = true;
              } else {
                 console.warn(`[excelUpload] 表: ${tableName}, 行 ${rowIndex + 1}, DB列 "${dbColName}", Excel原始值 "${value}", Trim后值 "${cellValue}": XLSX.SSF.parse_date_code未能解析。`);
              }
            } catch (e) {
              console.warn(`[excelUpload] 表: ${tableName}, 行 ${rowIndex + 1}, DB列 "${dbColName}", Excel原始值 "${value}", Trim后值 "${cellValue}": 日期序列号转换时出错。`, e);
            }
          } else if (cellValue instanceof Date && !isNaN(cellValue)) { 
             year = cellValue.getFullYear();
             month = String(cellValue.getMonth() + 1).padStart(2, '0');
             day = String(cellValue.getDate()).padStart(2, '0');
             dateParsedSuccessfully = true;
          }
          else if (typeof cellValue === 'string') {
            const cleanedDateString = cellValue.replace(/[年月]/g, '-').replace(/[日]/g, '');
            const strictDateMatch = cleanedDateString.match(/^(\d{4})[-./]?(\d{1,2})[-./]?(\d{1,2})$/); // YYYY-MM-DD or YYYY/MM/DD etc.
            const yearMonthMatch = cleanedDateString.match(/^(\d{4})[-./]?(\d{1,2})$/); // YYYY-MM or YYYY/MM

            if (strictDateMatch) {
                year = parseInt(strictDateMatch[1], 10);
                month = String(parseInt(strictDateMatch[2], 10)).padStart(2, '0');
                day = String(parseInt(strictDateMatch[3], 10)).padStart(2, '0');
                dateParsedSuccessfully = true;
            } else if (yearMonthMatch) {
                 year = parseInt(yearMonthMatch[1], 10);
                 month = String(parseInt(yearMonthMatch[2], 10)).padStart(2, '0');
                 day = '01'; 
                 dateParsedSuccessfully = true;
            }
          }

          if (dateParsedSuccessfully) {
            let formattedDate = '';
            if (targetDateFormat === 'YYYY-MM-DD') {
              formattedDate = `${year}-${month}-${day}`;
            } else if (targetDateFormat === 'YYYY-MM') {
              formattedDate = `${year}-${month}`;
            } else {
              console.warn(`[excelUpload] 表: ${tableName}, 行 ${rowIndex + 1}, DB列 "${dbColName}": 未知的目标日期格式 "${targetDateFormat}"，返回原始值。`);
              return cellValue; 
            }
            return formattedDate;
          }
        }
        return cellValue; 
      });
      
      const excelRowValues = processedExcelRowValues; 

      // --- 完全重复检查 ---
      const allMatchConditions = [];
      const allMatchValues = [];
      dbBusinessColumnNames.forEach((dbCol, index) => {
        allMatchConditions.push(`"${dbCol}" IS NOT DISTINCT FROM $${index + 1}`);
        allMatchValues.push(excelRowValues[index]);
      });
      const fullMatchQuery = `SELECT id FROM "${tableName}" WHERE ${allMatchConditions.join(' AND ')}`;
      const fullMatchResult = await client.query(fullMatchQuery, allMatchValues);

      if (fullMatchResult.rows.length > 0) {
        results.ignoredFullDuplicate++;
        continue; 
      }

      // --- 部分重复检查 ---
      const keyMatchConditionsForQuery = [];
      const keyMatchValuesFromExcel = [];
      for (const keyDbColName of configuredKeyDbNames) {
        const indexInBusinessColumns = dbBusinessColumnNames.indexOf(keyDbColName);
        if (indexInBusinessColumns !== -1) {
          keyMatchConditionsForQuery.push(`"${keyDbColName}" IS NOT DISTINCT FROM $${keyMatchValuesFromExcel.length + 1}`);
          keyMatchValuesFromExcel.push(excelRowValues[indexInBusinessColumns]);
        } else {
          console.error(`[excelUpload] 配置错误: 表 ${tableName} 的关键列 "${keyDbColName}" 未在其业务列列表中找到。此关键列将被忽略。`);
        }
      }
      
      let statusToInsertForNewRow = null; 
      if (keyMatchConditionsForQuery.length > 0 && keyMatchConditionsForQuery.length === configuredKeyDbNames.filter(kcn => dbBusinessColumnNames.includes(kcn)).length) { 
        const partialMatchQuery = `SELECT id, status FROM "${tableName}" WHERE ${keyMatchConditionsForQuery.join(' AND ')}`;
        const partialMatchResult = await client.query(partialMatchQuery, keyMatchValuesFromExcel);

        if (partialMatchResult.rows.length > 0) { 
          statusToInsertForNewRow = 'repeat';
          results.insertedAsRepeat++;
          for (const existingDbRow of partialMatchResult.rows) {
            if (existingDbRow.status !== 'delete') {
              if (existingDbRow.status !== 'repeat') { 
                const { rows: updatedRows } = await client.query(
                  `UPDATE "${tableName}" SET status = 'repeat' WHERE id = $1 RETURNING *`, 
                  [existingDbRow.id]
                );
                if (updatedRows.length > 0) {
                  results.updatedToRepeat++;
                  const idx = results.affectedRowsForFrontend.findIndex(r => r.id === updatedRows[0].id);
                  if (idx > -1) results.affectedRowsForFrontend[idx] = updatedRows[0];
                  else results.affectedRowsForFrontend.push(updatedRows[0]);
                }
              } else {
                  const idx = results.affectedRowsForFrontend.findIndex(r => r.id === existingDbRow.id);
                  if (idx === -1) {
                      const { rows: currentRepeatRows } = await client.query(`SELECT * FROM "${tableName}" WHERE id = $1`, [existingDbRow.id]);
                      if (currentRepeatRows.length > 0) results.affectedRowsForFrontend.push(currentRepeatRows[0]);
                  }
              }
            } else { 
              const idx = results.affectedRowsForFrontend.findIndex(r => r.id === existingDbRow.id);
              if (idx === -1) {
                  const { rows: currentDeletedRows } = await client.query(`SELECT * FROM "${tableName}" WHERE id = $1`, [existingDbRow.id]);
                  if (currentDeletedRows.length > 0) results.affectedRowsForFrontend.push(currentDeletedRows[0]);
              }
            }
          }
        } else { 
          results.insertedUnique++;
          statusToInsertForNewRow = null; 
        }
      } else {
        console.warn(`[excelUpload] 表 ${tableName} 行 ${rowIndex + 1}: 部分或全部配置的关键列在数据库中未找到，或未配置关键列，视为唯一行。`);
        results.insertedUnique++;
        statusToInsertForNewRow = null;
      }

      // --- 插入新行 ---
      const valuesToInsertForDB = [...excelRowValues, statusToInsertForNewRow]; 
      const dbColumnsForInsert = [...dbBusinessColumnNames, "status"];
      const placeholders = dbColumnsForInsert.map((_, i) => `$${i + 1}`).join(',');
      const insertSql = `INSERT INTO "${tableName}" (${dbColumnsForInsert.map(c => `"${c}"`).join(',')}) VALUES (${placeholders}) RETURNING *`;
      const { rows: insertedExcelRows } = await client.query(insertSql, valuesToInsertForDB);
     
      if (insertedExcelRows.length > 0) {
        const idx = results.affectedRowsForFrontend.findIndex(r => r.id === insertedExcelRows[0].id);
        if (idx > -1) results.affectedRowsForFrontend[idx] = insertedExcelRows[0];
        else results.affectedRowsForFrontend.push(insertedExcelRows[0]);
      }
    } 
    
    await client.query('COMMIT');
    if (tableName === 'dataasset_non_listed_companies') {
      triggerBankTableSync(`excelUpload for table ${tableName}`);
    }

    res.json({
      message: `导入完成。共处理 ${results.processedRows} 行Excel数据。...`,
      data: results.affectedRowsForFrontend,
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`❌ 文件导入失败 (${tableName}):`, err);
    res.status(500).json({ error: '导入操作失败', detail: err.message, stack: err.stack });
  } finally {
    client.release();
    fs.unlink(req.file.path, (unlinkErr) => {
      if (unlinkErr) console.error('删除临时上传文件失败:', unlinkErr);
    });
  }
});

module.exports = router;
