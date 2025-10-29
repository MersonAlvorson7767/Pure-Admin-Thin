# 项目架构文档索引

本文档提供了 Pure Admin Thin 项目的完整架构说明，帮助开发者快速理解项目结构并开始开发新功能。

## 📚 文档列表

### 1. [ARCHITECTURE.md](./ARCHITECTURE.md) - 完整架构文档 ⭐

**适用对象**: 新加入项目的开发者、需要深入了解项目架构的开发者

**内容包括**:
- 项目技术栈详解
- 完整目录结构说明
- 核心架构设计（路由、状态管理、API 层等）
- views/extra 目录详细说明
- 添加新功能的完整流程
- 构建和部署指南
- 最佳实践和常见问题

### 2. [docs/QUICK_REFERENCE.md](./docs/QUICK_REFERENCE.md) - 快速参考指南

**适用对象**: 熟悉项目的开发者、需要快速查找代码片段的开发者

**内容包括**:
- 项目快速启动命令
- 添加新页面的快速步骤
- 常用代码片段（表格、表单、对话框等）
- 路由配置参数速查
- Element Plus 图标列表
- 工具函数使用示例

### 3. [docs/VIEWS_EXTRA_GUIDE.md](./docs/VIEWS_EXTRA_GUIDE.md) - views/extra 开发指南

**适用对象**: 在 views/extra 目录下开发业务功能的开发者

**内容包括**:
- 当前功能模块说明
- 新增功能页面的标准流程
- 代码规范和最佳实践
- 常见问题解答

## 🚀 快速开始

### 新手入门流程

如果你是第一次接触这个项目，建议按以下顺序阅读文档：

1. **先阅读** [ARCHITECTURE.md](./ARCHITECTURE.md) 的"项目概述"和"项目目录结构"部分，了解项目整体架构
2. **然后阅读** [ARCHITECTURE.md](./ARCHITECTURE.md) 的"核心架构"部分，理解路由、状态管理等核心机制
3. **重点阅读** [ARCHITECTURE.md](./ARCHITECTURE.md) 的"views/extra 目录详解"部分，这是你主要的工作目录
4. **参考** [QUICK_REFERENCE.md](./docs/QUICK_REFERENCE.md) 获取常用代码片段

### 开始开发新功能

当你需要在 `views/extra` 目录下添加新功能时：

1. **查看** [ARCHITECTURE.md](./ARCHITECTURE.md) 中的"添加新功能的完整流程"
2. **参考** [QUICK_REFERENCE.md](./docs/QUICK_REFERENCE.md) 中的快速步骤和代码片段
3. **查阅** 现有的功能模块（如 `statistics`、`bill` 等）作为参考

## 🎯 核心概念

### 路由系统

- **自动导入**: `src/router/modules/` 下的所有路由模块会被自动导入
- **懒加载**: 所有页面组件使用动态导入实现按需加载
- **层级扁平化**: 三级及以上路由会自动转换为二级路由

示例路由配置已添加详细注释：
- `src/router/modules/statistics.ts`
- `src/router/modules/bill.ts`

### views/extra 目录

这是存放所有业务功能页面的核心目录。当前包含：

```
views/extra/
├── batch-statistics/    # 批次统计
├── bill/                # 账单管理
├── sms-chat/            # 短信聊天
├── statistics/          # 数据统计
└── unsent-yesterday/    # 昨日未发送
```

**新功能都应该在这个目录下创建！**

### API 层

- 位置: `src/api/`
- 每个业务模块对应一个 API 文件
- 使用统一的 HTTP 工具封装

### 国际化

- 语言文件: `locales/zh-CN.yaml`、`locales/en.yaml`
- 模板中使用: `{{ $t('menus.featureName') }}`
- 代码中使用: `t('menus.featureName')`

## 📝 开发规范

### 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件文件名 | kebab-case | `my-feature.vue` |
| 路由 path | kebab-case | `/my-feature` |
| 路由 name | PascalCase | `MyFeature` |
| 变量/方法 | camelCase | `loadData` |
| 常量 | UPPER_CASE | `MAX_COUNT` |

### 目录结构

```
my-feature/
├── index.vue           # 列表页
├── detail.vue          # 详情页（可选）
└── components/         # 私有组件（可选）
```

### TypeScript

- 为所有函数参数和返回值添加类型
- 定义 interface 描述数据结构
- 使用泛型提高代码复用性

## 🛠️ 开发工具

### 推荐 VS Code 插件

- Vue Language Features (Volar)
- TypeScript Vue Plugin (Volar)
- ESLint
- Prettier
- Tailwind CSS IntelliSense

### 常用命令

```bash
# 开发
pnpm dev              # 启动开发服务器
pnpm build            # 构建生产版本
pnpm preview          # 预览生产构建

# 代码质量
pnpm lint             # 代码检查和格式化
pnpm typecheck        # TypeScript 类型检查

# 清理
pnpm clean:cache      # 清理缓存和重新安装依赖
```

## 🔗 相关资源

- **官方文档**: https://yiming_chang.gitee.io/pure-admin-doc/
- **GitHub**: https://github.com/pure-admin/pure-admin-thin
- **Element Plus**: https://element-plus.org/
- **Vue 3**: https://cn.vuejs.org/
- **Pinia**: https://pinia.vuejs.org/zh/
- **Vite**: https://cn.vitejs.dev/

## 💡 提示

- **查找示例**: 遇到问题时，先查看现有代码中是否有类似实现
- **保持一致**: 新代码应该与现有代码保持相同的风格和结构
- **及时提问**: 遇到不理解的地方及时提问，不要盲目修改
- **测试充分**: 在提交代码前充分测试各种场景

## 📞 获取帮助

如果你在开发过程中遇到问题：

1. 先查阅本文档和相关文档
2. 查看现有代码中的类似实现
3. 搜索 GitHub Issues
4. 向团队成员寻求帮助

---

**文档维护**: 请在添加新功能或修改架构时及时更新相关文档

**最后更新**: 2025-10-29
