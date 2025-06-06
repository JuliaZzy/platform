/**
 * @file Backend PDF formatting utilities.
 * Contains core formatting functions and an engine to apply them.
 */

// ====================================================================
// Part 1: Core Formatting "Tools"
// ====================================================================

// ✨ 在这里新增一个函数 ✨
/**
 * Formats a "YYYY-MM" string to "YYYY年MM月".
 * @param {string} yyyy_mm_string The date string to format.
 * @returns {string} The formatted date string, or an empty string for invalid input.
 */
function formatYearMonth(yyyy_mm_string) {
    if (!yyyy_mm_string || typeof yyyy_mm_string !== 'string') {
        return ''; // Handle null, undefined, or non-string inputs
    }
    const parts = yyyy_mm_string.split('-');
    if (parts.length === 2 && parts[0].length === 4) {
        return `${parts[0]}年${parts[1]}月`;
    }
    return yyyy_mm_string; // Return original string if format is unexpected
}


/**
 * Formats a number with thousand separators and fixed decimal places.
 * @param {number|string} value The value to format.
 * @param {number} [decimalPlaces=2] The number of decimal places to keep.
 * @returns {string} The formatted number string, or '-' for invalid input.
 */
function formatNumber(value, decimalPlaces = 2) {
    if (value === null || value === undefined || String(value).trim() === '') {
        return '-';
    }
    const num = parseFloat(String(value).replace(/,/g, ''));
    if (isNaN(num)) {
        return String(value);
    }
    return num.toLocaleString('en-US', {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
    });
}

/**
 * Formats a number as a percentage string.
 * @param {number|string} value The value to format (e.g., 0.123).
 * @param {number} [decimalPlaces=1] The number of decimal places to keep.
 * @returns {string} The formatted percentage string (e.g., "12.3%"), or '-' for invalid input.
 */
function formatPercentage(value, decimalPlaces = 1) {
    if (value === null || value === undefined || String(value).trim() === '') {
        return '-';
    }
    const num = parseFloat(String(value).replace(/%/g, ''));
    if (isNaN(num)) {
        return String(value);
    }
    return (num * 100).toFixed(decimalPlaces) + '%';
}

// ====================================================================
// Part 2: PDFMake-Specific Cell Style Helpers
// ( ✨ 这部分被修改以支持自定义 margin ✨ )
// ====================================================================

/**
 * Creates a right-aligned cell object for pdfmake.
 * @param {string} text The text to display in the cell.
 * @param {Array<number>} [margin=[0, 4, 0, 4]] An array defining the cell margin [left, top, right, bottom].
 * @returns {object} A pdfmake cell object.
 */
function alignRight(text, margin = [0, 4, 0, 4]) { // ✨ 添加了 margin 参数并设置了默认值
    return { text, alignment: 'right', margin }; // ✨ 在返回的对象中使用了 margin 参数
}

/**
 * Creates a center-aligned cell object for pdfmake.
 * @param {string} text The text to display in the cell.
 * @param {Array<number>} [margin=[0, 4, 0, 4]] An array defining the cell margin [left, top, right, bottom].
 * @returns {object} A pdfmake cell object.
 */
function alignCenter(text, margin = [0, 4, 0, 4]) { // ✨ 添加了 margin 参数并设置了默认值
    return { text, alignment: 'center', margin }; // ✨ 在返回的对象中使用了 margin 参数
}

// ====================================================================
// Part 3: The Formatting "Engine"
// (这部分保持不变)
// ====================================================================

/**
 * Applies formatting rules to a dataset to generate a pdfmake table body.
 * @param {Array<object>} rows The raw data rows from the database.
 * @param {Array<string>} columnsToExport The list of column keys to include in the export.
 * @param {object} rules An object where keys are column names and values are formatter functions.
 * @returns {Array<Array<object|string>>} A pdfmake-compatible table body (without headers).
 */
function applyPdfFormatting(rows, columnsToExport, rules) {
    return rows.map(row => {
        return columnsToExport.map(key => {
            const originalValue = row[key];
            const formatter = rules[key];

            if (formatter) {
                return formatter(originalValue);
            }

            // 默认单元格的 margin 仍然是 [0, 4, 0, 4]
            return {
                text: originalValue !== null && originalValue !== undefined ? String(originalValue) : '',
                margin: [0, 4, 0, 4]
            };
        });
    });
}

// Export everything as before
module.exports = {
    formatYearMonth, // ✨ 新增导出
    formatNumber,
    formatPercentage,
    alignRight,
    alignCenter,
    applyPdfFormatting
};