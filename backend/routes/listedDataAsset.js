const express = require('express');
const router = express.Router();
const db = require('../db/db'); // 确保路径正确
const {
  buildWhereClause, // 期望这是增加了 mode 参数的版本
  handleSearch      // 从 buildQueryHandlers.js 导入
} = require('../utils/buildQueryHandlers'); // 确保路径正确

const fs = require('fs');
const path = require('path');
const Pdfmake = require('pdfmake'); // Pdfmake 构造函数

// --- 全局 PDFMake 字体及VFS配置 ---
let FONT_DESCRIPTORS; // 将用于 new Pdfmake(FONT_DESCRIPTORS)

try {
  // 1. 加载 pdfmake 自带的 vfs_fonts (主要为了 Roboto)
  const vfsFontsModule = require('pdfmake/build/vfs_fonts.js');
  let vfsObject = null;
  if (vfsFontsModule && vfsFontsModule.pdfMake && vfsFontsModule.pdfMake.vfs) {
    vfsObject = vfsFontsModule.pdfMake.vfs;
  } else if (typeof vfsFontsModule === 'object' && vfsFontsModule['Roboto-Regular.ttf']) {
    vfsObject = vfsFontsModule; // 有些打包方式可能直接导出vfs对象
  }

  // 2. 定义你的中文字体文件路径 (用户必须根据实际情况修改!)
  // 假设此路由文件在 /backend/routes/，字体在 /fonts/
  const customFontPathNormal = path.join(__dirname, '..', '..', 'fonts', 'NotoSansHans-Regular.otf'); // 请替换为你实际的常规中文字体文件名和路径
  const customFontPathBold = path.join(__dirname, '..', '..', 'fonts', 'NotoSansHans-Bold.otf');     // 请替换为你实际的粗体中文字体文件名和路径

  // 3. 构建字体描述对象，所有字体数据都将作为 Buffer
  FONT_DESCRIPTORS = {
    Roboto: {}, // 会从 vfsObject 填充
    MyChineseFont: { // 你的中文字体逻辑名
      normal: null,
      bold: null
    }
  };

  if (vfsObject) {
    if (vfsObject['Roboto-Regular.ttf']) FONT_DESCRIPTORS.Roboto.normal = Buffer.from(vfsObject['Roboto-Regular.ttf'], 'base64');
    if (vfsObject['Roboto-Medium.ttf']) FONT_DESCRIPTORS.Roboto.bold = Buffer.from(vfsObject['Roboto-Medium.ttf'], 'base64');
    if (vfsObject['Roboto-Italic.ttf']) FONT_DESCRIPTORS.Roboto.italics = Buffer.from(vfsObject['Roboto-Italic.ttf'], 'base64');
    if (vfsObject['Roboto-MediumItalic.ttf']) FONT_DESCRIPTORS.Roboto.bolditalics = Buffer.from(vfsObject['Roboto-MediumItalic.ttf'], 'base64');
    Object.keys(FONT_DESCRIPTORS.Roboto).forEach(key => FONT_DESCRIPTORS.Roboto[key] === undefined && delete FONT_DESCRIPTORS.Roboto[key]);
    if (Object.keys(FONT_DESCRIPTORS.Roboto).length === 0) delete FONT_DESCRIPTORS.Roboto;
  } else {
    console.warn("pdfmake/build/vfs_fonts.js 加载异常，Roboto字体可能无法使用。");
    delete FONT_DESCRIPTORS.Roboto;
  }

  if (fs.existsSync(customFontPathNormal)) {
    FONT_DESCRIPTORS.MyChineseFont.normal = fs.readFileSync(customFontPathNormal);
  } else {
    console.error(`错误：常规中文字体文件未找到! 路径: ${customFontPathNormal}`);
    // 如果没有中文字体，PDF会失败，这里可以选择不删除 MyChineseFont，让错误在生成时抛出
    // 或者 FONT_DESCRIPTORS.MyChineseFont = undefined; (或 FONT_DESCRIPTORS.MyChineseFont.normal = FONT_DESCRIPTORS.Roboto?.normal; // 回退到Roboto)
  }
  if (fs.existsSync(customFontPathBold)) {
    FONT_DESCRIPTORS.MyChineseFont.bold = fs.readFileSync(customFontPathBold);
  } else {
    console.warn(`警告：粗体中文字体文件未找到: ${customFontPathBold}。将使用常规体作为粗体。`);
    FONT_DESCRIPTORS.MyChineseFont.bold = FONT_DESCRIPTORS.MyChineseFont.normal; // 回退
  }
  // 如果 MyChineseFont.normal 最终还是 null (因为文件没找到且没设置回退), pdfmake会报错
  if (!FONT_DESCRIPTORS.MyChineseFont.normal) {
      console.error("CRITICAL: 中文字体未能加载，PDF导出（中文内容）将失败。");
      // 可以考虑完全移除 MyChineseFont 以便 pdfmake 用 Roboto 回退（如果 Roboto 加载成功）
      // delete FONT_DESCRIPTORS.MyChineseFont;
  }

} catch (err) {
  console.error("CRITICAL: 初始化PDF字体配置时发生严重错误:", err);
  // 如果字体加载失败，则 FONT_DESCRIPTORS 可能不完整或为空
  // PDF导出功能基本会失效
  FONT_DESCRIPTORS = FONT_DESCRIPTORS || {}; // 保证 FONT_DESCRIPTORS 是对象
}
// --- 字体配置结束 ---


