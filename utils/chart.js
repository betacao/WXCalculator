/**
 * 轻量级图表绘制工具
 * 使用 Canvas 绘制折线图
 */

/**
 * 绘制折线图
 * @param {Object} ctx - Canvas 上下文
 * @param {Object} config - 配置对象
 * @param {Array} config.data - 数据数组 [{date: 'YYYY-MM-DD', value: number}]
 * @param {number} config.width - 画布宽度
 * @param {number} config.height - 画布高度
 * @param {string} config.color - 主题色
 */
export function drawLineChart(ctx, config) {
  const {
    data,
    width,
    height,
    color = '#4fc08d'
  } = config;

  if (!data || data.length === 0) {
    drawEmptyChart(ctx, width, height);
    return;
  }

  // 清空画布
  ctx.clearRect(0, 0, width, height);

  // 绘制配置
  const padding = {
    top: 20,
    right: 20,
    bottom: 40,
    left: 50
  };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // 计算数据范围
  const values = data.map(item => item.value);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values, 0);
  const valueRange = maxValue - minValue || 1;

  // 绘制背景网格
  drawGrid(ctx, padding, chartWidth, chartHeight, maxValue);

  // 绘制折线和区域
  drawLine(ctx, data, padding, chartWidth, chartHeight, minValue, valueRange, color);

  // 绘制数据点
  drawPoints(ctx, data, padding, chartWidth, chartHeight, minValue, valueRange, color);

  // 绘制坐标轴标签
  drawLabels(ctx, data, padding, chartWidth, chartHeight, maxValue);

  ctx.draw();
}

/**
 * 绘制空图表
 */
function drawEmptyChart(ctx, width, height) {
  ctx.clearRect(0, 0, width, height);
  ctx.setFontSize(14);
  ctx.setFillStyle('#999');
  ctx.setTextAlign('center');
  ctx.fillText('暂无数据', width / 2, height / 2);
  ctx.draw();
}

/**
 * 绘制网格
 */
function drawGrid(ctx, padding, chartWidth, chartHeight, maxValue) {
  ctx.setLineWidth(1);
  ctx.setStrokeStyle('#f0f0f0');

  // 绘制横向网格线（5条）
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + chartWidth, y);
    ctx.stroke();
  }
}

/**
 * 绘制折线和渐变区域
 */
function drawLine(ctx, data, padding, chartWidth, chartHeight, minValue, valueRange, color) {
  if (data.length === 0) return;

  const points = calculatePoints(data, padding, chartWidth, chartHeight, minValue, valueRange);

  // 绘制渐变填充区域
  const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
  const rgbaColor = hexToRgba(color, 0.25); // 25% 透明度
  const rgbaTransparent = hexToRgba(color, 0); // 完全透明
  gradient.addColorStop(0, rgbaColor);
  gradient.addColorStop(1, rgbaTransparent);

  ctx.beginPath();
  ctx.moveTo(points[0].x, padding.top + chartHeight);
  points.forEach((point, index) => {
    if (index === 0) {
      ctx.lineTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });
  ctx.lineTo(points[points.length - 1].x, padding.top + chartHeight);
  ctx.closePath();
  ctx.setFillStyle(gradient);
  ctx.fill();

  // 绘制折线
  ctx.beginPath();
  ctx.setLineWidth(2);
  ctx.setStrokeStyle(color);
  ctx.setLineCap('round');
  ctx.setLineJoin('round');

  points.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });
  ctx.stroke();
}

/**
 * 绘制数据点
 */
function drawPoints(ctx, data, padding, chartWidth, chartHeight, minValue, valueRange, color) {
  const points = calculatePoints(data, padding, chartWidth, chartHeight, minValue, valueRange);

  points.forEach(point => {
    // 外圈
    ctx.beginPath();
    ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
    ctx.setFillStyle('#fff');
    ctx.fill();

    // 内圈
    ctx.beginPath();
    ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
    ctx.setFillStyle(color);
    ctx.fill();
  });
}

/**
 * 绘制坐标轴标签
 */
function drawLabels(ctx, data, padding, chartWidth, chartHeight, maxValue) {
  ctx.setFontSize(10);
  ctx.setFillStyle('#999');

  // Y轴标签（显示最大值和0）
  ctx.setTextAlign('right');
  ctx.fillText(maxValue.toFixed(0), padding.left - 10, padding.top + 5);
  ctx.fillText('0', padding.left - 10, padding.top + chartHeight + 5);

  // X轴标签
  ctx.setTextAlign('center');
  const labelStep = Math.ceil(data.length / 4); // 显示4-5个标签

  data.forEach((item, index) => {
    if (index % labelStep === 0 || index === data.length - 1) {
      const x = padding.left + (chartWidth / (data.length - 1 || 1)) * index;
      const label = formatDateLabel(item.date);
      ctx.fillText(label, x, padding.top + chartHeight + 20);
    }
  });
}

/**
 * 计算所有点的坐标
 */
function calculatePoints(data, padding, chartWidth, chartHeight, minValue, valueRange) {
  return data.map((item, index) => {
    const x = padding.left + (chartWidth / (data.length - 1 || 1)) * index;
    const y = padding.top + chartHeight - ((item.value - minValue) / valueRange) * chartHeight;
    return { x, y, value: item.value };
  });
}

/**
 * 格式化日期标签
 */
function formatDateLabel(dateStr) {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}/${day}`;
}

/**
 * 准备图表数据
 * @param {Array} records - 记录数组
 * @param {number} days - 天数范围
 * @returns {Array} 图表数据
 */
export function prepareChartData(records, days) {
  const today = new Date();
  const dataMap = {};

  // 初始化所有日期为0
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = formatDate(date);
    dataMap[dateStr] = 0;
  }

  // 填充实际数据
  records.forEach(record => {
    if (dataMap.hasOwnProperty(record.date)) {
      dataMap[record.date] = record.totalWater || 0;
    }
  });

  // 转换为数组
  return Object.keys(dataMap)
    .sort()
    .map(date => ({
      date,
      value: dataMap[date]
    }));
}

/**
 * 格式化日期 YYYY-MM-DD
 */
function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 将十六进制颜色转换为 rgba 格式
 * @param {string} hex - 十六进制颜色，如 '#4fc08d'
 * @param {number} alpha - 透明度 0-1
 * @returns {string} rgba 颜色字符串
 */
function hexToRgba(hex, alpha) {
  // 移除 # 号
  hex = hex.replace('#', '');

  // 解析 RGB 值
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
