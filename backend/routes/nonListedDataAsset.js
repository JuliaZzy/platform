const express = require('express');
const router = express.Router();
const db = require('../db/db'); // 确保路径正确
const {
  buildWhereClause, // 期望这是增加了 mode 参数的版本
  handleSearch      // 如果此文件也需要搜索功能
} = require('../utils/buildQueryHandlers'); // 确保路径正确

const fs = require('fs');
const path = require('path');
const Pdfmake = require('pdfmake');

// --- 全局 PDFMake 字体及VFS配置 ---
// (这整块字体配置代码与 lassetRoutes.js 中的应保持一致或提取为共享模块)
let FONT_DESCRIPTORS; 
try {
  const vfsFontsModule = require('pdfmake/build/vfs_fonts.js');
  let vfsObject = null;
  if (vfsFontsModule && vfsFontsModule.pdfMake && vfsFontsModule.pdfMake.vfs) {
    vfsObject = vfsFontsModule.pdfMake.vfs;
  } else if (typeof vfsFontsModule === 'object' && vfsFontsModule['Roboto-Regular.ttf']) {
    vfsObject = vfsFontsModule;
  }

  // ▼▼▼ 重要：根据你的项目结构修改这里的字体文件路径 ▼▼▼
  const customFontPathNormal = path.join(__dirname, '..', '..', 'fonts', 'NotoSansHans-Regular.otf'); 
  const customFontPathBold = path.join(__dirname, '..', '..', 'fonts', 'NotoSansHans-Bold.otf');   

  FONT_DESCRIPTORS = { Roboto: {}, MyChineseFont: { normal: null, bold: null } };
  if (vfsObject) {
    if (vfsObject['Roboto-Regular.ttf']) FONT_DESCRIPTORS.Roboto.normal = Buffer.from(vfsObject['Roboto-Regular.ttf'], 'base64');
    if (vfsObject['Roboto-Medium.ttf']) FONT_DESCRIPTORS.Roboto.bold = Buffer.from(vfsObject['Roboto-Medium.ttf'], 'base64');
    if (vfsObject['Roboto-Italic.ttf']) FONT_DESCRIPTORS.Roboto.italics = Buffer.from(vfsObject['Roboto-Italic.ttf'], 'base64');
    if (vfsObject['Roboto-MediumItalic.ttf']) FONT_DESCRIPTORS.Roboto.bolditalics = Buffer.from(vfsObject['Roboto-MediumItalic.ttf'], 'base64');
    Object.keys(FONT_DESCRIPTORS.Roboto).forEach(key => FONT_DESCRIPTORS.Roboto[key] === undefined && delete FONT_DESCRIPTORS.Roboto[key]);
    if (Object.keys(FONT_DESCRIPTORS.Roboto).length === 0) delete FONT_DESCRIPTORS.Roboto;
  } else { console.warn("pdfmake/build/vfs_fonts.js 加载异常，Roboto字体可能无法使用。"); delete FONT_DESCRIPTORS.Roboto; }

  if (fs.existsSync(customFontPathNormal)) { FONT_DESCRIPTORS.MyChineseFont.normal = fs.readFileSync(customFontPathNormal); } 
  else { console.error(`错误：常规中文字体文件未找到! 路径: ${customFontPathNormal}`); }
  if (fs.existsSync(customFontPathBold)) { FONT_DESCRIPTORS.MyChineseFont.bold = fs.readFileSync(customFontPathBold); } 
  else { console.warn(`警告：粗体中文字体文件未找到: ${customFontPathBold}。将使用常规体。`); FONT_DESCRIPTORS.MyChineseFont.bold = FONT_DESCRIPTORS.MyChineseFont.normal; }
  if (!FONT_DESCRIPTORS.MyChineseFont.normal) { console.error("CRITICAL: 中文字体未能加载，PDF导出（中文内容）将失败。"); }
} catch (err) { console.error("CRITICAL: 初始化PDF字体配置时发生严重错误:", err); FONT_DESCRIPTORS = FONT_DESCRIPTORS || {}; }
// --- 字体配置结束 ---


const tableName = 'dataasset_non_listed_companies';
const enableHideFlag = true;

// ✅ 1. 模糊搜索公司名称
router.get('/search/company', handleSearch(db, tableName, 'company_name', enableHideFlag));

