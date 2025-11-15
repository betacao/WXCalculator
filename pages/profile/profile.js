import Toast from '@vant/weapp/toast/toast';
import { quickLogin, checkLoginStatus, logout as authLogout } from '../../utils/auth';
import { getUserStatistics } from '../../utils/database';
import { handleAvatarChange, saveUserProfile } from '../../utils/userProfile';

Page({
  data: {
    userInfo: null,
    hasUserInfo: false,
    themeColor: '#4fc08d',
    statistics: {
      totalRecords: 0,
      recentWater: 0
    },
    showEditProfile: false,
    tempNickname: '',
    tempAvatar: ''
  },

  onLoad() {
    this.checkLogin();
  },

  onShow() {
    this.checkLogin();
    if (this.data.hasUserInfo) {
      this.loadStatistics();
    }
  },

  // ==================== 登录相关 ====================

  /**
   * 检查登录状态
   */
  checkLogin() {
    const userInfo = checkLoginStatus();
    this.setData({
      userInfo,
      hasUserInfo: !!userInfo
    });
  },

  /**
   * 执行登录
   */
  async handleLogin() {
    try {
      wx.showLoading({ title: '登录中...' });

      const userInfo = await quickLogin();

      this.setData({
        userInfo,
        hasUserInfo: true
      });

      Toast.success('登录成功');
      this.loadStatistics();

      // 新用户提示完善资料
      if (userInfo.needUpdate) {
        setTimeout(() => {
          wx.showModal({
            title: '完善资料',
            content: '点击头像或昵称可以修改个人信息',
            showCancel: false,
            confirmText: '知道了'
          });
        }, 800);
      }
    } catch (error) {
      console.error('登录失败:', error);
      Toast.fail('登录失败，请重试');
    } finally {
      wx.hideLoading();
    }
  },

  /**
   * 退出登录
   */
  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          authLogout();
          this.setData({
            userInfo: null,
            hasUserInfo: false,
            statistics: {
              totalRecords: 0,
              recentWater: 0
            }
          });
          Toast.success('已退出登录');
        }
      }
    });
  },

  // ==================== 统计数据 ====================

  /**
   * 加载用户统计数据
   */
  async loadStatistics() {
    try {
      const statistics = await getUserStatistics(this.data.userInfo.openid);
      this.setData({ statistics });
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  },

  // ==================== 编辑资料 ====================

  /**
   * 显示编辑资料弹窗
   */
  showEditDialog() {
    if (!this.data.hasUserInfo) {
      Toast.fail('请先登录');
      return;
    }

    this.setData({
      showEditProfile: true,
      tempNickname: this.data.userInfo.nickName,
      tempAvatar: this.data.userInfo.avatarUrl
    });
  },

  /**
   * 关闭编辑弹窗
   */
  closeEditDialog() {
    this.setData({
      showEditProfile: false
    });
  },

  /**
   * 选择头像
   */
  async onSelectAvatar(e) {
    try {
      const { avatarUrl } = e.detail;

      wx.showLoading({ title: '上传中...' });

      const cloudUrl = await handleAvatarChange(avatarUrl, this.data.userInfo.openid);

      this.setData({
        tempAvatar: cloudUrl
      });

      wx.hideLoading();
      Toast.success('头像上传成功');
    } catch (error) {
      console.error('头像上传失败:', error);
      wx.hideLoading();
      Toast.fail('头像上传失败');
    }
  },

  /**
   * 输入昵称
   */
  onInputNickname(e) {
    this.setData({
      tempNickname: e.detail.value
    });
  },

  /**
   * 保存用户信息
   */
  async handleSave() {
    try {
      wx.showLoading({ title: '保存中...' });

      const updatedUserInfo = await saveUserProfile({
        openid: this.data.userInfo.openid,
        nickName: this.data.tempNickname,
        avatarUrl: this.data.tempAvatar,
        oldAvatarUrl: this.data.userInfo.avatarUrl
      });

      this.setData({
        userInfo: updatedUserInfo,
        showEditProfile: false
      });

      wx.hideLoading();
      Toast.success('保存成功');
    } catch (error) {
      console.error('保存失败:', error);
      wx.hideLoading();
      Toast.fail(error.message || '保存失败，请重试');
    }
  },

  // ==================== 页面跳转 ====================

  /**
   * 查看历史记录
   */
  goToHistory() {
    if (!this.data.hasUserInfo) {
      Toast.fail('请先登录');
      return;
    }
    wx.navigateTo({
      url: '/pages/history/history'
    });
  },

  /**
   * 返回首页
   */
  goToHome() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  }
});
