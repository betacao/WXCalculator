# 用户数据保存功能说明

## 功能概述

用户的头像和昵称现在会**永久保存**到云数据库和云存储中，即使换设备登录也能恢复个人信息。

## 数据保存位置

### 1. 云存储（头像）
- **位置**: 微信云开发 → 云存储 → `avatars/` 目录
- **文件命名**: `{openid}_{timestamp}.png`
- **示例**: `avatars/oABCD123_1699999999999.png`
- **URL格式**: `cloud://env-id.xxxx/avatars/xxx.png`

### 2. 云数据库（用户信息）
- **集合**: `users`
- **主键**: openid（用户唯一标识）
- **字段**:
  - `nickName`: 用户昵称
  - `avatarUrl`: 头像云存储URL
  - `createTime`: 创建时间
  - `updateTime`: 最后更新时间

### 3. 本地存储（缓存）
- **位置**: 小程序本地存储
- **作用**: 快速加载，减少网络请求
- **自动同步**: 登录时从数据库同步

## 完整流程

### 首次登录
```
用户点击"微信登录"
    ↓
获取 openid
    ↓
查询数据库 users 集合
    ↓
【新用户】创建默认信息 → 保存到数据库
    ↓
保存到本地缓存
    ↓
登录成功
```

### 再次登录（同设备）
```
打开小程序
    ↓
检查本地缓存
    ↓
有缓存 → 直接使用（快速）
```

### 换设备登录
```
新设备登录
    ↓
获取 openid
    ↓
从数据库读取用户信息
    ↓
恢复昵称和头像
    ↓
保存到新设备本地缓存
    ↓
登录成功（信息完整）
```

### 编辑资料
```
点击用户卡片
    ↓
选择头像 → 上传到云存储 → 获取永久URL
    ↓
输入昵称
    ↓
点击保存
    ↓
同时更新：数据库 + 本地缓存
    ↓
保存成功
```

## 数据结构

### users 集合
```javascript
{
  _id: "oABCD-user123",         // openid（手动指定）
  _openid: "oABCD-user123",     // openid（自动添加）
  nickName: "小明",              // 昵称
  avatarUrl: "cloud://xxx.png", // 头像URL
  createTime: Date,              // 创建时间
  updateTime: Date               // 更新时间
}
```

## 代码实现

### 1. 登录时查询数据库

```javascript
// pages/profile/profile.js - quickLogin()

// 获取 openid
const loginRes = await wx.cloud.callFunction({ name: 'login' });
const openid = loginRes.result.openid;

// 查询数据库
const db = wx.cloud.database();
const userRes = await db.collection('users').doc(openid).get();

if (userRes.data) {
  // 老用户，从数据库加载
  userInfo = {
    openid,
    nickName: userRes.data.nickName,
    avatarUrl: userRes.data.avatarUrl,
    needUpdate: false
  };
} else {
  // 新用户，创建默认信息
  userInfo = { /* 默认信息 */ };

  // 保存到数据库
  await db.collection('users').doc(openid).set({
    data: {
      nickName: userInfo.nickName,
      avatarUrl: userInfo.avatarUrl,
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    }
  });
}

// 保存到本地缓存
wx.setStorageSync('userInfo', userInfo);
```

### 2. 头像上传到云存储

```javascript
// pages/profile/profile.js - onChooseAvatar()

async onChooseAvatar(e) {
  const { avatarUrl } = e.detail;

  // 上传到云存储
  const cloudPath = `avatars/${openid}_${Date.now()}.png`;
  const uploadRes = await wx.cloud.uploadFile({
    cloudPath,
    filePath: avatarUrl  // 临时文件路径
  });

  // 获取永久URL
  const permanentUrl = uploadRes.fileID;

  this.setData({
    tempAvatar: permanentUrl  // 云存储地址
  });
}
```

### 3. 保存到数据库

```javascript
// pages/profile/profile.js - saveUserInfo()

async saveUserInfo() {
  const nickname = this.data.tempNickname.trim();

  // 保存到云数据库
  const db = wx.cloud.database();
  await db.collection('users').doc(openid).update({
    data: {
      nickName: nickname,
      avatarUrl: this.data.tempAvatar,  // 云存储URL
      updateTime: db.serverDate()
    }
  });

  // 同步到本地缓存
  wx.setStorageSync('userInfo', updatedUserInfo);
}
```

