const express = require('express');
const router = express.Router();
const db = require('../../db/db');
const { handleSearch } = require('../../utils/buildQueryHandlers');
const { createPdfDocument } = require('../../utils/pdfGenerator');
const pdfFormatters = require('../../utils/pdfFormatters');
const tableMap = {
    bank: {
        name: 'dataasset_finance_bank',
        title: '数据资产增信银行贷款清单',
        pdfConfig: {
            map: {
                month_time: '入表月份',
                show_name: '入表企业',
                dataasset_content: '数据资产内容',
                finance_value: '融资金额（万元）',
                finance_type: '融资类型',
                finance_orgs: '融资机构'
            },
            // PDF 中列的顺序
            order: ['month_time', 'show_name', 'dataasset_content', 'finance_value', 'finance_type', 'finance_orgs'],
            // PDF 中列的宽度
            widths: [80, 'auto', 'auto', 100, 80, 'auto'],
            // PDF 中列的格式化规则
            rules: {
                month_time: (v) => pdfFormatters.alignCenter(pdfFormatters.formatYearMonth(v)),
                finance_value: (v) => pdfFormatters.alignRight(pdfFormatters.formatNumber(v)),
            }
        }
    },
    stock: {
        name: 'dataasset_finance_stock',
        title: '数据资产作价入股清单',
        pdfConfig: {
            map: {
                '入股时间': '入股时间',
                '作价入股企业': '作价入股企业',
                '数据资产': '数据资产',
                '入股公司': '入股公司',
                '融资金额（万元）': '融资金额（万元）',
                '股权占比': '股权占比',
                '注册资本（万元）': '注册资本（万元）'
            },
            order: ["入股时间", '作价入股企业', '数据资产', '入股公司', '融资金额（万元）', '股权占比', '注册资本（万元）'],
            widths: [70, 'auto', 'auto', 'auto', 80, 60, 80],
            rules: {
                "入股时间": (v) => pdfFormatters.alignCenter(pdfFormatters.formatYearMonth(v)),
                '融资金额（万元）': (v) => pdfFormatters.alignRight(pdfFormatters.formatNumber(v)),
                '注册资本（万元）': (v) => pdfFormatters.alignRight(pdfFormatters.formatNumber(v)),
                '股权占比': (v) => pdfFormatters.alignCenter(pdfFormatters.formatPercentage(v))
            }
        }
    },
    other: {
        name: 'dataasset_finance_other',
        title: '其他数据类融资清单',
        pdfConfig: {
            map: {
                '融资类型': '融资类型',
                '日期': '日期',
                '企业': '企业',
                '数据内容': '数据内容',
                '产品': '产品',
                '融资支持机构': '融资支持机构',
                '融资金额（万元）': '融资金额（万元）'
            },
            order: ['融资类型', '日期', '企业', '数据内容', '产品', '融资支持机构', '融资金额（万元）'],
            widths: [70, 60, 'auto', 'auto', 'auto', 'auto', 80],
            rules: {
                '日期': (v) => pdfFormatters.alignCenter(pdfFormatters.formatYearMonth(v)),
                '融资金额（万元）': (v) => {
                    if (String(v).trim() === '未披露') return pdfFormatters.alignRight('未披露');
                    return pdfFormatters.alignRight(pdfFormatters.formatNumber(v));
                }
            }
        }
    }
};

router.get('/search/company', handleSearch(db, tableMap.bank.name, 'company_name', false));
router.get('/search/content', handleSearch(db, tableMap.bank.name, 'dataasset_content', false));

Object.keys(tableMap).forEach(type => {
    router.get(`/data/${type}`, async (req, res) => {
        const currentTableInfo = tableMap[type];
        if (!currentTableInfo) return res.status(404).json({ error: 'Invalid data type' });

        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const offset = (page - 1) * pageSize;

        try {
            const countSql = `SELECT COUNT(*) FROM ${currentTableInfo.name} WHERE "status" IS DISTINCT FROM 'delete'`;
            const countResult = await db.query(countSql);
            const totalRows = parseInt(countResult.rows[0].count, 10);

            const dataSql = `SELECT * FROM ${currentTableInfo.name} WHERE "status" IS DISTINCT FROM 'delete' ORDER BY 1 LIMIT $1 OFFSET $2`;
            const dataResult = await db.query(dataSql, [pageSize, offset]);
            const formattedData = dataResult.rows.map(row => {
                const formattedRow = { ...row };
                const rules = currentTableInfo.pdfConfig.rules || {};
                for (const key in rules) {
                    if (formattedRow.hasOwnProperty(key)) {
                        const tempFormatted = rules[key](formattedRow[key]);
                        if (typeof tempFormatted === 'object' && tempFormatted.text) {
                            formattedRow[key] = tempFormatted.text;
                        } else if (typeof tempFormatted === 'string'){
                             formattedRow[key] = tempFormatted;
                        }
                    }
                }
                delete formattedRow.id;
                delete formattedRow.status;
                return formattedRow;
            });

            res.json({ success: true, data: formattedData, total: totalRows });
        } catch (err) {
            console.error(`❌ Error fetching ${currentTableInfo.name} data:`, err);
            res.status(500).json({ error: `Failed to load ${currentTableInfo.title} data`, details: err.message });
        }
    });
});

Object.keys(tableMap).forEach(type => {
    router.post(`/export/${type}`, async (req, res) => {
        const currentTableInfo = tableMap[type];
        if (!currentTableInfo || !currentTableInfo.pdfConfig) {
            return res.status(404).json({ error: 'Invalid export type or missing PDF configuration.' });
        }

        console.log(`Exporting PDF for: ${currentTableInfo.name}`);
        try {
            const sql = `SELECT * FROM "${currentTableInfo.name}" WHERE "status" IS DISTINCT FROM 'delete'`;
            const result = await db.query(sql);
            const rows = result.rows;

            if (!rows.length) {
                return res.status(404).send('No data available to export for this table.');
            }

            const { map, order, widths, rules } = currentTableInfo.pdfConfig;
            const pdfTableHeaders = order.map(key => ({
                text: map[key] || key,
                style: 'tableHeader'
            }));
            
            const tableBody = pdfFormatters.applyPdfFormatting(rows, order, rules);
            const pdfTableBody = [pdfTableHeaders, ...tableBody];
            const pdfDoc = createPdfDocument({
                title: currentTableInfo.title,
                tableBody: pdfTableBody,
                tableWidths: widths,
            });

            if (!pdfDoc) {
                return res.status(500).json({ error: 'PDF export failed: Server PDF generation configuration error.' });
            }

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

module.exports = router;