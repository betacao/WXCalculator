/**
 * 摄入记录模块 - 处理每日摄入记录的保存和查询
 */

import { formatDate } from './format';

/**
 * 计算单个食物的含水量
 * @param {Object} food - 食物对象
 * @returns {number} 含水量(ml)
 */
export function calculateFoodWater(food) {
  return parseFloat((food.weight * food.waterContent / 100).toFixed(1));
}

/**
 * 保存今日摄入记录
 * @param {Object} params - 参数对象
 * @param {string} params.openid - 用户openid
 * @param {Array} params.selectedFoods - 选中的食物
 * @param {number} params.totalWater - 总含水量
 * @param {number} params.totalWeight - 总重量
 * @returns {Promise<void>}
 */
export async function saveTodayRecord({ openid, selectedFoods, totalWater, totalWeight }) {
  const db = wx.cloud.database();
  const today = formatDate(new Date());

  // 准备保存的数据
  const recordData = {
    date: today,
    totalWater,
    totalWeight,
    foods: Object.values(selectedFoods).map(food => ({
      id: food.id,
      name: food.name,
      weight: food.weight,
      waterContent: food.waterContent,
      waterAmount: calculateFoodWater(food)
    })),
    createTime: db.serverDate()
  };

  // 检查今天是否已有记录
  const existRes = await db.collection('water_records')
    .where({
      _openid: openid,
      date: today
    })
    .get();

  if (existRes.data.length > 0) {
    // 更新已有记录
    await db.collection('water_records')
      .doc(existRes.data[0]._id)
      .update({
        data: recordData
      });
    return { isUpdate: true };
  } else {
    // 新增记录
    await db.collection('water_records').add({
      data: recordData
    });
    return { isUpdate: false };
  }
}
