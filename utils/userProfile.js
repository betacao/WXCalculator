/**
 * 用户资料模块 - 处理用户信息的编辑和保存
 */

import { uploadAvatar, deleteOldAvatar } from './storage';
import { updateUserInDB } from './database';

/**
 * 处理头像选择
 * @param {string} tempFilePath - 临时文件路径
 * @param {string} openid - 用户openid
 * @returns {Promise<string>} 云存储URL
 */
export async function handleAvatarChange(tempFilePath, openid) {
  // 上传到云存储
  const cloudUrl = await uploadAvatar(tempFilePath, openid);
  return cloudUrl;
}

/**
 * 验证昵称
 * @param {string} nickname - 昵称
 * @returns {Object} { valid: boolean, message: string }
 */
export function validateNickname(nickname) {
  if (!nickname || nickname.trim() === '') {
    return { valid: false, message: '请输入昵称' };
  }

  if (nickname.length > 20) {
    return { valid: false, message: '昵称不能超过20个字符' };
  }

  return { valid: true, message: '' };
}

/**
 * 保存用户信息
 * @param {Object} params - 参数对象
 * @param {string} params.openid - 用户openid
 * @param {string} params.nickName - 昵称
 * @param {string} params.avatarUrl - 头像URL
 * @param {string} params.oldAvatarUrl - 旧头像URL（可选）
 * @returns {Promise<Object>} 更新后的用户信息
 */
export async function saveUserProfile({ openid, nickName, avatarUrl, oldAvatarUrl }) {
  // 验证昵称
  const validation = validateNickname(nickName);
  if (!validation.valid) {
    throw new Error(validation.message);
  }

  // 更新数据库
  await updateUserInDB(openid, {
    nickName,
    avatarUrl
  });

  // 删除旧头像（可选优化）
  if (oldAvatarUrl && oldAvatarUrl !== avatarUrl) {
    await deleteOldAvatar(oldAvatarUrl);
  }

  // 构建新的用户信息
  const updatedUserInfo = {
    openid,
    nickName,
    avatarUrl,
    needUpdate: false
  };

  // 保存到本地
  wx.setStorageSync('userInfo', updatedUserInfo);

  console.log('✅ 用户信息已保存');
  return updatedUserInfo;
}
