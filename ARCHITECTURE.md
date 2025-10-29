# Pure Admin Thin 项目架构文档

## 项目概述

Pure Admin Thin 是一个基于 Vue 3 + TypeScript + Vite + Element Plus + Tailwind CSS 的现代化后台管理系统框架。

### 技术栈

- **前端框架**: Vue 3 (Composition API)
- **类型系统**: TypeScript
- **构建工具**: Vite 7
- **UI 框架**: Element Plus 2
- **样式**: Tailwind CSS 4 + SCSS
- **状态管理**: Pinia 3
- **路由**: Vue Router 4
- **国际化**: Vue I18n
- **HTTP 客户端**: Axios
- **图标**: @iconify/vue + Element Plus Icons

---

## 项目目录结构

```
Pure-Admin-Thin/
├── build/                    # 构建配置
│   ├── plugins.ts           # Vite 插件配置
│   ├── optimize.ts          # 依赖优化配置
│   └── utils.ts             # 构建工具函数
├── locales/                 # 国际化语言文件
│   ├── en.yaml             # 英文
│   └── zh-CN.yaml          # 中文
├── mock/                    # Mock 数据（开发环境）
├── public/                  # 静态资源
├── src/                     # 源代码目录
│   ├── api/                # API 接口定义
│   ├── assets/             # 资源文件（图片、图标等）
│   ├── components/         # 全局公共组件
│   ├── config/             # 应用配置
│   ├── directives/         # 全局指令
│   ├── layout/             # 布局组件
│   ├── plugins/            # 插件配置
│   ├── router/             # 路由配置
│   │   ├── modules/       # 路由模块
│   │   ├── index.ts       # 路由主文件
│   │   └── utils.ts       # 路由工具函数
│   ├── store/              # Pinia 状态管理
│   │   ├── modules/       # 状态模块
│   │   ├── index.ts       # Store 主文件
│   │   └── types.ts       # 类型定义
│   ├── style/              # 全局样式
│   ├── types/              # TypeScript 类型定义
│   ├── utils/              # 工具函数
│   ├── views/              # 页面组件
│   │   ├── error/         # 错误页面 (403, 404, 500)
│   │   ├── extra/         # 业务功能页面 ⭐
│   │   ├── login/         # 登录页面
│   │   ├── permission/    # 权限相关页面
│   │   └── welcome/       # 欢迎页
│   ├── App.vue            # 根组件
│   └── main.ts            # 入口文件
├── types/                   # 全局类型定义
├── .env                     # 环境变量
├── .env.development         # 开发环境变量
├── .env.production          # 生产环境变量
├── package.json             # 项目依赖
├── tsconfig.json            # TypeScript 配置
└── vite.config.ts           # Vite 配置
```

---

## 核心架构

### 1. 应用入口 (main.ts)

应用入口负责初始化 Vue 应用和各种插件：

```typescript
// 1. 全局 polyfills
import "@/utils/globalPolyfills.ts";
import CryptoJS from "crypto-js";

// 2. 创建 Vue 应用
const app = createApp(App);

// 3. 注册全局组件和指令
// - 自定义指令 (@/directives)
// - 图标组件 (IconifyIcon, FontIcon)
// - 权限组件 (Auth, Perms)
// - Tippy 提示组件

// 4. 配置插件
// - Pinia (状态管理)
// - Vue Router (路由)
// - Vue I18n (国际化)
// - Element Plus (UI)
// - Motion (动画)
// - PureAdmin Table (表格)

// 5. 挂载应用
app.mount("#app");
```

### 2. 路由系统 (src/router)

#### 路由架构特点

1. **自动化路由导入**: 使用 Vite 的 `import.meta.glob` 自动导入 `modules/` 目录下的所有路由模块
2. **层级扁平化**: 三级及以上路由自动扁平化为二级路由（提升性能）
3. **菜单与路由分离**: 
   - `constantRoutes`: 用于 Vue Router 的扁平化路由
   - `constantMenus`: 用于渲染菜单的原始层级路由
4. **动态路由**: 支持根据权限动态加载路由

#### 路由模块结构

每个路由模块 (`src/router/modules/*.ts`) 遵循统一格式：

