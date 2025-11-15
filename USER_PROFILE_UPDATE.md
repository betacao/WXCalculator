# 用户资料功能更新说明

## 问题背景

由于微信隐私政策更新（2021年4月起），小程序无法通过 `wx.getUserProfile` 接口获取用户的真实昵称和头像，只能获取到：
- 昵称：`微信用户`
- 头像：默认灰色头像

## 解决方案

使用微信官方推荐的**头像昵称填写能力**，让用户主动授权并填写个人信息。

### 实现方式

1. **快速登录**：用户点击登录后，只获取 `openid`（用于数据存储）
2. **手动完善**：用户可以选择头像和输入昵称
3. **本地存储**：用户信息保存在本地，无需每次登录

### 新增功能

#### 1. 快速登录
- 点击"微信登录"后立即登录成功
- 自动生成默认昵称（如：用户A1B2）
- 使用微信默认头像
- 登录成功后提示用户可以完善资料

#### 2. 编辑个人资料
- 点击用户卡片进入编辑页面
- 选择头像：使用微信原生头像选择器
- 输入昵称：支持昵称输入（最多20字符）
- 实时预览：编辑时可以看到效果

#### 3. 状态提示
- 未完善资料时显示"未完善"标签
- 用户描述文字改为"点击编辑个人资料"

## 使用流程

### 用户首次登录
```
1. 点击"微信登录"
   ↓
2. 获取 openid，创建默认资料
   ↓
3. 登录成功，显示默认昵称和头像
   ↓
4. 弹窗提示：点击头像或昵称可以修改个人信息
   ↓
5. 用户可选择是否完善资料
```

### 编辑个人资料
```
1. 点击用户信息卡片
   ↓
2. 进入编辑页面
   ↓
3. 点击头像 → 从相册选择或拍照
   ↓
4. 输入昵称 → 输入真实昵称
   ↓
5. 点击"保存" → 更新完成
```

## 代码改动

### 1. profile.js

**新增方法：**
- `quickLogin()` - 快速登录（仅获取openid）
- `showEditProfileDialog()` - 显示编辑弹窗
- `closeEditProfile()` - 关闭编辑弹窗
- `onChooseAvatar()` - 选择头像回调
- `onNicknameInput()` - 昵称输入回调
- `saveUserInfo()` - 保存用户信息

**移除方法：**
- `getUserProfile()` - 已废弃的获取用户信息方法

**新增数据字段：**
```javascript
{
  showEditProfile: false,  // 是否显示编辑弹窗
  tempNickname: '',        // 临时昵称
  tempAvatar: ''           // 临时头像
}
```

**用户信息结构：**
```javascript
{
  openid: 'xxx',           // 用户唯一标识
  nickName: '用户A1B2',    // 昵称
  avatarUrl: 'https://...',// 头像URL
  needUpdate: true         // 是否需要完善资料
}
```

### 2. profile.wxml

**登录按钮：**
```xml
<!-- 改动前 -->
<button bind:tap="getUserProfile">微信登录</button>

<!-- 改动后 -->
<button bind:tap="quickLogin">微信登录</button>
```

**用户卡片：**
```xml
<!-- 添加点击事件 -->
<view class="user-card" bind:tap="showEditProfileDialog">
  <image src="{{ userInfo.avatarUrl }}" />
  <view class="user-info">
    <view class="nickname">
      {{ userInfo.nickName }}
      <!-- 新增未完善标签 -->
      <van-tag wx:if="{{ userInfo.needUpdate }}">未完善</van-tag>
    </view>
    <!-- 改变描述文字 -->
    <view class="user-desc">点击编辑个人资料</view>
  </view>
  <!-- 新增箭头图标 -->
  <van-icon name="arrow" />
</view>
```

**编辑弹窗：**
```xml
<van-popup show="{{ showEditProfile }}" position="bottom">
  <view class="edit-profile-container">
    <!-- 头像选择 -->
    <button open-type="chooseAvatar" bind:chooseavatar="onChooseAvatar">
      <image src="{{ tempAvatar }}" />
      <view>点击更换</view>
    </button>

    <!-- 昵称输入 -->
    <input
      type="nickname"
      value="{{ tempNickname }}"
      bind:input="onNicknameInput"
    />

    <!-- 保存按钮 -->
    <button bind:tap="saveUserInfo">保存</button>
  </view>
</van-popup>
```

### 3. profile.wxss

新增样式类：
- `.edit-profile-container` - 编辑容器
- `.edit-title` - 标题
- `.edit-item` - 编辑项
- `.edit-label` - 标签
- `.avatar-btn` - 头像按钮
- `.edit-avatar` - 编辑头像
- `.avatar-tip` - 提示文字
- `.nickname-input` - 昵称输入框
- `.edit-tip` - 提示信息
- `.save-btn` - 保存按钮

