# 数据库配置说明

## 云开发数据库集合

本项目使用微信云开发，需要创建以下数据库集合：

### 1. users（用户信息集合）

**集合名称**: `users`

**权限设置**:
- 仅创建者可读写（推荐）

**字段说明**:

```javascript
{
  "_id": "用户openid（手动指定，与openid相同）",
  "_openid": "用户openid（自动添加）",
  "nickName": "用户昵称",
  "avatarUrl": "头像URL（云存储地址）",
  "createTime": "创建时间（服务器时间）",
  "updateTime": "更新时间（服务器时间）"
}
```

**索引建议**:
- `_id` 主键索引（自动）

**示例数据**:

```json
{
  "_id": "oABCD-user123",
  "_openid": "oABCD-user123",
  "nickName": "小明",
  "avatarUrl": "cloud://xxx.png",
  "createTime": "2025-11-14T10:00:00.000Z",
  "updateTime": "2025-11-14T15:30:00.000Z"
}
```

### 2. water_records（摄入记录集合）

**集合名称**: `water_records`

**权限设置**:
- 仅创建者可读写（推荐）
- 或自定义安全规则

**字段说明**:

```javascript
{
  "_id": "记录唯一ID（自动生成）",
  "_openid": "用户openid（自动添加）",
  "date": "记录日期，格式: YYYY-MM-DD",
  "totalWater": "总含水量（ml）",
  "totalWeight": "总重量（g）",
  "foods": [
    {
      "id": "食物ID",
      "name": "食物名称",
      "weight": "重量（g）",
      "waterContent": "含水百分比",
      "waterAmount": "该食物的含水量（ml）"
    }
  ],
  "createTime": "创建时间（服务器时间）"
}
```

**索引建议**:
- `_openid` + `date` 组合索引（用于查询用户某天的记录）
- `_openid` + `createTime` 组合索引（用于查询用户历史记录）

**示例数据**:

```json
{
  "_id": "abc123",
  "_openid": "oABCD-user123",
  "date": "2025-11-14",
  "totalWater": 850.5,
  "totalWeight": 1200,
  "foods": [
    {
      "id": "1001",
      "name": "苹果",
      "weight": 200,
      "waterContent": 85,
      "waterAmount": 170
    },
    {
      "id": "2005",
      "name": "西瓜",
      "weight": 1000,
      "waterContent": 93,
      "waterAmount": 930
    }
  ],
  "createTime": "2025-11-14T10:30:00.000Z"
}
```

## 云函数部署

### login 云函数

**路径**: `cloudfunctions/login/`

**功能**: 获取用户的 openid

**部署步骤**:

1. 在微信开发者工具中，右键点击 `cloudfunctions/login` 目录
2. 选择"上传并部署：云端安装依赖"
3. 等待部署完成

**使用方式**:

```javascript
const res = await wx.cloud.callFunction({
  name: 'login'
});
console.log('openid:', res.result.openid);
```

## 配置步骤

### 1. 开通云开发

1. 在微信开发者工具中点击"云开发"按钮
2. 按照提示开通云开发服务（免费额度足够个人使用）
3. 创建一个云环境（记录环境ID）

### 2. 更新环境ID

在 `pages/index/index.js` 文件中，更新云环境ID：

```javascript
const CONFIG = {
  CLOUD_ENV: 'your-env-id', // 替换为你的云环境ID
  // ... 其他配置
};
```

### 3. 创建数据库集合

需要创建两个集合：

**集合1：users（用户信息）**
1. 在微信开发者工具的"云开发"控制台中
2. 进入"数据库"页面
3. 点击"添加集合"
4. 输入集合名称: `users`
5. 设置权限为"仅创建者可读写"

**集合2：water_records（摄入记录）**
1. 继续点击"添加集合"
2. 输入集合名称: `water_records`
3. 设置权限为"仅创建者可读写"

### 4. 部署云函数

1. 右键点击 `cloudfunctions/login` 目录
2. 选择"上传并部署：云端安装依赖"
3. 等待部署完成（首次可能需要1-2分钟）

### 5. 测试功能

1. 在模拟器或真机中运行小程序
2. 点击"我的"标签进入个人中心
3. 点击"微信登录"按钮测试登录功能
4. 登录成功后，在计算器页面选择食物并计算
5. 点击"保存记录"测试保存功能
6. 在"历史记录"页面查看保存的数据

## 数据库操作权限

推荐使用"仅创建者可读写"权限，这样：
- ✅ 用户只能读写自己的数据
- ✅ 无需编写复杂的权限规则
- ✅ 数据安全有保障

如果需要更精细的权限控制，可以自定义安全规则：

```javascript
{
  "read": "doc._openid == auth.openid",
  "write": "doc._openid == auth.openid"
}
```

## 常见问题

### Q1: 云函数调用失败？
**A**: 检查云函数是否部署成功，环境ID是否正确

### Q2: 无法保存数据？
**A**: 检查数据库集合是否创建，权限设置是否正确

### Q3: 登录失败？
**A**: 确保小程序已关联云开发环境，云函数已正确部署

### Q4: 查询不到历史记录？
**A**: 检查用户是否已登录，数据库中是否有该用户的记录

## 免费额度

微信云开发免费额度（每月）：
- 数据库: 2GB 存储 + 5GB 流量
- 云函数: 4万次调用 + 4万GB·秒资源使用量
- 云存储: 5GB 容量 + 10GB 下载流量

对于个人小程序，免费额度完全足够使用！
