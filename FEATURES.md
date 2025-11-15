# 功能说明文档

## 新增功能概览

本次更新新增了**用户登录**和**每日摄入记录**功能，用户可以：
- 使用微信账号登录
- 保存每日食物摄入记录
- 查看历史摄入数据
- 统计分析摄入情况

---

## 页面结构

### 1. 计算器页面（首页）
**路径**: `pages/index/index`

**功能**:
- ✅ 搜索食物
- ✅ 浏览分类
- ✅ 选择食物和重量
- ✅ 计算总含水量
- ✅ 保存今日记录（需登录）
- ✅ 数据缓存优化
- ✅ 搜索防抖

**新增功能**:
- 登录状态检测
- 计算结果时提供"保存记录"选项
- 未登录时引导用户登录
- 保存记录后自动清空选择

### 2. 个人中心页面
**路径**: `pages/profile/profile`

**功能**:
- ✅ 微信登录/退出
- ✅ 显示用户信息
- ✅ 数据统计展示
  - 累计记录天数
  - 近7天摄入量
- ✅ 进入历史记录

**交互流程**:
```
未登录 -> 点击"微信登录" -> 授权 -> 获取openid -> 登录成功
已登录 -> 显示用户信息 -> 可查看统计/历史/退出
```

### 3. 历史记录页面
**路径**: `pages/history/history`

**功能**:
- ✅ 显示最近30天记录
- ✅ 数据统计卡片
  - 记录天数
  - 日均摄入
  - 累计摄入
- ✅ 查看记录详情
- ✅ 删除记录
- ✅ 按日期倒序排列

**交互**:
- 点击记录查看详情
- 左滑显示删除按钮
- 删除需二次确认

---

## 数据流程

### 登录流程

```
用户点击登录
    ↓
wx.getUserProfile() 获取用户信息
    ↓
wx.cloud.callFunction('login') 获取openid
    ↓
合并用户信息 + openid
    ↓
保存到本地存储 (wx.setStorageSync)
    ↓
更新页面状态
```

### 保存记录流程

```
用户选择食物 → 计算含水量 → 点击"保存记录"
    ↓
检查登录状态
    ↓
格式化今日日期
    ↓
查询数据库是否存在今日记录
    ↓
存在 → 更新记录    不存在 → 新增记录
    ↓
保存成功 → 清空选择 → 提示成功
```

### 查询记录流程

```
进入历史记录页面
    ↓
检查登录状态（未登录跳转登录页）
    ↓
查询最近30天记录
    ↓
计算统计数据（总天数、日均、累计）
    ↓
渲染列表和统计卡片
```

---

## 核心代码说明

### 1. 微信登录

```javascript
// pages/profile/profile.js
async getUserProfile() {
  // 1. 获取用户信息
  const { userInfo } = await wx.getUserProfile({
    desc: '用于完善用户资料'
  });

  // 2. 调用云函数获取openid
  const loginRes = await wx.cloud.callFunction({
    name: 'login'
  });

  // 3. 合并并保存
  const completeUserInfo = {
    ...userInfo,
    openid: loginRes.result.openid
  };
  wx.setStorageSync('userInfo', completeUserInfo);
}
```

### 2. 保存记录

```javascript
// pages/index/index.js
async saveRecord() {
  const db = wx.cloud.database();
  const today = this.formatDate(new Date());

  // 准备数据
  const recordData = {
    date: today,
    totalWater: this.data.totalWater,
    totalWeight: this.data.totalWeight,
    foods: Object.values(this.data.selectedFoods).map(food => ({
      id: food.id,
      name: food.name,
      weight: food.weight,
      waterContent: food.waterContent,
      waterAmount: this.calculateFoodWater(food)
    })),
    createTime: db.serverDate()
  };

  // 检查今日是否已有记录
  const existRes = await db.collection('water_records')
    .where({ _openid: this.data.userInfo.openid, date: today })
    .get();

  if (existRes.data.length > 0) {
    // 更新
    await db.collection('water_records')
      .doc(existRes.data[0]._id)
      .update({ data: recordData });
  } else {
    // 新增
    await db.collection('water_records')
      .add({ data: recordData });
  }
}
```