### 4. profile.json

新增组件引用：
```json
{
  "usingComponents": {
    "van-popup": "@vant/weapp/popup/index",
    "van-tag": "@vant/weapp/tag/index"
  }
}
```

### 5. app.json

新增隐私声明：
```json
{
  "requiredPrivateInfos": [
    "chooseAvatar"
  ]
}
```

## 技术细节

### 头像选择原理

使用微信小程序原生能力 `open-type="chooseAvatar"`：

```xml
<button open-type="chooseAvatar" bind:chooseavatar="onChooseAvatar">
  选择头像
</button>
```

回调事件：
```javascript
onChooseAvatar(e) {
  const { avatarUrl } = e.detail;
  // avatarUrl 是临时文件路径
  // 可以直接使用或上传到服务器
}
```

**注意：**
- 头像是临时文件路径
- 有效期有限
- 建议上传到云存储获取永久URL

### 昵称输入原理

使用 `type="nickname"` 的输入框：

```xml
<input type="nickname" bind:input="onNicknameInput" />
```

特点：
- 支持昵称输入（允许emoji）
- 自动限制特殊字符
- 符合微信规范

### 数据存储

```javascript
// 保存到本地
wx.setStorageSync('userInfo', {
  openid: 'xxx',
  nickName: '用户昵称',
  avatarUrl: 'https://...',
  needUpdate: false
});

// 读取
const userInfo = wx.getStorageSync('userInfo');
```

## 优化建议

### 1. 头像上传到云存储（推荐）

当前实现中，头像是临时文件路径，建议上传到云存储：

```javascript
async onChooseAvatar(e) {
  const { avatarUrl } = e.detail;

  // 上传到云存储
  const cloudPath = `avatars/${Date.now()}-${Math.random()}.png`;
  const result = await wx.cloud.uploadFile({
    cloudPath,
    filePath: avatarUrl
  });

  // 使用云存储URL
  this.setData({
    tempAvatar: result.fileID
  });
}
```

### 2. 同步到数据库

将用户信息同步到云数据库：

```javascript
async saveUserInfo() {
  // 保存到本地
  wx.setStorageSync('userInfo', updatedUserInfo);

  // 同步到云数据库
  const db = wx.cloud.database();
  await db.collection('users').doc(this.data.userInfo.openid).set({
    data: {
      nickName: updatedUserInfo.nickName,
      avatarUrl: updatedUserInfo.avatarUrl,
      updateTime: db.serverDate()
    }
  });
}
```

### 3. 添加默认头像选择

为用户提供一些默认头像选项：

```javascript
const defaultAvatars = [
  '/images/avatar-1.png',
  '/images/avatar-2.png',
  '/images/avatar-3.png',
  // ...
];
```

## 常见问题

### Q1: 头像显示不出来？
**A**: 检查头像URL是否有效，临时路径有时效性，建议上传到云存储。

### Q2: 用户不想填写昵称怎么办？
**A**: 保留默认昵称即可，用户可以随时修改。

### Q3: 如何验证昵称合法性？
**A**: 当前已限制20字符，可以添加更多验证规则：
```javascript
if (!/^[\u4e00-\u9fa5a-zA-Z0-9_]+$/.test(nickname)) {
  Toast.fail('昵称只能包含中英文、数字和下划线');
  return;
}
```

### Q4: 头像文件太大怎么办？
**A**: 可以在上传前压缩：
```javascript
wx.compressImage({
  src: avatarUrl,
  quality: 80,
  success: (res) => {
    // 使用压缩后的图片
  }
});
```

## 测试建议

### 测试用例

1. **登录流程**
   - [ ] 点击登录按钮
   - [ ] 成功获取openid
   - [ ] 显示默认昵称和头像
   - [ ] 弹出完善资料提示

2. **编辑资料**
   - [ ] 点击用户卡片
   - [ ] 打开编辑弹窗
   - [ ] 选择头像
   - [ ] 输入昵称
   - [ ] 保存成功

3. **边界情况**
   - [ ] 昵称为空
   - [ ] 昵称超长
   - [ ] 取消编辑
   - [ ] 重复编辑

## 总结

通过这次更新，解决了微信隐私政策导致的用户信息获取问题，提供了更好的用户体验：

✅ **快速登录** - 无需复杂授权
✅ **自主填写** - 用户主动完善资料
✅ **灵活编辑** - 随时修改个人信息
✅ **符合规范** - 遵循微信最新政策

用户现在可以自由选择头像和昵称，打造个性化的使用体验！
