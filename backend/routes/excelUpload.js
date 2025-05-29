const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const db = require('../db/db');
const fs = require('fs');
const axios = require('axios');
const upload = multer({ dest: 'uploads/' });

// 清理列名函数
const sanitizeColumnName = (name) => {
  if (typeof name !== 'string') return '';
  return name.trim().replace(/\s+/g, '_').replace(/[\`\"\[\]\(\)]/g, '');
};
// 验证表名函数
const isValidTableName = (name) => /^[a-zA-Z0-9_]+$/.test(name);
// 定义每个表用于“部分重复”检查的关键列数量
const tableKeyColumnConfigs = {
  'dataasset_listed_companies_2024': {
    keyColumnCount: 5,
    description: "公司, 入表科目, 省份, 所属证券行业分布, 实控人"
  },
  'dataasset_non_listed_companies': {
    keyColumnCount: 5,
    description: "province_area, quarter_time, month_time, district_area, company_name"
  },
  'dataasset_finance_stock': {
    keyColumnCount: 4,
    description: "入股时间, 作价入股企业, 数据资产, 入股公司"
  },
  'dataasset_finance_other': {
    keyColumnCount: 6,
    description: "融资类型, 日期, 企业, 数据内容, 产品, 融资支持机构"
  }
};

// ✅ 修改点 1: 更新日期转换配置对象
// 定义哪些数据库列在从Excel导入时，如果遇到日期序列号，应转换为 'YYYY-MM' 格式文本
// 键名是数据库表名，值是一个对象，该对象的键是【数据库中的实际业务列名】，值为 true 表示需要转换。
const dateColumnsToFormatAsYYYYMM = {
  'dataasset_non_listed_companies': {
    'month_time': true
  },
  'dataasset_finance_stock': {
    '入股时间': true
  },
  'dataasset_finance_other': {
    '日期': true
  }
};

router.post('/append', upload.single('file'), async (req, res) => {
  const { tableName } = req.query;

  if (!req.file) { return res.status(400).json({ error: '未上传文件' }); }
  if (!tableName || !isValidTableName(tableName)) { return res.status(400).json({ error: '表名无效或未提供' }); }
  
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
      ORDER BY ordinal_position;
    `, [tableName]);

    if (dbColumnsRes.rows.length === 0) {
      await client.query('ROLLBACK'); fs.unlink(req.file.path, () => {});
      return res.status(404).json({ error: `表 ${tableName} 不存在或不包含业务列。`});
    }
    const dbBusinessColumnNames = dbColumnsRes.rows.map(r => r.column_name);

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) { await client.query('ROLLBACK'); fs.unlink(req.file.path, () => {}); return res.status(400).json({error: 'Excel工作表不存在'});}
    
    // 使用 { raw: true, defval: null } 来获取原始值，避免xlsx库自动格式化日期为JS Date对象（除非我们希望如此）
    // 但为了处理序列号，我们需要原始数字。如果cellDates:true能配合header:1工作则更好。
    // 为了稳定处理序列号，我们依赖原始数字。
    const rawSheetData = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });
    if (rawSheetData.length < 1) { await client.query('ROLLBACK'); fs.unlink(req.file.path, () => {}); return res.status(400).json({error: 'Excel表头为空'});}

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
        await client.query('ROLLBACK'); fs.unlink(req.file.path, () => {});
        return res.status(400).json({ error: `列数不匹配: Excel有效数据列 (${currentExcelColumnCount}) 多于数据库业务列 (${dbBusinessColumnNames.length})，且尾部多余列不为空。` });
      }
    }

    if (currentExcelColumnCount !== dbBusinessColumnNames.length) {
      await client.query('ROLLBACK'); fs.unlink(req.file.path, () => {});
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

    const keyDbColumnNamesForCheck = dbBusinessColumnNames.slice(0, currentTableKeysConfig.keyColumnCount);
    // ✅ 修改点 1.1: 获取当前表的日期列格式化配置
    const currentTableDateColumnFlags = dateColumnsToFormatAsYYYYMM[tableName] || {};


    console.log(`[excelUpload] 表 ${tableName}: 开始处理 ${excelDataRows.length} 行数据...`);
    console.log(`[excelUpload] 表 ${tableName}: 数据库业务列 (DB): `, dbBusinessColumnNames);
    console.log(`[excelUpload] 表 ${tableName}: 用于部分重复检查的DB键列: `, keyDbColumnNamesForCheck);
    console.log(`[excelUpload] 表 ${tableName}: 日期转换配置: `, currentTableDateColumnFlags);


    for (let rowIndex = 0; rowIndex < excelDataRows.length; rowIndex++) {
      const originalExcelRowArray = excelDataRows[rowIndex];
      results.processedRows++;

      const processedExcelRowValues = originalExcelRowArray.map((value, colIndex) => {
        let cellValue = (typeof value === 'string') ? value.trim() : value;
        const dbColName = dbBusinessColumnNames[colIndex]; // 获取此Excel列对应的数据库业务列名 (基于位置)
        
        // ✅ 修改点 2: 检查此列是否需要 'YYYY-MM' 日期转换
        if (currentTableDateColumnFlags[dbColName]) { // 值为 true 时表示需要转换
          let year, month;
          if (typeof cellValue === 'number' && cellValue > 1 && cellValue < 200000) { 
            try {
              const dateObj = xlsx.SSF.parse_date_code(cellValue);
              if (dateObj && typeof dateObj.y === 'number' && typeof dateObj.m === 'number') {
                year = dateObj.y;
                month = String(dateObj.m).padStart(2, '0');
              } else {
                 console.warn(`[excelUpload] 表: ${tableName}, 行 ${rowIndex + 1}, DB列 "${dbColName}", Excel原始值 "${value}", Trim后值 "${cellValue}": XLSX.SSF.parse_date_code未能解析。`);
              }
            } catch (e) {
              console.warn(`[excelUpload] 表: ${tableName}, 行 ${rowIndex + 1}, DB列 "${dbColName}", Excel原始值 "${value}", Trim后值 "${cellValue}": 日期序列号转换时出错。`, e);
            }
          } else if (cellValue instanceof Date && !isNaN(cellValue)) { 
             year = cellValue.getFullYear();
             month = String(cellValue.getMonth() + 1).padStart(2, '0');
          }
          
          if (year && month) {
            const formattedDate = `${year}-${month}`; // ✅ 格式化为 "YYYY-MM"
            console.log(`[excelUpload] 表: ${tableName}, 行 ${rowIndex + 1}, DB列 "${dbColName}", Excel原始值 "${value}", Trim后值 "${cellValue}" -> 转换为日期: ${formattedDate}`);
            return formattedDate;
          }
        }
        return cellValue; 
      });
      
      // 后续所有逻辑都使用 processedExcelRowValues
      const excelRowValues = processedExcelRowValues; 
      console.log(`[excelUpload] 处理Excel行 ${rowIndex + 1} (格式化后):`, excelRowValues);

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
        console.log(`[excelUpload] 行 ${rowIndex + 1}: 完全重复，已忽略。`);
        continue; 
      }

      // --- 部分重复检查 ---
      const keyMatchValuesForQuery = excelRowValues.slice(0, currentTableKeysConfig.keyColumnCount);
      const keyMatchConditionsForQuery = [];
      keyDbColumnNamesForCheck.forEach((keyDbCol, index) => {
        keyMatchConditionsForQuery.push(`"${keyDbCol}" IS NOT DISTINCT FROM $${index + 1}`);
      });
      
      let statusToInsertForNewRow = null; 
      const partialMatchQuery = `SELECT id, status FROM "${tableName}" WHERE ${keyMatchConditionsForQuery.join(' AND ')}`;
      const partialMatchResult = await client.query(partialMatchQuery, keyMatchValuesForQuery);

      if (partialMatchResult.rows.length > 0) { 
        statusToInsertForNewRow = 'repeat';
        results.insertedAsRepeat++;
        console.log(`[excelUpload] 行 ${rowIndex + 1}: 发现部分重复，新行状态将设为 'repeat'。`);
        for (const existingDbRow of partialMatchResult.rows) {
          if (existingDbRow.status !== 'delete') {
            if (existingDbRow.status !== 'repeat') { 
              const { rows: updatedRows } = await client.query(
                `UPDATE "${tableName}" SET status = 'repeat' WHERE id = $1 RETURNING *`, 
                [existingDbRow.id]
              );
              if (updatedRows.length > 0) {
                results.updatedToRepeat++;
                console.log(`[excelUpload] -- DB行 (ID: ${existingDbRow.id}) 状态已更新为 'repeat'。`);
                const idx = results.affectedRowsForFrontend.findIndex(r => r.id === updatedRows[0].id);
                if (idx > -1) results.affectedRowsForFrontend[idx] = updatedRows[0];
                else results.affectedRowsForFrontend.push(updatedRows[0]);
              }
            } else {
                console.log(`[excelUpload] -- DB行 (ID: ${existingDbRow.id}) 状态已经是 'repeat'。`);
                const idx = results.affectedRowsForFrontend.findIndex(r => r.id === existingDbRow.id);
                if (idx === -1) {
                    const { rows: currentRepeatRows } = await client.query(`SELECT * FROM "${tableName}" WHERE id = $1`, [existingDbRow.id]);
                    if (currentRepeatRows.length > 0) results.affectedRowsForFrontend.push(currentRepeatRows[0]);
                }
            }
          } else { 
            console.log(`[excelUpload] -- DB行 (ID: ${existingDbRow.id}) 状态是 'delete'，不更新。`);
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
        console.log(`[excelUpload] 行 ${rowIndex + 1}: 未发现部分重复，为唯一新行，状态将为 null。`);
      }

      // --- 插入新行 ---
      const valuesToInsertForDB = [...excelRowValues, statusToInsertForNewRow]; 
      const dbColumnsForInsert = [...dbBusinessColumnNames, "status"];
      const placeholders = dbColumnsForInsert.map((_, i) => `$${i + 1}`).join(',');
      const insertSql = `INSERT INTO "${tableName}" (${dbColumnsForInsert.map(c => `"${c}"`).join(',')}) VALUES (${placeholders}) RETURNING *`;
      const { rows: insertedExcelRows } = await client.query(insertSql, valuesToInsertForDB);
      console.log(`[excelUpload] 行 ${rowIndex + 1}: 已插入到数据库，获得ID: ${insertedExcelRows[0]?.id}, 状态: ${statusToInsertForNewRow}`);
      
      if (insertedExcelRows.length > 0) {
        const idx = results.affectedRowsForFrontend.findIndex(r => r.id === insertedExcelRows[0].id);
        if (idx > -1) results.affectedRowsForFrontend[idx] = insertedExcelRows[0];
        else results.affectedRowsForFrontend.push(insertedExcelRows[0]);
      }
    } // end of for loop

    if (tableName === 'dataasset_non_listed_companies') {
      // await axios.post('http://localhost:3000/api/financeupload/sync-bank-table');
      // console.log('✅ 自动同步 dataasset_finance_bank 表成功');
    }

    await client.query('COMMIT');
    console.log('[excelUpload] 事务已提交。');

    // ✅ 如果是 dataasset_non_listed_companies 表被更新了，则触发 dataasset_finance_bank 的同步
    if (tableName === 'dataasset_non_listed_companies') {
      console.log(`[excelUpload] 检测到 ${tableName} 更新，准备同步 dataasset_finance_bank...`);
      try {
        // 使用 axios 向自身应用的 /api/financeupload/sync-bank-table 发送请求
        // 确保这里的 URL 是您 financeBank.js 中 /sync-bank-table 接口的正确可访问路径
        // 端口号和域名可能需要根据您的部署环境调整，或者使用相对路径（如果axios实例配置了baseURL）
        // 为了简单起见，假设服务运行在 localhost:3000 (您需要替换为实际配置或环境变量)
        const syncResponse = await axios.post(`http://localhost:${process.env.PORT || 3000}/api/financeupload/sync-bank-table`);
        if (syncResponse.data && syncResponse.data.success) {
          console.log('[excelUpload] ✅ dataasset_finance_bank 同步成功 (由excel上传触发)。');
        } else {
          console.warn('[excelUpload] ⚠️ dataasset_finance_bank 同步请求已发送，但响应未明确成功:', syncResponse.data);
        }
      } catch (syncError) {
        console.error('❌ [excelUpload] 自动同步 dataasset_finance_bank 失败:', syncError.message);
        // 这里的错误不应该中断主上传操作的成功响应，但需要记录
      }
    }
    
    res.json({
      message: `导入完成。共处理 ${results.processedRows} 行Excel数据。新增唯一行: ${results.insertedUnique}, 新增并标记为重复: ${results.insertedAsRepeat}, 更新已有数据为重复: ${results.updatedToRepeat}, 忽略完全重复行: ${results.ignoredFullDuplicate}.`,
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
