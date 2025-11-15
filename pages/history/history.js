import Toast from '@vant/weapp/toast/toast';
import Dialog from '@vant/weapp/dialog/dialog';
import { formatDate } from '../../utils/format';
import { drawLineChart, prepareChartData } from '../../utils/chart';

Page({
  data: {
    userInfo: null,
    loading: true,
    recordList: [],
    allRecords: [], // 存储所有记录用于图表
    themeColor: '#4fc08d',
    chartRange: 7, // 图表时间范围（7/30/365）
    statistics: {
      totalDays: 0,
      avgWater: 0,
      totalWater: 0
    }
  },

  canvasContext: null,
  canvasWidth: 0,
  canvasHeight: 0,

  onLoad() {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) {
      wx.redirectTo({
        url: '/pages/profile/profile'
      });
      return;
    }
    this.setData({ userInfo });
    this.initCanvas();
    this.loadRecords();
  },

  onShow() {
    if (this.data.userInfo) {
      this.loadRecords();
    }
  },

  onReady() {
    this.initCanvas();
  },

  /**
   * 初始化画布
   */
  initCanvas() {
    const query = wx.createSelectorQuery();
    query.select('#lineChart').boundingClientRect();
    query.exec((res) => {
      if (res[0]) {
        this.canvasWidth = res[0].width;
        this.canvasHeight = res[0].height;
        this.canvasContext = wx.createCanvasContext('lineChart');
      }
    });
  },

  // ==================== 数据加载 ====================

  /**
   * 加载历史记录
   */
  async loadRecords() {
    try {
      wx.showLoading({ title: '加载中...' });

      const db = wx.cloud.database();

      // 加载用于列表显示的30天记录
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const listRes = await db.collection('water_records')
        .where({
          _openid: this.data.userInfo.openid,
          date: db.command.gte(formatDate(thirtyDaysAgo))
        })
        .orderBy('date', 'desc')
        .get();

      // 加载用于图表的一年记录
      const oneYearAgo = new Date();
      oneYearAgo.setDate(oneYearAgo.getDate() - 365);

      const chartRes = await db.collection('water_records')
        .where({
          _openid: this.data.userInfo.openid,
          date: db.command.gte(formatDate(oneYearAgo))
        })
        .orderBy('date', 'asc')
        .get();

      const statistics = this.calculateStatistics(listRes.data);

      this.setData({
        recordList: listRes.data,
        allRecords: chartRes.data,
        statistics,
        loading: false
      });

      // 绘制图表
      this.drawChart();
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

  // ==================== 图表相关 ====================

  /**
   * 绘制图表
   */
  drawChart() {
    if (!this.canvasContext || !this.canvasWidth) {
      // 如果画布还未初始化，延迟绘制
      setTimeout(() => {
        if (this.canvasContext && this.canvasWidth) {
          this.drawChart();
        }
      }, 500);
      return;
    }

    const chartData = prepareChartData(this.data.allRecords, this.data.chartRange);

    drawLineChart(this.canvasContext, {
      data: chartData,
      width: this.canvasWidth,
      height: this.canvasHeight,
      color: this.data.themeColor
    });
  },

  /**
   * 切换图表时间范围
   */
  switchChartRange(e) {
    const range = parseInt(e.currentTarget.dataset.range);
    this.setData({ chartRange: range });
    this.drawChart();
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
