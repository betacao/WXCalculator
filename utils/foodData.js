/**
 * 食物数据模块 - 处理食物数据的加载和缓存
 */

const CACHE_KEY = 'food_data_cache';
const MANIFEST_URL = 'https://integration-6gmz47dx162bb145-1348875563.tcloudbaseapp.com/manifest.json';

/**
 * 从缓存加载数据
 * @returns {Object|null} 缓存对象或null
 */
export function loadFromCache() {
  try {
    const cache = wx.getStorageSync(CACHE_KEY);
    if (!cache) return null;

    // 兼容旧格式缓存：直接存储数组
    if (Array.isArray(cache)) {
      return {
        data: cache,
        updatedAt: '',
        timestamp: 0
      };
    }

    if (!Array.isArray(cache.data)) {
      console.warn('⚠️ 缓存格式无效，已忽略');
      wx.removeStorageSync(CACHE_KEY);
      return null;
    }

    return cache;
  } catch (error) {
    console.error('读取缓存失败:', error);
    return null;
  }
}

/**
 * 保存数据到缓存
 * @param {Object} payload - 缓存对象
 */
export function saveToCache(payload) {
  try {
    wx.setStorageSync(CACHE_KEY, {
      data: payload.data,
      updatedAt: payload.updatedAt || '',
      assetBaseUrl: payload.assetBaseUrl || '',
      timestamp: Date.now()
    });
    console.log('✅ 数据已缓存');
  } catch (error) {
    console.error('缓存保存失败:', error);
  }
}

/**
 * 从远程获取食物数据
 * @param {Object|null} currentCache - 当前缓存
 * @returns {Promise<Object>} 食物数据和元信息
 */
export async function fetchFoodData(currentCache = null) {
  console.log('🔍 开始请求 manifest...');

  const manifest = await requestJson(MANIFEST_URL);
  validateManifest(manifest);

  if (
    currentCache &&
    Array.isArray(currentCache.data) &&
    currentCache.updatedAt &&
    currentCache.updatedAt === manifest.updatedAt &&
    currentCache.assetBaseUrl === manifest.assetBaseUrl
  ) {
    console.log('✅ 远端数据未变化，继续使用缓存');
    return {
      data: currentCache.data,
      updatedAt: currentCache.updatedAt,
      assetBaseUrl: manifest.assetBaseUrl,
      unchanged: true
    };
  }

  console.log('🔍 开始请求食物数据...');
  const remoteData = await requestJson(manifest.dataUrl);

  if (!Array.isArray(remoteData)) {
    throw new Error('无效食物数据');
  }

  const displayList = remoteData
    .map(category => ({
      id: category.id,
      categoryName: category.categoryName,
      foods: category.foods.map(food => ({
        id: food.id,
        name: food.name,
        waterContent: food.waterContent,
        icon: buildAssetUrl(food.icon, manifest.assetBaseUrl, manifest.updatedAt)
      }))
    }))
    .sort((a, b) => a.id - b.id);

  return {
    data: displayList,
    updatedAt: manifest.updatedAt || '',
    assetBaseUrl: manifest.assetBaseUrl,
    unchanged: false
  };
}

function requestJson(url) {
  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method: 'GET',
      success: (res) => {
        console.log('✅ 请求完成, 状态码:', res.statusCode, url);
        if (res.statusCode !== 200 || !res.data) {
          reject(new Error(`无效响应: ${url}`));
          return;
        }

        if (typeof res.data === 'string') {
          try {
            resolve(JSON.parse(res.data));
            return;
          } catch (parseError) {
            reject(new Error(`JSON 解析失败: ${url}`));
            return;
          }
        }

        resolve(res.data);
      },
      fail: reject
    });
  });
}

function validateManifest(manifest) {
  if (!manifest || !manifest.dataUrl || !manifest.assetBaseUrl) {
    throw new Error('manifest 配置无效');
  }
}

function buildAssetUrl(iconPath, assetBaseUrl, updatedAt) {
  if (!iconPath) return '';

  const baseUrl = assetBaseUrl.replace(/\/+$/, '');
  const normalizedPath = iconPath.replace(/^\.?\/*/, '');
  const absoluteUrl = /^https?:\/\//i.test(normalizedPath)
    ? normalizedPath
    : `${baseUrl}/${normalizedPath}`;

  if (!updatedAt) {
    return absoluteUrl;
  }

  const separator = absoluteUrl.includes('?') ? '&' : '?';
  return `${absoluteUrl}${separator}v=${encodeURIComponent(updatedAt)}`;
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