const tableName = 'dataasset_listed_companies_2024';
const enableHideFlag = false;

router.get('/search/company', handleSearch(db, tableName, '公司', enableHideFlag));
router.get('/search/content', handleSearch(db, tableName, '所属证券行业分布', enableHideFlag));

router.post('/export', async (req, res) => {
  try {
    if (!FONT_DESCRIPTORS || (!FONT_DESCRIPTORS.Roboto && !FONT_DESCRIPTORS.MyChineseFont) || !FONT_DESCRIPTORS.MyChineseFont?.normal) {
        console.error('PDF导出因字体未正确初始化而被中止。');
        return res.status(500).json({ error: '导出PDF失败: 服务器字体配置不完整。' });
    }

    const filters = req.body.filters || {};
    
    if (!filters.quarter || !['Q1', 'Q2', 'Q3', 'Q4'].includes(filters.quarter)) {
      return res.status(400).json({ error: '必须选择且只能导出 Q1, Q2, Q3, 或 Q4 的季度数据' });
    }

    const exportValues = [filters.quarter];
    const exportWhereClause = `WHERE "报告时间" = $1`; 
    
    const sql = `SELECT * FROM ${tableName} ${exportWhereClause}`;
    const result = await db.query(sql, exportValues);
    const rows = result.rows;

    if (!rows.length) {
      return res.status(404).send('该季度没有符合条件的数据可导出');
    }

    const allOriginalColumnKeys = Object.keys(rows[0]); 
    const columnKeysToExport = allOriginalColumnKeys.filter(key => key !== "报告时间");
    const numExportColumns = columnKeysToExport.length; 

    if (numExportColumns === 0 && rows.length > 0) { // 如果过滤后没有列了（不太可能，除非只有报告时间列）
        return res.status(400).send('没有可导出的数据列（“报告时间”列已被排除）。');
    }
    if (numExportColumns === 0 && rows.length === 0) { // 双重保险
        return res.status(404).send('该季度没有符合条件的数据可导出');
    }


    // ▼▼▼ tableWidths 的声明和赋值（确保只有一次）▼▼▼
    const NARROW_COLUMN_FIXED_WIDTH = 52; // 你设置的较窄列宽度
    // 找出原始数据中第4列的实际键名 (这个键名是基于 allOriginalColumnKeys 的)
    const originalFourthColumnKey = allOriginalColumnKeys.length >= 4 ? allOriginalColumnKeys[3] : null;

    let tableWidths = columnKeysToExport.map(currentKey => { // 改为 let，因为下面可能修改它
      if (currentKey === originalFourthColumnKey && originalFourthColumnKey !== null) { // 确保 originalFourthColumnKey 不是 "报告时间"
        return '*'; 
      }
      return NARROW_COLUMN_FIXED_WIDTH; 
    });

    // 安全措施：确保至少有一个 '*' 列
    if (numExportColumns > 0 && !tableWidths.includes('*')) {
      // 如果没有 '*' 列 (例如原第4列是“报告时间”或不存在)，则将新列集中的一个设为 '*'
      // 优先考虑新的第4列（如果存在），否则最后一列
      if (numExportColumns >= 4 && tableWidths[3] !== undefined) { // 检查新的第4列是否存在
          tableWidths[3] = '*';
      } else {
          tableWidths[tableWidths.length - 1] = '*';
      }
    }
    
    // 2. 重新生成 pdfTableHeaders 使用过滤后的列名
    const pdfTableHeaders = columnKeysToExport.map(key => ({ text: key, style: 'tableHeader' }));

    // 3. 重新生成 pdfTableBody 使用过滤后的列名
    const pdfTableBody = [
      pdfTableHeaders, 
      ...rows.map(row => columnKeysToExport.map((key, colIndex) => { // colIndex 现在是新列集合中的索引
        let originalValue = row[key]; // 从原始row数据中按key取值
        let cellPresentation = { 
            text: originalValue !== null && originalValue !== undefined ? String(originalValue) : '',
            margin: [0, 2, 0, 2] 
        };

        // 重要：这里的 oneBasedColIndex 是基于 columnKeysToExport (剔除"报告时间"后) 的新顺序和索引
        // 你之前的列格式化逻辑是基于原始列的顺序和索引。
        // 如果 "报告时间" 是最后一列，那么删除它不会影响前面列的索引。
        // 我们假设你的列格式化逻辑 (6,7,8,9,10,11列) 仍然基于它们在剔除"报告时间"之前的原始位置。
        // 为此，我们需要找到当前 key 在 allOriginalColumnKeys 中的原始索引。
        
        const originalColIndex = allOriginalColumnKeys.indexOf(key); // 获取当前key在原始列中的索引 (0-based)
        const oneBasedOriginalColIndex = originalColIndex + 1; // 转换为1-based，用于匹配你的逻辑

        if ([6, 7, 9, 10, 11].includes(oneBasedOriginalColIndex)) { // 数字列 (按原始列号判断)
          const num = parseFloat(originalValue);
          if (!isNaN(num)) {
            cellPresentation.text = num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          } else {
            cellPresentation.text = (originalValue === null || originalValue === undefined || String(originalValue).trim() === '') ? '-' : String(originalValue);
          }
          cellPresentation.alignment = 'right';
        } else if (oneBasedOriginalColIndex === 8) { // 百分比列 (按原始列号判断)
          const num = parseFloat(originalValue);
          if (!isNaN(num)) {
            cellPresentation.text = (num * 100).toFixed(2) + '%';
          } else {
            cellPresentation.text = (originalValue === null || originalValue === undefined || String(originalValue).trim() === '') ? '-' : String(originalValue);
          }
          cellPresentation.alignment = 'right';
        }
        return cellPresentation;
      }))
    ];
    
    // 4. 重新生成 tableWidths (基于过滤后的列)
    // 确保在剔除列后，如果没有任何 '*' 列，则将一个合适的列（例如新的第4列，如果存在）设为 '*'
    if (!tableWidths.includes('*') && tableWidths.length > 0) {
        const starCandidateIndex = allOriginalColumnKeys.indexOf(columnKeysToExport.find(k => allOriginalColumnKeys.indexOf(k) + 1 === 4)); // 找到原第4列在新列集中的索引
        if (starCandidateIndex !== -1 && starCandidateIndex < tableWidths.length) {
            tableWidths[starCandidateIndex] = '*';
        } else if (tableWidths.length > 0) { // 如果原第4列被删了或找不到，则将新列集中的最后一列设为 '*' (或一个显眼的列)
            tableWidths[tableWidths.length -1] = '*';
        }
    }
    if (tableWidths.length === 0 && numExportColumns > 0) { // 如果所有列都落到else了，给个默认
        for(let i=0; i<numExportColumns; i++) tableWidths.push((i===0 || i < Math.floor(numExportColumns/2)) ? 'auto' : '*');
    }

    const printer = new Pdfmake(FONT_DESCRIPTORS); 

    const documentDefinition = {
      defaultStyle: { 
        font: 'MyChineseFont', 
        fontSize: 8
      }, 
      pageOrientation: 'landscape',
      pageMargins: [ 15, 30, 15, 30 ],
      content: [
        { text: `上市公司数据资产报告 - ${filters.quarter}`, style: 'header' },
        {
          table: {
            headerRows: 1,
            widths: tableWidths, 
            body: pdfTableBody
          },
          layout: 'lightHorizontalLines'
        }
      ],
      background: function(currentPage, pageSize) { 
        return {
          text: '上海高级金融学院',
          color: 'gray',
          opacity: 0.2,
          bold: true,
          fontSize: 50, 
          angle: -45,   
          absolutePosition: { 
            x: pageSize.width / 2, 
            y: pageSize.height / 2 
          }
        };
      },
      styles: {
        header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10], alignment: 'center' },
        tableHeader: { 
            bold: true, 
            fontSize: 9,
            fillColor: '#eeeeee', 
            alignment: 'center', 
            font: 'MyChineseFont',
            margin: [0, 2, 0, 2]
        }
      }
    };

    const pdfDoc = printer.createPdfKitDocument(documentDefinition);
    const filename = `上市公司数据报告_${filters.quarter}_${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`); 
    pdfDoc.pipe(res);
    pdfDoc.end();

  } catch (err) {
    console.error('❌ PDF 导出失败 (/api/lasset/export):', err.message, err.stack);
    res.status(500).json({ error: '导出PDF失败: 服务端错误 - ' + err.message });
  }
});

// 统一使用这个简化的 /summary 接口，只返回 options
router.post('/summary', async (req, res) => {
  try {
    const [reportRes, provinceRes] = await Promise.all([
      db.query(`SELECT DISTINCT "报告时间" AS value FROM ${tableName} WHERE "报告时间" IS NOT NULL AND "报告时间" <> '' ORDER BY "报告时间"`),
      db.query(`SELECT DISTINCT "省份" AS value FROM ${tableName} WHERE "省份" IS NOT NULL AND "省份" <> '' ORDER BY "省份"`)
    ]);

    res.json({
      options: {
        quarter: reportRes.rows.map(r => r.value),
        province_area: provinceRes.rows.map(r => r.value)
      }
    });
  } catch (err) {
    console.error('❌ /api/lasset/summary 接口获取选项失败:', err);
    res.status(500).json({ error: '加载筛选选项失败' });
  }
});

module.exports = router;