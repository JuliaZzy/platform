/**
 * 将日期输入值格式化为 "xxxx年xx月" 的字符串。
 * @param {Date|string|number} dateInput
 * @returns {string}
 */
export function formatToChineseYearMonth(dateInput) {
  if (!dateInput && typeof dateInput !== 'number') { // 0 也是有效的数字输入 (虽然不太可能是日期)
    return ''; // 对于 null, undefined, 空字符串等，返回空
  }

  let dateObj;

  // 如果输入已经是 "xxxx年xx月" 格式，直接返回
  if (typeof dateInput === 'string' && /^\d{4}年\d{2}月$/.test(dateInput)) {
    return dateInput;
  }

  if (dateInput instanceof Date) {
    dateObj = dateInput;
  } else {
    // 尝试将输入转换为 Date 对象
    // 如果输入是 "YYYY-MM" 格式，Date构造函数会将其视为UTC时间的月初，需要注意时区
    // 为了更稳定地解析 "YYYY-MM"，可以补充为 "YYYY-MM-01"
    let parsableDateInput = dateInput;
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}$/.test(dateInput)) {
      parsableDateInput = `${dateInput}-01T00:00:00Z`; // 明确指定为UTC的月初，避免时区问题
    }
    dateObj = new Date(parsableDateInput);
  }

  // 检查转换后的 dateObj 是否是有效的日期
  if (dateObj instanceof Date && !isNaN(dateObj.getTime())) {
    const year = dateObj.getFullYear(); // 对于UTC日期，使用getUTCFullYear()更安全
    const month = String(dateObj.getMonth() + 1).padStart(2, '0'); // getMonth() 是 0-11
    return `${year}年${month}月`;
  }

  console.warn('[formatToChineseYearMonth] 无法将输入转换为有效日期:', dateInput);
  return String(dateInput); // 如果所有尝试都失败，返回原始输入的字符串形式作为回退
}

