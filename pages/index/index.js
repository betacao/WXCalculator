import Dialog from '@vant/weapp/dialog/dialog';
import Toast from '@vant/weapp/toast/toast';

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
    // 统一主题色
    themeColor: '#4fc08d'
  },

  onLoad: async function () {
    this.initCloud();
    await this.loadFoodData();
  },

  // 初始化云环境
  initCloud() {
    wx.cloud.init({
      env: "cloud1-8galpdysfe64e2a7",
      traceUser: true
    });
  },

  // 加载食物数据
  async loadFoodData() {
    try {
      wx.showLoading({
        title: '加载中...',
        mask: true
      });

      console.log('🔍 [loadFoodData] 开始请求数据...');
      // 从gitee远程URL请求JSON数据
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: 'https://gitee.com/BetaCao/wxcalculator/raw/master/categorized_data.json',
          method: 'GET',
          success: resolve,
          fail: reject
        });
      }); 
      console.log('✅ 请求完成, 状态码:', res.statusCode, '返回数据:', res.data);
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

      this.setData({
        foodData: displayList,
        filteredFoodData: displayList,
        loading: false
      });
    } catch (error) {
      console.error('加载数据失败:', error);
      Toast.fail('数据加载失败，请重试');
    } finally {
      wx.hideLoading();
    }
  },

  // 搜索功能
  onSearch(event) {
    const searchValue = event.detail.trim().toLowerCase();

    if (!searchValue) {
      // 如果搜索框为空，恢复原始数据
      this.setData({
        filteredFoodData: this.data.foodData,
        searchValue
      });
      return;
    }

    // 过滤食物数据
    const filteredData = this.data.foodData.map(category => {
      // 复制分类，但只包含匹配的食物
      return {
        ...category,
        foods: category.foods.filter(food =>
          food.name.toLowerCase().includes(searchValue)
        )
      };
    }).filter(category => category.foods.length > 0); // 只保留有匹配食物的分类

    this.setData({
      filteredFoodData: filteredData,
      searchValue,
      activeCategory: filteredData.length > 0 ? 0 : this.data.activeCategory
    });
  },

  // 清除搜索
  onSearchClear() {
    this.setData({
      filteredFoodData: this.data.foodData,
      searchValue: ''
    });
  },

  // 切换食物分类
  onCategoryChange(event) {
    this.setData({
      activeCategory: event.detail
    });
  },

  // 修改食物数量
  onStepperChange(event) {
    const {
      foodId,
      foodName,
      waterContent
    } = event.currentTarget.dataset;
    const weight = event.detail;
    const selectedFoods = {
      ...this.data.selectedFoods
    };

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

    this.updateFoodSelections(selectedFoods);
  },

  // 移除已选食物
  removeFood(event) {
    const foodId = event.currentTarget.dataset.foodId;
    Dialog.confirm({
      title: '确认删除',
      message: '是否删除此食物？'
    }).then(() => {
      const selectedFoods = {
        ...this.data.selectedFoods
      };
      delete selectedFoods[foodId];

      this.updateFoodSelections(selectedFoods);
      Toast.success('已删除');
    }).catch(() => {
      // 用户点击取消，不执行任何操作
    });
  },

  // 更新食物选择相关的所有数据
  updateFoodSelections(selectedFoods) {
    const selectedFoodsList = Object.values(selectedFoods);
    const totalWeight = selectedFoodsList.reduce((total, food) => total + food.weight, 0);
    const totalWater = this.calculateTotalWater(selectedFoodsList);

    // 如果没有选中的食物，自动关闭弹窗
    if (selectedFoodsList.length === 0 && this.data.showSelectedFoodsPopup) {
      this.onSelectedFoodsPopupClose();
    }

    this.setData({
      selectedFoods,
      selectedFoodsList,
      totalWeight,
      totalWater,
      selectedCount: selectedFoodsList.length
    });
  },

  // 计算总含水量
  calculateTotalWater(foodsList) {
    const totalWater = foodsList.reduce((total, food) => {
      return total + (food.weight * food.waterContent / 100);
    }, 0);
    return parseFloat(totalWater.toFixed(1));
  },

  // 计算总含水量并展示结果
  calculateTotal() {
    if (this.data.selectedFoodsList.length === 0) {
      Toast.fail('请先选择食物');
      return;
    }

    let detailText = '食物含水量明细：\n';
    this.data.selectedFoodsList.forEach(food => {
      const waterAmount = (food.weight * food.waterContent / 100).toFixed(1);
      detailText += `${food.name} (${food.weight}g): ${waterAmount}ml\n`;
    });

    Dialog.alert({
      title: '计算结果',
      message: `您摄入的食物总含水量为：${this.data.totalWater}ml\n\n${detailText}`,
      confirmButtonText: '我知道了',
      confirmButtonColor: this.data.themeColor
    });
  },

  // 显示已选食物弹窗
  showSelectedFoods() {
    if (this.data.selectedFoodsList.length === 0) {
      Toast.fail('请先选择食物');
      return;
    }
    this.setData({
      showSelectedFoodsPopup: true
    });
  },

  // 关闭已选食物弹窗
  onSelectedFoodsPopupClose() {
    this.setData({
      showSelectedFoodsPopup: false
    });
  },
});