```typescript
export default {
  path: "/feature-name",           // 路由路径
  name: "FeatureName",              // 路由名称（唯一）
  component: () => import("@/layout/index.vue"), // 使用布局组件
  redirect: "/feature-name/index",  // 重定向路径
  meta: {
    icon: "ep:icon-name",           // 菜单图标
    title: "功能名称",               // 菜单标题（支持 i18n）
    rank: 100,                       // 排序权重
    showLink: true,                  // 是否在菜单中显示
    roles: ["admin"]                 // 权限角色（可选）
  },
  children: [                        // 子路由
    {
      path: "/feature-name/index",
      name: "FeatureNameIndex",
      component: () => import("@/views/extra/feature-name/index.vue"),
      meta: {
        title: "功能页面",
        keepAlive: false,            // 是否缓存组件
        showLink: false              // 不在菜单中显示（父级已显示）
      }
    }
  ]
};
```

#### 路由守卫

`router/index.ts` 中实现了完整的路由守卫：

- **beforeEach**: 
  - 登录状态检查
  - 权限验证
  - 页面标题设置
  - KeepAlive 缓存管理
  - 动态路由初始化

- **afterEach**: 
  - NProgress 进度条结束

### 3. 状态管理 (src/store)

使用 Pinia 进行状态管理，模块化设计：

```
store/
├── modules/
│   ├── app.ts          # 应用全局状态（侧边栏、设备类型等）
│   ├── epTheme.ts      # Element Plus 主题
│   ├── multiTags.ts    # 多标签页状态
│   ├── permission.ts   # 权限和路由状态
│   ├── settings.ts     # 系统设置
│   └── user.ts         # 用户信息
├── index.ts            # Store 导出
└── types.ts            # 类型定义
```

#### 关键 Store 模块

**permission.ts**: 管理路由和权限
```typescript
export const usePermissionStore = defineStore("pure-permission", {
  state: () => ({
    wholeMenus: [],        // 完整菜单
    cachePageList: []      // 缓存页面列表
  }),
  actions: {
    asyncActionRoutes(),   // 异步加载路由
    clearAllCachePage()    // 清空所有缓存页面
  }
});
```

**multiTags.ts**: 管理多标签页
```typescript
export const useMultiTagsStore = defineStore("pure-multiTags", {
  state: () => ({
    multiTags: [],         // 标签页列表
    multiTagsCache: false  // 是否启用标签页缓存
  }),
  actions: {
    handleTags(mode, value) // 操作标签页（push/delete等）
  }
});
```

### 4. API 层 (src/api)

API 层采用模块化设计，每个模块对应一个业务领域：

```
api/
├── user.ts              # 用户相关 API
├── routes.ts            # 路由相关 API
├── statistics.ts        # 统计相关 API
├── bill.ts              # 账单相关 API
├── smsChat.ts           # 短信聊天相关 API
└── batch-statistics.ts  # 批次统计相关 API
```

#### API 定义模式

```typescript
import { http } from "@/utils/http";

/** 获取统计列表 */
export const getStatisticsList = (params: {
  pageSize: number;
  pageNum: number;
}) => {
  return http.request<ResponseType>("post", "/statistics/list", { 
    data: params 
  });
};
```

#### HTTP 工具 (src/utils/http)

基于 Axios 封装，提供：
- 请求/响应拦截器
- 错误处理
- Token 自动注入
- 请求取消
- 重试机制

### 5. 布局系统 (src/layout)

布局组件采用响应式设计，支持多种布局模式：

```
layout/
├── components/
│   ├── lay-navbar/      # 导航栏
│   ├── lay-sidebar/     # 侧边栏
│   │   ├── NavVertical.vue   # 垂直菜单
│   │   └── NavHorizontal.vue # 水平菜单
│   ├── lay-tag/         # 标签页
│   ├── lay-content/     # 内容区
│   └── lay-setting/     # 设置面板
├── hooks/
│   ├── useLayout.ts     # 布局 Hook
│   └── useDataThemeChange.ts # 主题切换 Hook
└── index.vue            # 布局主组件
```

#### 布局模式

1. **vertical**: 左侧菜单模式（默认）
2. **horizontal**: 顶部菜单模式
3. **mix**: 混合模式（顶部+左侧）

### 6. 组件系统 (src/components)

全局可复用组件：

```
components/
├── ReAuth/              # 权限验证组件
├── RePerms/             # 权限指令组件
├── ReIcon/              # 图标组件
│   ├── offlineIcon.ts  # 离线图标注册
│   ├── IconifyIconOffline.vue
│   └── IconifyIconOnline.vue
├── ReDialog/            # 对话框组件
├── RePureTableBar/      # 表格工具栏
├── ReSegmented/         # 分段控制器
├── ReText/              # 文本组件
└── DateTimeRangePicker.vue # 日期时间范围选择器
```

### 7. 工具函数 (src/utils)

