// 1. 日期：xxxx年xx月
/**
 * @param {Date|string|number} dateInput
 * @returns {string}
 */
export function formatToChineseYearMonth(dateInput) {
  if (!dateInput && typeof dateInput !== 'number') {
    return ''; 
  }

  if (typeof dateInput === 'string' && /^\d{4}年\d{2}月$/.test(dateInput)) {
    return dateInput;
  }

  let dateObj;

  if (dateInput instanceof Date) {
    dateObj = dateInput;
  } else {
    let parsableDateInput = dateInput;
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}$/.test(dateInput)) {
      parsableDateInput = `${dateInput}-01T00:00:00.000Z`;
    }
    dateObj = new Date(parsableDateInput);
  }

  if (dateObj instanceof Date && !isNaN(dateObj.getTime())) {
    let year;
    let month;

    if (typeof dateInput === 'string' && /^\d{4}-\d{2}$/.test(dateInput)) {
      year = dateObj.getUTCFullYear();
      month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
    } else {
      year = dateObj.getFullYear();
      month = String(dateObj.getMonth() + 1).padStart(2, '0');
    }

    return `${year}年${month}月`;
  }

  console.warn('[formatToChineseYearMonth] 无法将输入转换为有效日期:', dateInput);
  return String(dateInput); 
}

// 2. 日期：YYYY-MM-DD
export function formatToYYYYMMDD(isoString) {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getFullYear())) {
        return isoString; 
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (e) {
    console.error('Error formatting date to YYYY-MM-DD:', isoString, e);
    return isoString; 
  }
}

// 3. 数字：千分位，保留2位小数
/**
 * @param {number|string} value - 需要格式化的数字或数字字符串。
 * @param {number} decimalPlaces - 保留的小数位数，默认为 2。
 * @returns {string} - 格式化后的字符串，或在无法转换时返回占位符'-'或原始值的字符串形式。
 */
export function formatNumber(value, decimalPlaces = 2) {
  if (value === null || value === undefined || String(value).trim() === '') {
    return '-';
  }

  const stringValue = String(value).replace(/,/g, '');
  const num = parseFloat(stringValue);

  if (isNaN(num)) {
    console.warn('[formatNumberWithSeparators] 输入值无法转换为有效数字:', value);
    return String(value);
  }
  return num.toLocaleString(undefined, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });
}

// 4. 数字：百分数，保留1位小数
/**
 * @param {number | string | null | undefined} value - 需要格式化的值。
 * @param {number} decimalPlaces - 希望保留的小数位数，默认为 1。
 * @returns {string} 格式化后的百分比字符串。
 */
export function formatPercentage(value, decimalPlaces = 1) {
  if (value == null || value === '') {
    return '—';
  }
  const num = parseFloat(value);
  if (isNaN(num)) {
    return '—';
  }
  const percentage = (num * 100).toFixed(decimalPlaces);
  return `${percentage}%`;
}
export function formatToDateTimeSec(isoString) {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch (e) {
    console.error('Error formatting date to YYYY-MM-DD HH:MM:SS:', isoString, e);
    return isoString;
  }
}