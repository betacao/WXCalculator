# 食物含水量计算器

一个帮助用户计算每日食物摄入含水量的微信小程序。

[![微信小程序](https://img.shields.io/badge/%E5%BE%AE%E4%BF%A1-%E5%B0%8F%E7%A8%8B%E5%BA%8F-brightgreen)](https://mp.weixin.qq.com/)
[![云开发](https://img.shields.io/badge/%E4%BA%91%E5%BC%80%E5%8F%91-enabled-blue)](https://cloud.weixin.qq.com/)

## 功能特性

### 核心功能
- 🔍 **智能搜索** - 快速搜索食物，支持实时过滤
- 📊 **精确计算** - 计算食物总含水量，支持多种食物组合
- 📱 **分类浏览** - 按食物分类浏览，方便快速选择
- 💾 **数据缓存** - 本地缓存食物数据，离线可用

### 用户系统
- 🔐 **微信登录** - 一键登录，安全便捷
- 📝 **每日记录** - 保存每日摄入记录，长期追踪
- 📈 **数据统计** - 累计天数、日均摄入、总量统计
- 📜 **历史查询** - 查看最近30天历史记录

### 技术亮点
- ⚡ **性能优化** - 搜索防抖、数据缓存、懒加载
- 🎨 **精美UI** - 基于Vant Weapp组件库
- ☁️ **云开发** - 微信云数据库 + 云函数
- 🔒 **数据安全** - 权限隔离，用户数据独立

## 快速开始

### 前提条件

- 微信开发者工具
- 微信小程序账号
- 开通云开发服务

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/BetaCao/WXCalculator.git
cd WXCalculator
```

2. **配置云开发**
   - 开通云开发服务
   - 创建数据库集合 `water_records`
   - 部署云函数 `login`
   - 更新环境ID（详见配置说明）

3. **准备图标**
   - 在 `images/` 目录放置TabBar图标
   - 或临时注释 `app.json` 中的TabBar配置

4. **运行项目**
   - 用微信开发者工具打开项目
   - 点击编译运行

**详细配置步骤请查看：** [快速开始指南](QUICKSTART.md)

## 文档导航

- 📖 [快速开始指南](QUICKSTART.md) - 从零开始配置项目
- 🗄️ [数据库配置说明](DATABASE_SETUP.md) - 云开发数据库详细配置
- 🎯 [功能说明文档](FEATURES.md) - 详细功能介绍和技术说明
- 📝 [更新日志](UPDATE_LOG.md) - 版本更新记录
- 🖼️ [图标资源说明](images/README.md) - TabBar图标要求

## 项目结构

```
WXCalculator/
├── pages/                    # 页面目录
│   ├── index/               # 计算器主页
│   ├── profile/             # 个人中心
│   └── history/             # 历史记录
├── cloudfunctions/          # 云函数目录
│   └── login/              # 登录云函数
├── images/                  # 图片资源
├── miniprogram_npm/         # npm构建产物
├── app.js                   # 小程序入口
├── app.json                 # 全局配置
├── app.wxss                 # 全局样式
└── *.md                     # 文档文件
```

## 技术栈

- **前端框架**: 微信小程序原生
- **UI组件**: [Vant Weapp](https://vant-contrib.gitee.io/vant-weapp/) v1.11.7
- **后端服务**: 微信云开发
  - 云数据库
  - 云函数
- **数据管理**: 本地缓存 + 云端存储

## 核心数据结构

### 食物数据
```javascript
{
  id: "食物ID",
  name: "食物名称",
  waterContent: 85,  // 含水百分比
  icon: "图标URL"
}
```

### 摄入记录
```javascript
{
  date: "2025-11-14",
  totalWater: 850,      // ml
  totalWeight: 1000,    // g
  foods: [...]          // 食物列表
}
```

## 功能截图

> TODO: 添加小程序截图

## 性能指标

- 首屏加载：< 1s（使用缓存）
- 搜索响应：< 300ms（防抖优化）
- 数据保存：< 500ms
- 缓存有效期：24小时

## 开发计划

### v2.1 (进行中)
- [ ] 图表数据可视化
- [ ] 每日目标设置
- [ ] 消息提醒功能

### v2.2 (规划中)
- [ ] 日历视图
- [ ] 周/月度报表
- [ ] 健康建议推送
- [ ] 数据导出功能

查看完整计划：[更新日志](UPDATE_LOG.md)

## 常见问题

### Q: 如何开通云开发？
A: 在微信开发者工具中点击"云开发"按钮，按提示操作即可。免费额度足够个人使用。

### Q: TabBar图标在哪里获取？
A: 可以从 [iconfont](https://www.iconfont.cn/) 或 [iconpark](https://iconpark.oceanengine.com/) 下载。详见 [图标说明](images/README.md)。

### Q: 数据会丢失吗？
A: 数据保存在微信云数据库中，安全可靠。本地缓存仅用于提升性能。

更多问题请查看：[快速开始指南](QUICKSTART.md#常见问题解决)

## 贡献指南

欢迎提交 Issue 和 Pull Request！

### 开发流程
1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 致谢

- [Vant Weapp](https://github.com/youzan/vant-weapp) - 优秀的小程序UI组件库
- [微信云开发](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html) - 强大的云服务
- 所有贡献者和使用者

## 联系方式

- GitHub: [@BetaCao](https://github.com/BetaCao)
- Email: your-email@example.com
- 项目主页: https://github.com/BetaCao/WXCalculator

---

**如果这个项目对你有帮助，请给一个 ⭐️ Star 支持一下！**
