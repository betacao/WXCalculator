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
 * 保存今日摄入记录（叠加模式）
 * @param {Object} params - 参数对象
 * @param {string} params.openid - 用户openid
 * @param {Array} params.selectedFoods - 选中的食物
 * @param {number} params.totalWater - 总含水量
 * @param {number} params.totalWeight - 总重量
 * @returns {Promise<void>}
 */
export async function saveTodayRecord({ openid, selectedFoods, totalWater, totalWeight }) {
  const db = wx.cloud.database();
  const _ = db.command;
  const today = formatDate(new Date());

  // 准备要添加的食物数据
  const newFoods = Object.values(selectedFoods).map(food => ({
    id: food.id,
    name: food.name,
    weight: food.weight,
    waterContent: food.waterContent,
    waterAmount: calculateFoodWater(food)
  }));

  // 检查今天是否已有记录
  const existRes = await db.collection('water_records')
    .where({
      _openid: openid,
      date: today
    })
    .get();

  if (existRes.data.length > 0) {
    // 叠加到已有记录
    const existingRecord = existRes.data[0];
    await db.collection('water_records')
      .doc(existingRecord._id)
      .update({
        data: {
          totalWater: _.inc(totalWater),  // 累加含水量
          totalWeight: _.inc(totalWeight),  // 累加重量
          foods: _.push(newFoods),  // 添加新食物到数组
          updateTime: db.serverDate()
        }
      });
    return { isUpdate: true };
  } else {
    // 新增记录
    await db.collection('water_records').add({
      data: {
        date: today,
        totalWater,
        totalWeight,
        foods: newFoods,
        createTime: db.serverDate()
      }
    });
    return { isUpdate: false };
  }
}
