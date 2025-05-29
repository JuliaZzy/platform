const express = require('express');
const router = express.Router();
const db = require('../db/db'); // Ensure path is correct
const { handleSearch } = require('../utils/buildQueryHandlers'); // Keep handleSearch
const { createPdfDocument } = require('../utils/pdfGenerator'); // Import PDF generator

/**
 * 格式化数字，添加千位分隔符并保留两位小数。
 * @param {*} value - 需要格式化的值。
 * @returns {string} 格式化后的字符串或原始值。
 */

function formatNumberWithCommas(value) {
  // 检查是否是有效的数字
  const num = Number(value);
  if (value === null || value === undefined || String(value).trim() === '' || isNaN(num)) {
    return value; // 如果不是有效数字，返回原始值
  }
  
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * 格式化数字为百分比，保留两位小数。
 * @param {*} value - 需要格式化的值 (应为小数形式, e.g., 0.25)。
 * @returns {string} 格式化后的百分比字符串或原始值。
 */
function formatPercentage(value) {
  const num = Number(value);
  if (value === null || value === undefined || String(value).trim() === '' || isNaN(num)) {
    return value; 
  }

  return (num * 100).toFixed(0) + '%';
}

/**
 * 专门格式化 "其他数据类融资" 的融资金额。
 * @param {*} value - 需要格式化的值。
 * @returns {string} 格式化后的字符串或 "未披露"。
 */
function formatOtherFinanceValue(value) {
  if (String(value).trim() === '未披露') {
    return '未披露';
  }
  return formatNumberWithCommas(value);
}

// Define table names, titles, and specific configurations
const tableMap = {
    bank: {
        name: 'dataasset_finance_bank',
        title: '银行数据报告',
        // Column mapping and order for bank PDF
        pdfColumnConfig: {
            map: {
                month_time: '入表月份',
                show_name: '入表企业', // As per your requirement
                dataasset_content: '数据资产内容',
                finance_value: '融资金额（万元）',
                finance_type: '融资类型',
                finance_orgs: '融资机构'
            },
            order: ['month_time', 'show_name', 'dataasset_content', 'finance_value', 'finance_type', 'finance_orgs']
        }
    },
    stock: {
        name: 'dataasset_finance_stock',
        title: '证券数据报告'
    },
    other: {
        name: 'dataasset_finance_other',
        title: '其他金融数据报告'
    }
};

// --- Search routes (currently only for bank table, can be expanded) ---
const bankTableNameForSearch = tableMap.bank.name;
const enableHideFlagForSearch = false;
router.get('/search/company', handleSearch(db, bankTableNameForSearch, 'company_name', enableHideFlagForSearch)); // Assuming 'company_name' is the field for bank search
router.get('/search/content', handleSearch(db, bankTableNameForSearch, 'dataasset_content', enableHideFlagForSearch));
// --- Search routes end ---


// --- Data fetching endpoints with pagination (/data/:type) ---
Object.keys(tableMap).forEach(type => {
    router.get(`/data/${type}`, async (req, res) => {
        const currentTableInfo = tableMap[type];
        if (!currentTableInfo) {
            return res.status(404).json({ error: 'Invalid data type' });
        }

        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const offset = (page - 1) * pageSize;

        console.log(`Fetching data for: ${currentTableInfo.name}, page: ${page}, pageSize: ${pageSize}`);
        try {
            // Get total count
            const countSql = `SELECT COUNT(*) FROM ${currentTableInfo.name} WHERE "status" IS DISTINCT FROM 'delete'`;
            const countResult = await db.query(countSql);
            const totalRows = parseInt(countResult.rows[0].count, 10);

            // Fetch paginated data
            const dataSql = `SELECT * FROM ${currentTableInfo.name} WHERE "status" IS DISTINCT FROM 'delete' ORDER BY 1 LIMIT $1 OFFSET $2`;
            const dataResult = await db.query(dataSql, [pageSize, offset]);

            // 1. Filter out 'id' and 'status'
            const filteredData = dataResult.rows.map(row => {
                const { id, status, ...rest } = row;
                return rest;
            });

            // ✨ 2. Apply formatting based on 'type' ✨
            let formattedDataWithDisplay = filteredData; // Start with filtered data

            if (type === 'bank') {
                formattedDataWithDisplay = filteredData.map(row => ({
                    ...row,
                    // 确认 'bank' 表中融资金额列的真实列名 (假设是 'finance_value')
                    finance_value: formatNumberWithCommas(row.finance_value) 
                }));
            } else if (type === 'stock') {
                formattedDataWithDisplay = filteredData.map(row => ({
                    ...row,
                    '融资金额（万元）': formatNumberWithCommas(row['融资金额（万元）']), // 融资金额
                    '注册资本（万元）': formatNumberWithCommas(row['注册资本（万元）']), // 注册资本
                    '股权占比': formatPercentage(row['股权占比']) // 股权占比
                }));
            } else if (type === 'other') {
                 formattedDataWithDisplay = filteredData.map(row => ({
                    ...row,
                    // 确认 'other' 表中融资金额列的真实列名 (假设是 'finance_value')
                    '融资金额（万元）': formatOtherFinanceValue(row['融资金额（万元）'])
                }));
            }

            // 3. Send the fully processed data
            res.json({ success: true, data: formattedDataWithDisplay, total: totalRows }); 

        } catch (err) {
            console.error(`❌ Error fetching ${currentTableInfo.name} data:`, err);
            res.status(500).json({ error: `Failed to load ${currentTableInfo.title} data`, details: err.message });
        }
    });
});
// --- Data fetching endpoints end ---


// --- PDF export endpoints (/export/:type) ---
Object.keys(tableMap).forEach(type => {
    router.post(`/export/${type}`, async (req, res) => { // Changed to POST
        const currentTableInfo = tableMap[type];
        if (!currentTableInfo) {
            return res.status(404).json({ error: 'Invalid export type' });
        }

        console.log(`Exporting PDF for: ${currentTableInfo.name}`);
        try {
            // 1. Fetch all data for PDF export (no pagination)
            const sql = `SELECT * FROM ${currentTableInfo.name}`;
            const result = await db.query(sql);
            const rows = result.rows;

            if (!rows.length) {
                return res.status(404).send('No data available to export for this table.');
            }

            let pdfTableHeaders;
            let pdfTableBodyRows;
            let pdfColumnKeysOrder;

            // 2. Prepare PDF table data
            if (type === 'bank' && currentTableInfo.pdfColumnConfig) {
                // Use specific column config for bank table
                const config = currentTableInfo.pdfColumnConfig;
                pdfColumnKeysOrder = config.order;
                pdfTableHeaders = pdfColumnKeysOrder.map(key => ({
                    text: config.map[key] || key, // Use mapped name or original key if not in map
                    style: 'tableHeader'
                }));
                pdfTableBodyRows = rows.map(row => pdfColumnKeysOrder.map(key => {
                    const value = row[key];
                    return {
                        text: value !== null && value !== undefined ? String(value) : '',
                        margin: [0, 2, 0, 2]
                    };
                }));
            } else {
                // Dynamic columns for other tables
                pdfColumnKeysOrder = Object.keys(rows[0]);
                pdfTableHeaders = pdfColumnKeysOrder.map(key => ({ text: key, style: 'tableHeader' }));
                pdfTableBodyRows = rows.map(row => pdfColumnKeysOrder.map(key => {
                    const value = row[key];
                    return {
                        text: value !== null && value !== undefined ? String(value) : '',
                        margin: [0, 2, 0, 2]
                    };
                }));
            }

            const pdfTableBody = [pdfTableHeaders, ...pdfTableBodyRows];

            // 3. Prepare PDF table widths (all auto-fit or specific based on keys order length)
            const tableWidths = Array(pdfColumnKeysOrder.length).fill('*');

            // 4. Call generic PDF creation function
            const pdfDoc = createPdfDocument({
                title: currentTableInfo.title,
                tableBody: pdfTableBody,
                tableWidths: tableWidths,
            });

            if (!pdfDoc) {
                return res.status(500).json({ error: 'PDF export failed: Server PDF generation configuration error.' });
            }

            // 5. Send PDF
            const filename = `${currentTableInfo.title.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
            pdfDoc.pipe(res);
            pdfDoc.end();

        } catch (err) {
            console.error(`❌ PDF export failed for ${currentTableInfo.name}:`, err);
            res.status(500).json({ error: `Failed to export ${currentTableInfo.title} as PDF: Server error` });
        }
    });
});
// --- PDF export endpoints end ---

module.exports = router;