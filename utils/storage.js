/**
 * 云存储模块 - 处理文件上传下载
 */

/**
 * 上传头像到云存储
 * @param {string} filePath - 本地临时文件路径
 * @param {string} openid - 用户openid
 * @returns {Promise<string>} 云存储文件ID
 */
export async function uploadAvatar(filePath, openid) {
  try {
    const cloudPath = `avatars/${openid}_${Date.now()}.png`;

    const res = await wx.cloud.uploadFile({
      cloudPath,
      filePath
    });

    console.log('✅ 头像上传成功:', res.fileID);
    return res.fileID;
  } catch (error) {
    console.error('头像上传失败:', error);
    throw error;
  }
}

/**
 * 删除云存储中的文件
 * @param {string} fileID - 云存储文件ID
 */
export async function deleteFile(fileID) {
  try {
    await wx.cloud.deleteFile({
      fileList: [fileID]
    });
    console.log('✅ 文件删除成功:', fileID);
  } catch (error) {
    console.error('文件删除失败:', error);
    throw error;
  }
}

/**
 * 删除旧头像（如果存在）
 * @param {string} avatarUrl - 旧头像URL
 */
export async function deleteOldAvatar(avatarUrl) {
  if (avatarUrl && avatarUrl.startsWith('cloud://')) {
    try {
      await deleteFile(avatarUrl);
    } catch (error) {
      // 删除失败不影响主流程，只记录日志
      console.warn('删除旧头像失败:', error);
    }
  }
}
