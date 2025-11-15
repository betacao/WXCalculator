/**
 * 数据库操作模块 - 处理云数据库的CRUD操作
 */

/**
 * 从数据库获取用户信息
 * @param {string} openid - 用户openid
 * @returns {Promise<Object|null>} 用户信息或null
 */
export async function getUserFromDB(openid) {
  try {
    const db = wx.cloud.database();
    const res = await db.collection('users').doc(openid).get();
    return res.data || null;
  } catch (error) {
    // 如果记录不存在，会抛出错误
    if (error.errCode === -1) {
      return null;
    }
    console.error('获取用户信息失败:', error);
    throw error;
  }
}

/**
 * 在数据库中创建新用户
 * @param {string} openid - 用户openid
 * @param {Object} userInfo - 用户信息
 */
export async function createUserInDB(openid, userInfo) {
  const db = wx.cloud.database();
  await db.collection('users').doc(openid).set({
    data: {
      nickName: userInfo.nickName,
      avatarUrl: userInfo.avatarUrl,
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    }
  });
}

/**
 * 更新数据库中的用户信息
 * @param {string} openid - 用户openid
 * @param {Object} data - 要更新的数据
 */
export async function updateUserInDB(openid, data) {
  const db = wx.cloud.database();
  await db.collection('users').doc(openid).update({
    data: {
      ...data,
      updateTime: db.serverDate()
    }
  });
}

/**
 * 获取用户的统计数据
 * @param {string} openid - 用户openid
 * @returns {Promise<Object>} 统计数据
 */
export async function getUserStatistics(openid) {
  const db = wx.cloud.database();

  // 获取总记录数
  const countRes = await db.collection('water_records')
    .where({ _openid: openid })
    .count();

  // 获取最近7天的记录
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const dateStr = formatDate(sevenDaysAgo);

  const recentRes = await db.collection('water_records')
    .where({
      _openid: openid,
      date: db.command.gte(dateStr)
    })
    .get();

  const recentWater = recentRes.data.reduce((sum, record) => sum + record.totalWater, 0);

  return {
    totalRecords: countRes.total,
    recentWater: parseFloat(recentWater.toFixed(1))
  };
}

/**
 * 格式化日期为 YYYY-MM-DD
 * @param {Date} date - 日期对象
 * @returns {string} 格式化后的日期字符串
 */
function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
