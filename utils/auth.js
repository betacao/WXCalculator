/**
 * 认证模块 - 处理用户登录相关功能
 */

import { getUserFromDB, createUserInDB } from './database';

/**
 * 执行快速登录
 * @returns {Promise<Object>} 用户信息
 */
export async function quickLogin() {
  try {
    // 云函数登录获取openid
    const loginRes = await wx.cloud.callFunction({
      name: 'login'
    });

    const openid = loginRes.result.openid;
    console.log('✅ 获取openid成功:', openid);

    // 从数据库查询用户信息
    const dbUserInfo = await getUserFromDB(openid);

    let userInfo;

    if (dbUserInfo) {
      // 老用户，使用数据库中的信息
      userInfo = {
        openid,
        nickName: dbUserInfo.nickName,
        avatarUrl: dbUserInfo.avatarUrl,
        needUpdate: false
      };
      console.log('✅ 从数据库加载用户信息');
    } else {
      // 新用户，创建默认信息
      userInfo = {
        openid,
        nickName: '用户' + openid.slice(-4),
        avatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
        needUpdate: true
      };

      // 保存到数据库
      await createUserInDB(openid, userInfo);
      console.log('✅ 创建新用户信息');
    }

    // 保存到本地
    wx.setStorageSync('userInfo', userInfo);

    return userInfo;
  } catch (error) {
    console.error('登录失败:', error);
    throw error;
  }
}

/**
 * 检查登录状态
 * @returns {Object|null} 用户信息或null
 */
export function checkLoginStatus() {
  const userInfo = wx.getStorageSync('userInfo');
  return userInfo || null;
}

/**
 * 退出登录
 */
export function logout() {
  wx.removeStorageSync('userInfo');
  console.log('✅ 已退出登录');
}