```
utils/
├── http/                # HTTP 请求封装
├── auth.ts              # 认证工具
├── crypto.ts            # 加密工具
├── tree.ts              # 树形数据处理
├── message.ts           # 消息提示
├── progress/            # 进度条
├── responsive.ts        # 响应式工具
└── localforage/         # 本地存储
```

---

## views/extra 目录详解 ⭐

`views/extra` 是存放业务功能页面的核心目录。当前包含以下功能模块：

```
views/extra/
├── batch-statistics/    # 批次统计
│   └── index.vue
├── bill/                # 账单管理
│   └── index.vue
├── sms-chat/            # 短信聊天
│   ├── index.vue
│   └── index_back.vue
├── statistics/          # 数据统计
│   └── index.vue
└── unsent-yesterday/    # 昨日未发送
    └── index.vue
```

### 页面组件标准结构

每个页面组件遵循 Vue 3 Composition API 的标准结构：

```vue
<template>
  <div class="page-content feature-page">
    <!-- 1. 页面标题 -->
    <h1>{{ $t('menus.featureName') }}</h1>

    <!-- 2. 工具栏 -->
    <div class="toolbar-section">
      <el-button type="primary" @click="handleAction">
        {{ $t('buttons.action') }}
      </el-button>
    </div>

    <!-- 3. 数据展示 (表格/卡片/表单等) -->
    <el-table 
      :data="tableData" 
      v-loading="loading"
      :header-cell-style="headerStyle"
    >
      <el-table-column prop="field" :label="$t('labels.field')" />
    </el-table>

    <!-- 4. 分页 -->
    <el-pagination
      v-model:current-page="pagination.currentPage"
      v-model:page-size="pagination.pageSize"
      :total="pagination.total"
      @current-change="handlePageChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { getDataApi } from "@/api/feature";
import { message } from "@/utils/message";

// 1. 响应式数据
const loading = ref(false);
const tableData = ref([]);
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
});

// 2. 方法
const loadData = async () => {
  loading.value = true;
  try {
    const { data } = await getDataApi({
      pageNum: pagination.currentPage,
      pageSize: pagination.pageSize
    });
    tableData.value = data.list;
    pagination.total = data.total;
  } catch (error) {
    message.error("加载失败");
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (page: number) => {
  pagination.currentPage = page;
  loadData();
};

// 3. 生命周期
onMounted(() => {
  loadData();
});
</script>

<style scoped lang="scss">
.page-content {
  padding: 20px;
}

.toolbar-section {
  margin-bottom: 16px;
}
</style>
```

### 页面开发规范

#### 1. 国际化支持

所有文本使用 `$t()` 函数，在 `locales/zh-CN.yaml` 和 `locales/en.yaml` 中定义：

```yaml
# locales/zh-CN.yaml
menus:
  featureName: 功能名称

buttons:
  action: 操作按钮

labels:
  field: 字段名
```

#### 2. API 调用

在 `src/api/` 目录下创建对应的 API 文件：

```typescript
// src/api/feature.ts
import { http } from "@/utils/http";

export const getDataApi = (params: { pageNum: number; pageSize: number }) => {
  return http.request<ResponseType>("post", "/feature/list", { data: params });
};
```

#### 3. 路由配置

在 `src/router/modules/` 创建对应路由模块：

```typescript
// src/router/modules/feature.ts
export default {
  path: "/feature",
  name: "Feature",
  component: () => import("@/layout/index.vue"),
  redirect: "/feature/index",
  meta: {
    icon: "ep:document",
    title: "menus.featureName",  // 使用 i18n key
    rank: 100
  },
  children: [
    {
      path: "/feature/index",
      name: "FeatureIndex",
      component: () => import("@/views/extra/feature/index.vue"),
      meta: {
        title: "menus.featureName",
        keepAlive: false
      }
    }
  ]
};
```

#### 4. 样式规范

- 使用 Tailwind CSS 工具类优先
- 组件级样式使用 `<style scoped lang="scss">`
- 全局样式在 `src/style/` 目录下定义

#### 5. TypeScript 类型定义

在 `src/types/` 或组件内定义类型：

```typescript
interface DataItem {
  id: number;
  name: string;
  status: number;
}

interface PaginationParams {
  pageNum: number;
  pageSize: number;
}
```

---

## 添加新功能的完整流程

### 步骤 1: 创建页面组件

```bash
# 在 views/extra 下创建新目录
mkdir -p src/views/extra/new-feature

# 创建 index.vue
touch src/views/extra/new-feature/index.vue
```