## 配置步骤

### 1. 创建 users 集合

1. 打开微信开发者工具
2. 点击"云开发"控制台
3. 进入"数据库"
4. 点击"添加集合"
5. 输入集合名称：`users`
6. 权限设置：**仅创建者可读写**
7. 点击确定

### 2. 验证功能

**测试步骤：**

1. **清除缓存**（重要！）
```javascript
// 在控制台执行
wx.clearStorageSync()
```

2. **首次登录**
   - 点击"微信登录"
   - 完善头像和昵称
   - 点击保存

3. **查看数据库**
   - 云开发控制台 → 数据库 → users
   - 应该能看到你的记录

4. **查看云存储**
   - 云开发控制台 → 云存储
   - 应该能看到 `avatars/` 目录和你的头像

5. **换设备测试**
   - 在另一台设备登录
   - 或清除缓存后重新登录
   - 信息应该自动恢复

## 数据同步策略

### 优先级
1. **登录时**: 优先使用数据库数据（最新）
2. **运行时**: 使用本地缓存（快速）
3. **保存时**: 同时更新数据库和缓存

### 缓存策略
```javascript
// 登录流程
本地缓存 → 仅用于快速显示
数据库  → 权威数据源，登录时加载
云存储  → 存储头像图片

// 更新流程
用户编辑 → 云存储（头像）→ 数据库 → 本地缓存
```

## 优势

### 1. 数据持久化
✅ 头像和昵称永久保存
✅ 换设备自动恢复
✅ 不会丢失

### 2. 性能优化
✅ 本地缓存快速加载
✅ 登录时异步同步
✅ 云存储 CDN 加速

### 3. 安全隔离
✅ 每个用户只能访问自己的数据
✅ openid 自动鉴权
✅ 云端权限控制

## 注意事项

### 1. 云存储配额
- 免费额度：5GB 存储 + 10GB 流量/月
- 头像大小：建议 < 500KB
- 定期清理旧头像（可选）

### 2. 数据库配额
- 免费额度：2GB 存储
- users 集合很小，完全够用

### 3. 头像URL格式
```javascript
// 云存储URL（永久有效）
"cloud://env-id.xxxx/avatars/xxx.png"

// 临时URL（选择头像时获取，有效期短）
"http://tmp/xxx.jpg"
```

### 4. 清理旧头像（可选优化）

每次上传新头像时，可以删除旧的：

```javascript
// 保存新头像前，删除旧头像
if (oldAvatarUrl.startsWith('cloud://')) {
  await wx.cloud.deleteFile({
    fileList: [oldAvatarUrl]
  });
}
```

## 常见问题

### Q1: 头像上传失败？
**A**: 检查云开发环境是否正确初始化，网络是否正常。

### Q2: 换设备后信息丢失？
**A**: 检查是否创建了 users 集合，权限是否正确。

### Q3: 头像显示不出来？
**A**: 检查云存储URL是否有效，网络是否正常。

### Q4: 如何批量清理旧头像？
**A**: 在云开发控制台 → 云存储中手动删除，或写云函数定期清理。

## 数据流程图

```
┌─────────────┐
│  用户登录   │
└──────┬──────┘
       │
       ↓
┌─────────────┐      ┌──────────────┐
│ 查询数据库  │─────→│  users 集合  │
└──────┬──────┘      └──────────────┘
       │
       ↓
┌─────────────┐
│ 加载到本地  │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ 用户编辑    │
└──────┬──────┘
       │
       ↓
┌─────────────┐      ┌──────────────┐
│ 上传头像    │─────→│  云存储      │
└──────┬──────┘      └──────────────┘
       │
       ↓
┌─────────────┐      ┌──────────────┐
│ 保存信息    │─────→│  数据库      │
└──────┬──────┘      └──────────────┘
       │
       ↓
┌─────────────┐      ┌──────────────┐
│ 更新缓存    │─────→│  本地存储    │
└─────────────┘      └──────────────┘
```

## 总结

现在用户的头像和昵称：
- ✅ 保存在云数据库中（永久）
- ✅ 头像存储在云存储中（永久URL）
- ✅ 本地缓存加速加载
- ✅ 换设备自动恢复
- ✅ 数据安全隔离

完全不用担心数据丢失了！🎉
