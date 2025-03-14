import Dialog from '@vant/weapp/dialog/dialog';
import Toast from '@vant/weapp/toast/toast';

const {
  init
} = require('@cloudbase/wx-cloud-client-sdk')

Page({
  data: {
    // foodData: foodData,
    activeCategory: 0,
    selectedFoods: {},
    selectedFoodsList: [],
    hasSelectedFoods: false,
    totalWater: 0,
    totalWeight: 0,
    selectedCount: 0
  },

  onLoad: async function () {
    // 指定云开发环境 ID
    wx.cloud.init({
      env: "cloud1-8galpdysfe64e2a7",
    })
    const client = init(wx.cloud)
    const models = client.models
    // 页面加载时初始化数据
    const {
      data,
      requestId
    } = await models.table.list({
      getCount: true, // 开启用来获取总数
    });

    console.log('Request ID:', requestId);
    console.log('Records:', data.records);
    console.log('Total:', data.total);
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

    const selectedFoodsList = Object.values(selectedFoods);
    const hasSelectedFoods = selectedFoodsList.length > 0;

    // 计算总重量和总数量
    let totalWeight = 0;
    selectedFoodsList.forEach(food => {
      totalWeight += food.weight;
    });

    this.setData({
      selectedFoods,
      selectedFoodsList,
      hasSelectedFoods,
      totalWeight,
      selectedCount: selectedFoodsList.length
    });

    this.calculateWaterContent();
  },

  // 移除已选食物
  removeFood(event) {
    const foodId = event.currentTarget.dataset.foodId;
    const selectedFoods = {
      ...this.data.selectedFoods
    };

    delete selectedFoods[foodId];

    const selectedFoodsList = Object.values(selectedFoods);
    const hasSelectedFoods = selectedFoodsList.length > 0;

    // 计算总重量和总数量
    let totalWeight = 0;
    selectedFoodsList.forEach(food => {
      totalWeight += food.weight;
    });

    this.setData({
      selectedFoods,
      selectedFoodsList,
      hasSelectedFoods,
      totalWeight,
      selectedCount: selectedFoodsList.length
    });

    this.calculateWaterContent();

    Toast('已删除');
  },

  // 计算含水量
  calculateWaterContent() {
    let totalWater = 0;
    this.data.selectedFoodsList.forEach(food => {
      totalWater += (food.weight * food.waterContent / 100);
    });

    this.setData({
      totalWater: parseFloat(totalWater.toFixed(1))
    });
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
      confirmButtonText: '我知道了'
    });
  }
});