/**
 * 格式化工具模块 - 处理各种数据格式化
 */

/**
 * 格式化日期为 YYYY-MM-DD
 * @param {Date|string|number} date - 日期
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 格式化日期时间为 YYYY-MM-DD HH:mm:ss
 * @param {Date|string|number} date - 日期
 * @returns {string} 格式化后的日期时间字符串
 */
export function formatDateTime(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 格式化数字，保留指定小数位
 * @param {number} num - 数字
 * @param {number} digits - 小数位数，默认1位
 * @returns {number} 格式化后的数字
 */
export function formatNumber(num, digits = 1) {
  return parseFloat(num.toFixed(digits));
}
