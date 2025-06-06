const express = require('express');
const router = express.Router();
const db = require('../../db/db');
const { handleSearch } = require('../../utils/buildQueryHandlers');
const { createPdfDocument } = require('../../utils/pdfGenerator');

// ✨ 1. 移除本地格式化函数，统一引入我们标准化的模块
const pdfFormatters = require('../../utils/pdfFormatters');

// ✨ 2. 增强 tableMap，使其成为包含所有配置的“单一数据源”
const tableMap = {
    bank: {
        name: 'dataasset_finance_bank',
        title: '数据资产增信银行贷款清单',
        // PDF 导出的完整配置
        pdfConfig: {
            // 列的数据库名 -> 显示名 的映射
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
                '日期': '日期', // 假设真实列名为'日期'
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

// --- Search routes (保持不变) ---
router.get('/search/company', handleSearch(db, tableMap.bank.name, 'company_name', false));
router.get('/search/content', handleSearch(db, tableMap.bank.name, 'dataasset_content', false));

// ✨ 3. 重构数据获取端点 (/data/:type)，使其更简洁
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
            
            // 为前端展示进行的简单格式化 (注意：这里只应用基础的文本格式化，而非PDF的样式对象)
            const formattedData = dataResult.rows.map(row => {
                const formattedRow = { ...row };
                const rules = currentTableInfo.pdfConfig.rules || {};
                for (const key in rules) {
                    if (formattedRow.hasOwnProperty(key)) {
                        // 这是一个简化的处理，只取格式化后的文本值
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

// ✨ 4. 重构PDF导出端点 (/export/:type)，采用统一逻辑
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

            // 生成表头
            const pdfTableHeaders = order.map(key => ({
                text: map[key] || key,
                style: 'tableHeader'
            }));
            
            // 使用我们的格式化引擎生成表格主体
            const tableBody = pdfFormatters.applyPdfFormatting(rows, order, rules);

            const pdfTableBody = [pdfTableHeaders, ...tableBody];

            // 创建并发送PDF
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