### 步骤 2: 编写页面组件

```vue
<!-- src/views/extra/new-feature/index.vue -->
<template>
  <div class="page-content new-feature-page">
    <h1>{{ $t('menus.newFeature') }}</h1>
    <!-- 页面内容 -->
  </div>
</template>

<script setup lang="ts">
// 组件逻辑
</script>

<style scoped lang="scss">
// 组件样式
</style>
```

### 步骤 3: 创建 API 接口

```typescript
// src/api/newFeature.ts
import { http } from "@/utils/http";

export const getNewFeatureList = (params: any) => {
  return http.request<any>("post", "/new-feature/list", { data: params });
};
```

### 步骤 4: 配置路由

```typescript
// src/router/modules/newFeature.ts
export default {
  path: "/new-feature",
  name: "NewFeature",
  component: () => import("@/layout/index.vue"),
  redirect: "/new-feature/index",
  meta: {
    icon: "ep:star",
    title: "menus.newFeature",
    rank: 110
  },
  children: [
    {
      path: "/new-feature/index",
      name: "NewFeatureIndex",
      component: () => import("@/views/extra/new-feature/index.vue"),
      meta: {
        title: "menus.newFeature",
        keepAlive: false
      }
    }
  ]
};
```

### 步骤 5: 添加国际化

```yaml
# locales/zh-CN.yaml
menus:
  newFeature: 新功能

# locales/en.yaml
menus:
  newFeature: New Feature
```

### 步骤 6: 测试和调试

```bash
# 启动开发服务器
pnpm dev

# 访问 http://localhost:5173/new-feature
```

---

## 构建和部署

### 开发环境

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 类型检查
pnpm typecheck

# 代码检查和格式化
pnpm lint
```

### 生产构建

```bash
# 构建生产版本
pnpm build

# 预览生产构建
pnpm preview

# 构建预发布版本
pnpm build:staging
```

### 构建配置

- **开发环境**: `.env.development`
- **生产环境**: `.env.production`
- **预发布环境**: `.env.staging`

主要环境变量：
```bash
VITE_PORT=5173                    # 开发服务器端口
VITE_PUBLIC_PATH=/                # 部署路径
VITE_ROUTER_HISTORY=hash          # 路由模式 (hash/h5)
VITE_HIDE_HOME=false              # 是否隐藏首页
```

---

## 最佳实践

### 1. 代码组织

- **单一职责**: 每个组件/函数只做一件事
- **模块化**: 相关功能放在同一模块
- **类型安全**: 充分使用 TypeScript 类型系统

### 2. 性能优化

- **路由懒加载**: 使用 `() => import()` 动态导入
- **组件懒加载**: 大型组件使用 `defineAsyncComponent`
- **KeepAlive**: 合理使用 `keepAlive: true` 缓存页面
- **虚拟滚动**: 大列表使用虚拟滚动组件

### 3. 安全

- **XSS 防护**: 用户输入进行转义
- **CSRF 防护**: API 请求带 Token
- **权限控制**: 使用 `Auth` 和 `Perms` 组件

### 4. 用户体验

- **加载状态**: 使用 `v-loading` 指令
- **错误处理**: 友好的错误提示
- **响应式设计**: 支持移动端
- **国际化**: 完整的多语言支持

---

## 常见问题

### 1. 路由不显示在菜单中？

检查路由 meta 配置：
```typescript
meta: {
  showLink: true,  // 必须设置为 true
  title: "菜单标题"
}
```

### 2. 页面刷新后数据丢失？

使用 Pinia 持久化或 localStorage：
```typescript
import { storageLocal } from "@pureadmin/utils";

storageLocal().setItem("key", data);
```

### 3. API 请求跨域？

配置 vite.config.ts 代理：
```typescript
server: {
  proxy: {
    "/api": {
      target: "http://backend-server.com",
      changeOrigin: true
    }
  }
}
```

### 4. 组件缓存不生效？

确保：
- 路由配置 `meta.keepAlive: true`
- 组件有 `name` 属性
- KeepAlive 组件正确包裹

---

## 技术支持

- **官方文档**: https://yiming_chang.gitee.io/pure-admin-doc/
- **GitHub**: https://github.com/pure-admin/pure-admin-thin
- **问题反馈**: https://github.com/pure-admin/vue-pure-admin/issues

---

## 版本历史

- **v6.1.0**: 当前版本
  - Vue 3.5
  - Vite 7
  - Element Plus 2.10
  - Tailwind CSS 4

---

**文档更新日期**: 2025-10-29