// ✅ 2. 模糊搜索数据资产内容
router.get('/search/content', handleSearch(db, tableName, 'dataasset_content', enableHideFlag));

// ✅ 3. 导出 PDF 文件
router.post('/export', async (req, res) => { // 保持路由为 /export
  try {
    if (!FONT_DESCRIPTORS || (!FONT_DESCRIPTORS.Roboto && !FONT_DESCRIPTORS.MyChineseFont) || !FONT_DESCRIPTORS.MyChineseFont?.normal) {
        console.error('PDF导出因字体未正确初始化而被中止 (非上市公司)。');
        return res.status(500).json({ error: '导出PDF失败: 服务器字体配置不完整。' });
    }

    const filters = req.body.filters || {}; // 获取前端传递的筛选条件
    const values = [];
    // 使用 'non-listed' mode 
    const whereClause = buildWhereClause(filters, values, enableHideFlag, 'non-listed'); 

    // 1. SQL 查询语句 (来自你原有的 handleExport 函数)
    const sql = `
      SELECT month_time, province_area, company_name, dataasset_content,
             accounting_subject, valuation_method, book_value, assess_value,
             dataasset_register_addr
      FROM ${tableName} ${whereClause}
    `; // 使用正确的表名
    const result = await db.query(sql, values);
    const rows = result.rows;

    if (!rows.length) {
      return res.status(404).send('没有符合当前筛选条件的数据可导出');
    }

    // 2. 中文列名映射和顺序 (来自你原有的 handleExport 函数)
    const columnMap = {
      month_time: '入表月份',
      province_area: '省级行政区',
      company_name: '入表企业',
      dataasset_content: '数据资产内容',
      accounting_subject: '入表会计科目',
      valuation_method: '评估方法',
      book_value: '账面金额（万元）',
      assess_value: '评估金额（万元）',
      dataasset_register_addr: '数据资产登记机构'
    };
    // orderedDbKeys 决定了PDF中列的顺序和要从row中取哪些数据
    const orderedDbKeys = Object.keys(columnMap); 

    // PDF 表头使用映射后的中文名
    const pdfTableHeaders = orderedDbKeys.map(dbKey => ({ text: columnMap[dbKey], style: 'tableHeader' }));

    // PDF 表格内容
    const pdfTableBody = [
      pdfTableHeaders,
      ...rows.map(row => orderedDbKeys.map(dbKey => {
        let originalValue = row[dbKey]; // 使用原始数据库键名从行数据中取值
        let cellText = originalValue !== null && originalValue !== undefined ? String(originalValue) : '';
        let cellProperties = { text: cellText, margin: [0, 2, 0, 2] };

        // 对特定列进行格式化 (例如：金额列右对齐，并格式化数字)
        if (dbKey === 'book_value' || dbKey === 'assess_value') {
          const num = parseFloat(originalValue);
          if (!isNaN(num)) {
            cellProperties.text = num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          } else {
            cellProperties.text = (String(originalValue).trim() === '') ? '-' : String(originalValue);
          }
          cellProperties.alignment = 'right';
        }
        // 你可以根据非上市公司数据的其他列，在这里添加更多的 else if (dbKey === 'xxx') 来进行格式化

        return cellProperties;
      }))
    ];
    
    // 3. PDF 列宽 (所有列暂时设为 'auto')
    const tableWidths = [];
    const numPdfColumns = orderedDbKeys.length; // 这应该是9，基于你的columnMap

    if (numPdfColumns === 9) { // 严格按照9列来设置宽度
      tableWidths.push('auto'); // 第1列: month_time
      tableWidths.push('auto'); // 第2列: province_area
      tableWidths.push(130);    // 第3列: company_name
      tableWidths.push(130);    // 第4列: dataasset_content
      tableWidths.push(40);     // 第5列: accounting_subject
      tableWidths.push(50);     // 第6列: valuation_method
      tableWidths.push(50);     // 第7列: book_value
      tableWidths.push(50);     // 第8列: assess_value
      tableWidths.push(130);    // 第9列 (最后一列): dataasset_register_addr
    } else {
      // 如果列数不是预期的9列，提供一个备选方案，例如所有列自动或平分
      console.warn(`PDF Export (Non-Listed): Expected 9 columns for width setup, but got ${numPdfColumns}. Defaulting all to 'auto'.`);
      for (let i = 0; i < numPdfColumns; i++) {
        tableWidths.push('auto');
      }
    }

    const printer = new Pdfmake(FONT_DESCRIPTORS); 

    const documentDefinition = {
      defaultStyle: { font: 'MyChineseFont', fontSize: 8 }, 
      pageOrientation: 'landscape', // 横向页面
      pageMargins: [ 20, 30, 20, 30 ], // 左右边距20，上下边距30
      content: [
        { text: `非上市公司数据资产报告`, style: 'header' }, // 修改报告标题
        {
          table: {
            headerRows: 1,
            widths: tableWidths, 
            body: pdfTableBody
          },
          layout: 'lightHorizontalLines'
        }
      ],
      background: function(currentPage, pageSize) { /* 水印配置，与上市公司PDF一致 */
        return { text: '上海高级金融学院', color: 'gray', opacity: 0.2, bold: true, fontSize: 50, angle: -45, alignment: 'center', absolutePosition: { x: pageSize.width / 2, y: pageSize.height / 2 } };
      },
      styles: {
        header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10], alignment: 'center' },
        tableHeader: { bold: true, fontSize: 9, fillColor: '#eeeeee', alignment: 'center', font: 'MyChineseFont', margin: [0, 2, 0, 2] }
      }
    };

    const pdfDoc = printer.createPdfKitDocument(documentDefinition);
    const filename = `非上市公司数据报告_${Date.now()}.pdf`; 
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`); 
    pdfDoc.pipe(res);
    pdfDoc.end();

  } catch (err) {
    console.error('❌ PDF 导出失败 (/api/nlasset/export):', err.message, err.stack);
    res.status(500).json({ error: '导出PDF失败(非上市): 服务端错误 - ' + err.message });
  }
});

// ✅ 4. 合并图表 + 表格 + 筛选项的 summary 接口
router.post('/summary', async (req, res) => {
  const filters = req.body.filters || {};
  const page = req.body.page || 1;
  const pageSize = req.body.pageSize || 10;
  const offset = (page - 1) * pageSize;
  const values = [];

  const whereClause = buildWhereClause(filters, values, enableHideFlag);

  try {
    // 📊 图表字段
    const chartFields = [
      'province_area',
      'company_business_type',
      'company_type',
      'admin_level',
      'dataasset_type',
      'dataasset_register_addrtype'
    ];

    // 📊 图表统计（并行执行）
    const chartData = {};
    await Promise.all(chartFields.map(async field => {
      const chartSql = `
        SELECT ${field} AS name, COUNT(*) AS value
        FROM ${tableName}
        ${whereClause}
        GROUP BY ${field}
        ORDER BY value DESC
      `;
      const result = await db.query(chartSql, values);
      chartData[field] = result.rows;
    }));

    // 📋 表格分页
    const countSql = `SELECT COUNT(*) FROM ${tableName} ${whereClause}`;
    const countRes = await db.query(countSql, values);
    const total = parseInt(countRes.rows[0].count, 10);

    const dataSql = `
      SELECT month_time, province_area, company_name, dataasset_content,
             accounting_subject, valuation_method, book_value, assess_value,
             dataasset_register_addr
      FROM ${tableName}
      ${whereClause}
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;
    const tableRes = await db.query(dataSql, [...values, pageSize, offset]);

    // 🎯 静态筛选项（可提速）
    const staticWhere = enableHideFlag ? `WHERE hide_flag NOT LIKE '%是%'` : '';
    const [opt1Res, opt2Res] = await Promise.all([
      db.query(`SELECT DISTINCT month_time FROM ${tableName} ${staticWhere} ORDER BY month_time`),
      db.query(`SELECT DISTINCT province_area FROM ${tableName} ${staticWhere} ORDER BY province_area`)
    ]);

    res.json({
      charts: chartData,
      table: { rows: tableRes.rows, total },
      options: {
        month_time: opt1Res.rows.map(r => r.month_time),
        province_area: opt2Res.rows.map(r => r.province_area)
      }
    });

  } catch (err) {
    console.error('❌ summary 接口失败:', err);
    res.status(500).json({ error: '加载 summary 数据失败' });
  }
});

module.exports = router;