### 3. 查询历史记录

```javascript
// pages/history/history.js
async loadRecords() {
  const db = wx.cloud.database();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const res = await db.collection('water_records')
    .where({
      _openid: this.data.userInfo.openid,
      date: db.command.gte(this.formatDate(thirtyDaysAgo))
    })
    .orderBy('date', 'desc')
    .get();

  this.setData({ recordList: res.data });
}
```

---

## 数据库设计

### water_records 集合

| 字段 | 类型 | 说明 |
|------|------|------|
| _id | String | 记录ID（自动） |
| _openid | String | 用户openid（自动） |
| date | String | 日期（YYYY-MM-DD） |
| totalWater | Number | 总含水量（ml） |
| totalWeight | Number | 总重量（g） |
| foods | Array | 食物列表 |
| createTime | Date | 创建时间 |

**foods 数组结构**:
```javascript
{
  id: "食物ID",
  name: "食物名称",
  weight: 200,  // 克
  waterContent: 85,  // 百分比
  waterAmount: 170  // ml
}
```

---

## 权限设计

### 数据库权限
- 使用"仅创建者可读写"
- 每个用户只能访问自己的数据
- 通过 `_openid` 自动隔离

### 页面访问控制
- 历史记录页：需登录才能访问
- 计算器页：未登录可用，但无法保存
- 个人中心：任何状态都可访问

---

## 优化特性

### 性能优化
1. **数据缓存**: 食物数据本地缓存24小时
2. **搜索防抖**: 300ms防抖，减少计算
3. **后台更新**: 使用缓存后台静默更新
4. **懒加载**: 统计数据按需加载

### 用户体验
1. **智能提示**: 未登录时引导登录
2. **记录更新**: 同一天多次保存会更新而非新增
3. **确认对话**: 删除操作需要二次确认
4. **状态反馈**: 加载、成功、失败都有提示

### 数据安全
1. **权限隔离**: 用户只能访问自己的数据
2. **服务器时间**: 使用云端时间避免作弊
3. **数据校验**: 保存前检查数据完整性

---

## 使用场景

### 场景1: 新用户首次使用
1. 打开小程序 → 查看食物数据
2. 选择食物计算含水量
3. 计算结果提示"登录后可保存"
4. 点击"去登录" → 授权登录
5. 返回计算器 → 重新计算 → 保存记录

### 场景2: 老用户每日记录
1. 打开小程序 → 选择今日摄入的食物
2. 点击"计算含水量" → 查看结果
3. 点击"保存记录"
4. 查看"历史记录"了解趋势

### 场景3: 查看历史数据
1. 进入"我的"页面 → 查看统计数据
2. 点击"历史记录" → 浏览过往记录
3. 点击某条记录 → 查看详细食物列表
4. 左滑删除不需要的记录

---

## 后续优化建议

### 功能增强
- [ ] 日历视图选择日期
- [ ] 图表展示摄入趋势
- [ ] 每日目标设置和提醒
- [ ] 导出数据为Excel
- [ ] 分享记录到好友

### 数据分析
- [ ] 周/月报表
- [ ] 饮水充足度分析
- [ ] 食物偏好统计
- [ ] 健康建议推送

### 社交功能
- [ ] 排行榜
- [ ] 打卡功能
- [ ] 好友互动

---

## 技术栈

- **框架**: 微信小程序原生
- **UI组件**: Vant Weapp
- **后端**: 微信云开发
  - 云数据库
  - 云函数
- **存储**:
  - 本地缓存 (wx.storage)
  - 云数据库

---

## 文件清单

### 新增页面
- `pages/profile/` - 个人中心
- `pages/history/` - 历史记录

### 云函数
- `cloudfunctions/login/` - 登录云函数

### 配置文件
- `DATABASE_SETUP.md` - 数据库配置说明
- `FEATURES.md` - 功能说明（本文档）
- `images/README.md` - 图标资源说明

### 更新文件
- `pages/index/index.js` - 添加登录检测和保存功能
- `app.json` - 添加TabBar和新页面路由
