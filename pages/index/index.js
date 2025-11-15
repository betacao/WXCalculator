import Dialog from '@vant/weapp/dialog/dialog';
import Toast from '@vant/weapp/toast/toast';
import { checkLoginStatus } from '../../utils/auth';
import { loadFromCache, saveToCache, fetchFoodData, filterFoodData } from '../../utils/foodData';
import { calculateFoodWater, saveTodayRecord } from '../../utils/waterRecord';

// 配置常量
const CONFIG = {
  CLOUD_ENV: 'integration-6gmz47dx162bb145',
  THEME_COLOR: '#4fc08d',
  SEARCH_DEBOUNCE_TIME: 300
};

Page({
  data: {
    loading: true,
    searchValue: '',
    foodData: [],
    filteredFoodData: [],
    showSelectedFoodsPopup: false,
    activeCategory: 0,
    selectedFoods: {},
    selectedFoodsList: [],
    totalWater: 0,
    totalWeight: 0,
    selectedCount: 0,
    themeColor: CONFIG.THEME_COLOR,
    userInfo: null,
    hasUserInfo: false
  },

  searchTimer: null,

  async onLoad() {
    this.initCloud();
    this.checkLogin();
    await this.loadData();
  },

  onShow() {
    this.checkLogin();
  },

  // ==================== 初始化 ====================

  initCloud() {
    wx.cloud.init({
      env: CONFIG.CLOUD_ENV,
      traceUser: true
    });
  },

  checkLogin() {
    const userInfo = checkLoginStatus();
    this.setData({
      userInfo,
      hasUserInfo: !!userInfo
    });
  },

  // ==================== 数据加载 ====================

  async loadData() {
    try {
      wx.showLoading({ title: '加载中...', mask: true });

      // 先尝试从缓存加载
      const cachedData = loadFromCache();
      if (cachedData) {
        console.log('✅ 从缓存加载数据');
        this.setData({
          foodData: cachedData,
          filteredFoodData: cachedData,
          loading: false
        });
        wx.hideLoading();
        this.updateDataInBackground();
        return;
      }

      // 从远程加载
      await this.fetchData();
    } catch (error) {
      console.error('加载数据失败:', error);
      try {
        console.log('🔄 尝试重新加载...');
        await this.fetchData();
      } catch (retryError) {
        Toast.fail('数据加载失败，请检查网络后重试');
        this.setData({ loading: false });
      }
    } finally {
      wx.hideLoading();
    }
  },

  async fetchData() {
    const displayList = await fetchFoodData();
    saveToCache(displayList);
    this.setData({
      foodData: displayList,
      filteredFoodData: displayList,
      loading: false
    });
  },

  async updateDataInBackground() {
    try {
      const displayList = await fetchFoodData();
      saveToCache(displayList);
      this.setData({
        foodData: displayList,
        filteredFoodData: this.data.searchValue ?
          filterFoodData(displayList, this.data.searchValue) : displayList
      });
      console.log('✅ 后台数据更新完成');
    } catch (error) {
      console.log('后台更新失败，使用缓存数据:', error);
    }
  },

  // ==================== 搜索功能 ====================

  onSearch(event) {
    const searchValue = event.detail.trim();

    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }

    this.searchTimer = setTimeout(() => {
      this.performSearch(searchValue);
    }, CONFIG.SEARCH_DEBOUNCE_TIME);
  },

  performSearch(searchValue) {
    if (!searchValue) {
      this.setData({
        filteredFoodData: this.data.foodData,
        searchValue
      });
      return;
    }

    const filteredData = filterFoodData(this.data.foodData, searchValue);

    this.setData({
      filteredFoodData: filteredData,
      searchValue,
      activeCategory: filteredData.length > 0 ? 0 : this.data.activeCategory
    });
  },

  onSearchClear() {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.setData({
      filteredFoodData: this.data.foodData,
      searchValue: ''
    });
  },

  // ==================== 分类切换 ====================

  onCategoryChange(event) {
    this.setData({
      activeCategory: event.detail
    });
  },

  // ==================== 食物选择 ====================

  onStepperChange(event) {
    const { foodId, foodName, waterContent } = event.currentTarget.dataset;
    const weight = event.detail;
    const selectedFoods = { ...this.data.selectedFoods };

    if (weight === 0) {
      delete selectedFoods[foodId];
    } else {
      selectedFoods[foodId] = {
        id: foodId,
        name: foodName,
        waterContent: waterContent,
        weight: weight
      };
    }

    this.updateSelections(selectedFoods);
  },

  removeFood(event) {
    const foodId = event.currentTarget.dataset.foodId;

    Dialog.confirm({
      title: '确认删除',
      message: '是否删除此食物？'
    }).then(() => {
      const selectedFoods = { ...this.data.selectedFoods };
      delete selectedFoods[foodId];
      this.updateSelections(selectedFoods);
      Toast.success('已删除');
    }).catch(() => {});
  },

  updateSelections(selectedFoods) {
    const selectedFoodsList = Object.values(selectedFoods);
    const totalWeight = selectedFoodsList.reduce((total, food) => total + food.weight, 0);
    const totalWater = this.calculateTotal(selectedFoods);

    if (selectedFoodsList.length === 0 && this.data.showSelectedFoodsPopup) {
      this.closePopup();
    }

    this.setData({
      selectedFoods,
      selectedFoodsList,
      totalWeight,
      totalWater,
      selectedCount: selectedFoodsList.length
    });
  },

  calculateTotal(selectedFoods) {
    const totalWater = Object.values(selectedFoods).reduce((total, food) => {
      return total + calculateFoodWater(food);
    }, 0);
    return parseFloat(totalWater.toFixed(1));
  },

  // ==================== 计算和保存 ====================

  showResult() {
    if (!this.hasSelection()) return;

    let detailText = '食物含水量明细：\n';
    Object.values(this.data.selectedFoods).forEach(food => {
      const waterAmount = calculateFoodWater(food);
      detailText += `${food.name} (${food.weight}g): ${waterAmount}ml\n`;
    });

    if (this.data.hasUserInfo) {
      Dialog.confirm({
        title: '计算结果',
        message: `您摄入的食物总含水量为：${this.data.totalWater}ml\n\n${detailText}`,
        confirmButtonText: '保存记录',
        cancelButtonText: '我知道了',
        confirmButtonColor: this.data.themeColor
      }).then(() => {
        this.saveRecord();
      }).catch(() => {});
    } else {
      Dialog.confirm({
        title: '计算结果',
        message: `您摄入的食物总含水量为：${this.data.totalWater}ml\n\n${detailText}\n\n登录后可以保存每日记录`,
        confirmButtonText: '去登录',
        cancelButtonText: '我知道了',
        confirmButtonColor: this.data.themeColor
      }).then(() => {
        wx.switchTab({ url: '/pages/profile/profile' });
      }).catch(() => {});
    }
  },

  async saveRecord() {
    try {
      wx.showLoading({ title: '保存中...' });

      const result = await saveTodayRecord({
        openid: this.data.userInfo.openid,
        selectedFoods: this.data.selectedFoods,
        totalWater: this.data.totalWater,
        totalWeight: this.data.totalWeight
      });

      Toast.success(result.isUpdate ? '记录已更新' : '保存成功');

      this.setData({
        selectedFoods: {},
        selectedFoodsList: [],
        totalWater: 0,
        totalWeight: 0,
        selectedCount: 0
      });
    } catch (error) {
      console.error('保存失败:', error);
      Toast.fail('保存失败，请重试');
    } finally {
      wx.hideLoading();
    }
  },

  // ==================== 辅助方法 ====================

  hasSelection() {
    if (Object.keys(this.data.selectedFoods).length === 0) {
      Toast.fail('请先选择食物');
      return false;
    }
    return true;
  },

  showPopup() {
    if (!this.hasSelection()) return;
    this.setData({ showSelectedFoodsPopup: true });
  },

  closePopup() {
    this.setData({ showSelectedFoodsPopup: false });
  }
});
