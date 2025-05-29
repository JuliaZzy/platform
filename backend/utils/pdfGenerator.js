const fs = require('fs');
const path = require('path');
const Pdfmake = require('pdfmake');

let FONT_DESCRIPTORS = null; // 使用 null 初始化，表示尚未加载

/**
 * @description: 加载并配置 PDFMake 所需的字体。
 * @returns {object|null} - 返回字体描述对象，如果加载失败则返回 null。
 */
function loadFonts() {
    if (FONT_DESCRIPTORS !== null) {
        return FONT_DESCRIPTORS; // 如果已加载，直接返回
    }

    console.log("Initializing PDF fonts...");
    try {
        const vfsFontsModule = require('pdfmake/build/vfs_fonts.js');
        let vfsObject = (vfsFontsModule && vfsFontsModule.pdfMake && vfsFontsModule.pdfMake.vfs) || 
                        (typeof vfsFontsModule === 'object' && vfsFontsModule['Roboto-Regular.ttf'] ? vfsFontsModule : null);

        // ▼▼▼ 确保这里的路径相对于您项目中的 pdfGenerator.js 文件是正确的 ▼▼▼
        const customFontPathNormal = path.join(__dirname, '..', '..', 'fonts', 'NotoSansHans-Regular.otf');
        const customFontPathBold = path.join(__dirname, '..', '..', 'fonts', 'NotoSansHans-Bold.otf');

        const descriptors = { Roboto: {}, MyChineseFont: { normal: null, bold: null } };

        if (vfsObject) {
            if (vfsObject['Roboto-Regular.ttf']) descriptors.Roboto.normal = Buffer.from(vfsObject['Roboto-Regular.ttf'], 'base64');
            if (vfsObject['Roboto-Medium.ttf']) descriptors.Roboto.bold = Buffer.from(vfsObject['Roboto-Medium.ttf'], 'base64');
            if (vfsObject['Roboto-Italic.ttf']) descriptors.Roboto.italics = Buffer.from(vfsObject['Roboto-Italic.ttf'], 'base64');
            if (vfsObject['Roboto-MediumItalic.ttf']) descriptors.Roboto.bolditalics = Buffer.from(vfsObject['Roboto-MediumItalic.ttf'], 'base64');
            Object.keys(descriptors.Roboto).forEach(key => descriptors.Roboto[key] === undefined && delete descriptors.Roboto[key]);
            if (Object.keys(descriptors.Roboto).length === 0) delete descriptors.Roboto;
        } else { 
            console.warn("pdfmake/build/vfs_fonts.js not loaded, Roboto font may be unavailable."); 
            delete descriptors.Roboto;
        }

        if (fs.existsSync(customFontPathNormal)) {
            descriptors.MyChineseFont.normal = fs.readFileSync(customFontPathNormal);
        } else {
            console.error(`ERROR: Normal Chinese font not found! Path: ${customFontPathNormal}`);
            descriptors.MyChineseFont.normal = descriptors.Roboto?.normal; // 尝试回退
        }

        if (fs.existsSync(customFontPathBold)) {
            descriptors.MyChineseFont.bold = fs.readFileSync(customFontPathBold);
        } else {
            console.warn(`WARNING: Bold Chinese font not found: ${customFontPathBold}. Using normal.`);
            descriptors.MyChineseFont.bold = descriptors.MyChineseFont.normal; // 回退
        }

        if (!descriptors.MyChineseFont.normal) {
            console.error("CRITICAL: Chinese font failed to load. PDF export will likely fail.");
            delete descriptors.MyChineseFont;
        }

        // 检查是否至少有一种字体加载成功
        if (!descriptors.Roboto && !descriptors.MyChineseFont) {
            console.error("CRITICAL: No fonts loaded! PDF export will fail.");
            return null;
        }
        
        FONT_DESCRIPTORS = descriptors; // 缓存加载结果
        console.log("PDF fonts initialized successfully.");
        return FONT_DESCRIPTORS;

    } catch (err) {
        console.error("CRITICAL: Error initializing PDF fonts:", err);
        FONT_DESCRIPTORS = {}; // 设置为空对象以防止重复尝试
        return null;
    }
}

/**
 * @description: 生成 PDF 文档的数据流。
 * @param {object} options - PDF 生成选项。
 * @param {string} options.title - PDF 标题。
 * @param {Array<Array<object|string>>} options.tableBody - 表格内容 (包含表头)。
 * @param {Array<string|number>} options.tableWidths - 表格列宽。
 * @param {string} [options.orientation='landscape'] - 页面方向 ('portrait' 或 'landscape')。
 * @param {string} [options.watermarkText='高金智库数据资产研究课题组'] - 水印文字。
 * @returns {PdfKit.PDFDocument|null} - 返回 PdfKit 文档对象，如果字体加载失败则返回 null。
 */
function createPdfDocument({ 
    title, 
    tableBody, 
    tableWidths, 
    orientation = 'landscape', 
    watermarkText = '高金智库数据资产研究课题组' 
}) {
    const fonts = loadFonts();
    if (!fonts || (!fonts.MyChineseFont && !fonts.Roboto)) {
        console.error("Cannot create PDF document due to missing fonts.");
        return null;
    }

    const printer = new Pdfmake(fonts);

    const documentDefinition = {
        defaultStyle: { font: fonts.MyChineseFont ? 'MyChineseFont' : 'Roboto', fontSize: 8 },
        pageOrientation: orientation,
        pageMargins: [40, 40, 40, 40],
        content: [
            { text: title, style: 'header' },
            {
                table: {
                    headerRows: 1,
                    widths: tableWidths,
                    body: tableBody
                },
                layout: 'lightHorizontalLines'
            }
        ],
        background: function(currentPage, pageSize) {
            return {
                text: watermarkText, color: 'gray', opacity: 0.2, bold: true,
                fontSize: 45, angle: -45, alignment: 'center',
                absolutePosition: { y: pageSize.height / 2 }
            };
        },
        styles: {
            header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10], alignment: 'center' },
            tableHeader: {
                bold: true, fontSize: 9, fillColor: '#eeeeee',
                alignment: 'center', margin: [0, 2, 0, 2]
                // 字体将在 defaultStyle 中设置，但如果需要可以覆盖
            }
        }
    };

    return printer.createPdfKitDocument(documentDefinition);
}

module.exports = {
    createPdfDocument
};