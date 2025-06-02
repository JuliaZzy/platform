// 1. 将日期输入值格式化为 "xxxx年xx月" 的字符串
/**
 * @param {Date|string|number} dateInput
 * @returns {string}
 */
export function formatToChineseYearMonth(dateInput) {
  // 1. 处理 null, undefined, 空字符串等无效输入 (但允许数字0通过)
  if (!dateInput && typeof dateInput !== 'number') {
    return ''; 
  }

  // 2. 如果输入已经是 "xxxx年xx月" 格式，直接返回，避免重复格式化
  if (typeof dateInput === 'string' && /^\d{4}年\d{2}月$/.test(dateInput)) {
    return dateInput;
  }

  let dateObj;

  if (dateInput instanceof Date) {
    dateObj = dateInput; // 3. 如果已经是Date对象，直接使用
  } else {
    // 4. 尝试将其他类型的输入转换为 Date 对象
    let parsableDateInput = dateInput;
    // 针对 "YYYY-MM" 格式的字符串做特殊处理，以确保跨浏览器/时区解析的稳定性
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}$/.test(dateInput)) {
      // 将 "YYYY-MM" 转换为 "YYYY-MM-01T00:00:00Z"，明确指定为UTC时间的该月第一天零点
      // 这样 new Date() 解析时，能更准确地得到期望的月份，避免因时区导致月份偏移
      parsableDateInput = `${dateInput}-01T00:00:00.000Z`; // 使用 .000Z 更标准
    }
    dateObj = new Date(parsableDateInput);
  }

  // 5. 检查转换后的 dateObj 是否是一个有效的日期
  if (dateObj instanceof Date && !isNaN(dateObj.getTime())) {
    let year;
    let month;

    // ▼▼▼ 【关键修改点：区分处理，确保从 "YYYY-MM" 输入得到的月份正确】 ▼▼▼
    // 如果原始输入是 "YYYY-MM" 格式的字符串，我们之前将其强制按UTC解析，
    // 所以提取年月日时也应该用UTC方法，以避免本地时区偏移导致月份错误。
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}$/.test(dateInput)) {
      year = dateObj.getUTCFullYear();
      month = String(dateObj.getUTCMonth() + 1).padStart(2, '0'); // getUTCMonth() 是 0-11
    } else {
      // 对于其他所有类型的有效日期输入（如完整日期字符串、Date对象、时间戳数字），
      // 通常期望得到基于用户本地时区的年月日。
      year = dateObj.getFullYear();
      month = String(dateObj.getMonth() + 1).padStart(2, '0'); // getMonth() 是 0-11
    }
    // ▲▲▲ 【关键修改点结束】 ▲▲▲

    return `${year}年${month}月`;
  }

  // 6. 如果所有尝试都失败，打印警告并返回原始输入的字符串形式作为回退
  console.warn('[formatToChineseYearMonth] 无法将输入转换为有效日期:', dateInput);
  return String(dateInput); 
}

// 2. 将日期输入值格式化为 "YYYY-MM-DD"
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

// 3. 将数字格式化为带千分位分隔符的字符串，并保留2位小数
/**
 * @param {number|string} value - 需要格式化的数字或数字字符串。
 * @param {number} decimalPlaces - 保留的小数位数，默认为 2。
 * @returns {string} - 格式化后的字符串，或在无法转换时返回占位符'-'或原始值的字符串形式。
 */
export function formatNumber(value, decimalPlaces = 2) {
  // 1. 处理 null, undefined, 或纯空白字符串
  if (value === null || value === undefined || String(value).trim() === '') {
    return '-'; // 对于空或无效输入，返回占位符 '-'
  }

  // 2. 尝试移除值中可能已存在的千分位逗号，以正确解析数字
  const stringValue = String(value).replace(/,/g, '');
  const num = parseFloat(stringValue);

  // 3. 检查是否为有效数字
  if (isNaN(num)) {
    console.warn('[formatNumberWithSeparators] 输入值无法转换为有效数字:', value);
    return String(value); // 如果无法转换为数字，返回原始输入的字符串形式
  }

  // 4. 使用 toLocaleString 进行格式化
  // toLocaleString 会根据用户的本地化设置来决定千分位和是小数点的符号
  // undefined 作为第一个参数通常表示使用用户的默认区域设置
  return num.toLocaleString(undefined, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });
}

// 4. 将数字格式化为带百分号的字符串，并保留1位小数
/**
 * @param {number|string} value
 * @param {number} decimalPlaces
 * @returns {string}
 */
export function formatPercentage(value, decimalPlaces = 1) {
  // 1. 处理 null, undefined, 或纯空白字符串
  if (value === null || value === undefined || String(value).trim() === '') {
    return '-'; // 对于空或无效输入，返回占位符 '-'
  }

  // 2. 尝试移除值中可能已存在的百分号，以正确解析数字
  const stringValue = String(value).replace(/%/g, '');
  const num = parseFloat(stringValue);

  // 3. 检查是否为有效数字
  if (isNaN(num)) {
    console.warn('[formatAsPercentage] 输入值无法转换为有效数字以计算百分比:', value);
    return String(value); // 如果无法转换为数字，返回原始输入的字符串形式
  }

  // 4. 将数字乘以100，然后保留指定小数位数，并添加 '%' 符号
  return (num * 100).toFixed(decimalPlaces) + '%';
}

