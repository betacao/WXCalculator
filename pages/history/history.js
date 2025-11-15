import Toast from '@vant/weapp/toast/toast';
import Dialog from '@vant/weapp/dialog/dialog';
import { formatDate } from '../../utils/format';

Page({
  data: {
    userInfo: null,
    loading: true,
    recordList: [],
    themeColor: '#4fc08d',
    statistics: {
      totalDays: 0,
      avgWater: 0,
      totalWater: 0
    }
  },

  onLoad() {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) {
      wx.redirectTo({
        url: '/pages/profile/profile'
      });
      return;
    }
    this.setData({ userInfo });
    this.loadRecords();
  },

  onShow() {
    if (this.data.userInfo) {
      this.loadRecords();
    }
  },

  // ==================== 数据加载 ====================

  /**
   * 加载历史记录
   */
  async loadRecords() {
    try {
      wx.showLoading({ title: '加载中...' });

      const db = wx.cloud.database();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const res = await db.collection('water_records')
        .where({
          _openid: this.data.userInfo.openid,
          date: db.command.gte(formatDate(thirtyDaysAgo))
        })
        .orderBy('date', 'desc')
        .get();

      const statistics = this.calculateStatistics(res.data);

      this.setData({
        recordList: res.data,
        statistics,
        loading: false
      });
    } catch (error) {
      console.error('加载记录失败:', error);
      Toast.fail('加载失败');
      this.setData({ loading: false });
    } finally {
      wx.hideLoading();
    }
  },

  /**
   * 计算统计数据
   */
  calculateStatistics(records) {
    if (records.length === 0) {
      return { totalDays: 0, avgWater: 0, totalWater: 0 };
    }

    const totalWater = records.reduce((sum, record) => sum + record.totalWater, 0);
    const avgWater = parseFloat((totalWater / records.length).toFixed(1));

    return {
      totalDays: records.length,
      avgWater,
      totalWater: parseFloat(totalWater.toFixed(1))
    };
  },

  // ==================== 记录操作 ====================

  /**
   * 查看记录详情
   */
  viewDetail(e) {
    const record = e.currentTarget.dataset.record;
    const foodList = record.foods.map(food =>
      `${food.name} (${food.weight}g): ${food.waterAmount}ml`
    ).join('\n');

    Dialog.alert({
      title: `${record.date} 详情`,
      message: `总含水量：${record.totalWater}ml\n总重量：${record.totalWeight}g\n\n食物明细：\n${foodList}`,
      confirmButtonColor: this.data.themeColor
    });
  },

  /**
   * 删除记录
   */
  deleteRecord(e) {
    const recordId = e.currentTarget.dataset.id;

    Dialog.confirm({
      title: '确认删除',
      message: '删除后无法恢复，确定要删除这条记录吗？'
    }).then(async () => {
      try {
        wx.showLoading({ title: '删除中...' });

        const db = wx.cloud.database();
        await db.collection('water_records').doc(recordId).remove();

        Toast.success('删除成功');
        this.loadRecords();
      } catch (error) {
        console.error('删除失败:', error);
        Toast.fail('删除失败');
      } finally {
        wx.hideLoading();
      }
    }).catch(() => {});
  },

  // ==================== 页面跳转 ====================

  /**
   * 返回首页
   */
  backToHome() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  }
});
