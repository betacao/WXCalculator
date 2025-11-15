/**
 * 食物数据模块 - 处理食物数据的加载和缓存
 */

const CACHE_KEY = 'food_data_cache';
const CACHE_EXPIRE_TIME = 24 * 60 * 60 * 1000; // 24小时
const DATA_URL = 'https://gitee.com/BetaCao/wxcalculator/raw/master/categorized_data.json';

/**
 * 从缓存加载数据
 * @returns {Array|null} 食物数据或null
 */
export function loadFromCache() {
  try {
    const cache = wx.getStorageSync(CACHE_KEY);
    if (!cache) return null;

    const { data, timestamp } = cache;
    const now = Date.now();

    // 检查缓存是否过期
    if (now - timestamp > CACHE_EXPIRE_TIME) {
      console.log('⚠️ 缓存已过期');
      wx.removeStorageSync(CACHE_KEY);
      return null;
    }

    return data;
  } catch (error) {
    console.error('读取缓存失败:', error);
    return null;
  }
}

/**
 * 保存数据到缓存
 * @param {Array} data - 食物数据
 */
export function saveToCache(data) {
  try {
    wx.setStorageSync(CACHE_KEY, {
      data,
      timestamp: Date.now()
    });
    console.log('✅ 数据已缓存');
  } catch (error) {
    console.error('缓存保存失败:', error);
  }
}

/**
 * 从远程获取食物数据
 * @returns {Promise<Array>} 食物数据
 */
export async function fetchFoodData() {
  console.log('🔍 开始请求数据...');

  const res = await new Promise((resolve, reject) => {
    wx.request({
      url: DATA_URL,
      method: 'GET',
      success: resolve,
      fail: reject
    });
  });

  console.log('✅ 请求完成, 状态码:', res.statusCode);

  if (res.statusCode !== 200 || !res.data) {
    throw new Error('无效响应');
  }

  // 转换并排序数据
  const displayList = res.data
    .map(category => ({
      id: category.id,
      categoryName: category.categoryName,
      foods: category.foods.map(food => ({
        id: food.id,
        name: food.name,
        waterContent: food.waterContent,
        icon: food.icon
      }))
    }))
    .sort((a, b) => a.id - b.id);

  return displayList;
}

/**
 * 过滤食物数据
 * @param {Array} foodData - 原始食物数据
 * @param {string} searchValue - 搜索关键词
 * @returns {Array} 过滤后的数据
 */
export function filterFoodData(foodData, searchValue) {
  const searchLower = searchValue.toLowerCase();

  return foodData.map(category => ({
    ...category,
    foods: category.foods.filter(food =>
      food.name.toLowerCase().includes(searchLower)
    )
  })).filter(category => category.foods.length > 0);
}
