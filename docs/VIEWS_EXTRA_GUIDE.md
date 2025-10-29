# views/extra 目录开发指南

## 目录说明

`src/views/extra/` 目录是存放所有业务功能页面的核心目录。该目录专门用于存放与具体业务逻辑相关的视图组件。

## 当前功能模块

### 1. 统计模块 (statistics)

**路径**: `src/views/extra/statistics/`

**功能**: 展示系统统计数据，包括队列大小、发送窗口、呼叫大小、接收大小等指标。

**路由**: `/statistics/index`

**API**: `src/api/statistics.ts`
- `getStatisticsList(params)`: 获取统计列表

**特点**:
- 使用 Element Plus Table 组件
- 支持数据刷新
- 响应式表格设计
- 国际化支持

**关键代码示例**:
```vue
<el-table
  :data="tableData"
  v-loading="loading"
  :header-cell-style="{ background: '#f8fafc', fontWeight: 800 }"
>
  <el-table-column prop="days" :label="$t('statistics.pureDate')" />
  <el-table-column prop="queueSize" :label="$t('statistics.pureQueueSize')" />
</el-table>
```

### 2. 账单模块 (bill)

**路径**: `src/views/extra/bill/`

**功能**: 账单管理和查看功能。

**路由**: `/bill/index`

**API**: `src/api/bill.ts`

**特点**:
- 不缓存页面 (`keepAlive: false`)
- 菜单中显示

### 3. 短信聊天 (sms-chat)

**路径**: `src/views/extra/sms-chat/`

**文件**:
- `index.vue`: 主聊天页面
- `index_back.vue`: 备份版本

**功能**: 短信聊天界面和管理。

**API**: `src/api/smsChat.ts`

### 4. 批次统计 (batch-statistics)

**路径**: `src/views/extra/batch-statistics/`

**功能**: 批次数据统计和分析。

**API**: `src/api/batch-statistics.ts`
- `getBatchStatisticsList(params)`: 获取批次统计列表
- `getBatchResult(id)`: 获取批次详情

### 5. 昨日未发送 (unsent-yesterday)

**路径**: `src/views/extra/unsent-yesterday/`

**功能**: 查看昨日未发送的数据。

---

## 新增功能页面标准流程

### 第一步：规划功能

在开始编码前，明确以下问题：
1. 功能名称和用途
2. 需要哪些数据字段
3. 需要调用哪些 API
4. 是否需要分页
5. 是否需要搜索/筛选
6. 权限要求

### 第二步：创建目录结构

```bash
# 在 views/extra 下创建功能目录
cd src/views/extra
mkdir my-feature

# 创建主视图文件
touch my-feature/index.vue

# 如果有子页面，可以创建多个文件
touch my-feature/detail.vue
touch my-feature/edit.vue
```

### 第三步：编写页面组件

参见《完整页面组件模板》章节。

### 第四步：创建 API 接口

在 `src/api/` 目录下创建对应的 API 文件：

```typescript
// src/api/myFeature.ts
import { http } from "@/utils/http";

export const getMyFeatureList = (params: any) => {
  return http.request<any>("post", "/my-feature/list", { data: params });
};
```

### 第五步：配置路由

在 `src/router/modules/` 创建路由模块：

```typescript
// src/router/modules/myFeature.ts
export default {
  path: "/my-feature",
  name: "MyFeature",
  component: () => import("@/layout/index.vue"),
  redirect: "/my-feature/index",
  meta: {
    icon: "ep:operation",
    title: "menus.myFeature",
    rank: 105
  },
  children: [
    {
      path: "/my-feature/index",
      name: "MyFeatureIndex",
      component: () => import("@/views/extra/my-feature/index.vue"),
      meta: {
        title: "menus.myFeature",
        keepAlive: false
      }
    }
  ]
};
```

### 第六步：添加国际化配置

在 `locales/` 目录下的语言文件中添加翻译：

```yaml
# locales/zh-CN.yaml
menus:
  myFeature: 我的功能
```

---

## 完整页面组件模板

详细的完整模板请参考项目根目录下的 `ARCHITECTURE.md` 文档中的相关章节。

基本结构包括：
1. 页面标题
2. 搜索/筛选区
3. 操作按钮区
4. 数据表格
5. 分页组件
6. 弹窗/抽屉

---

## 常用组件模式

### 表格组件
使用 Element Plus Table 组件展示列表数据，支持排序、筛选、分页等功能。

### 表单组件
使用 Element Plus Form 组件进行数据录入和编辑，支持验证。

### 分页组件
使用 Element Plus Pagination 组件实现数据分页。

### 对话框组件
使用 Element Plus Dialog 组件实现弹窗交互。

---

## 代码规范

### 1. 命名规范
- 组件文件名: kebab-case
- 路由 path: kebab-case  
- 变量和方法: camelCase

### 2. 文件组织
```
my-feature/
├── index.vue
├── detail.vue
└── components/
```

### 3. 注释规范
为关键方法和复杂逻辑添加注释说明。

---

## 调试技巧

1. 使用 Vue DevTools 检查组件状态
2. 使用浏览器 Network 面板查看 API 请求
3. 使用 console.log 输出调试信息

---

## 常见问题

**Q: 页面路由跳转后数据没有刷新？**

A: 检查是否启用了 `keepAlive`，使用 `onActivated` 钩子刷新数据。

**Q: 表格数据更新后页面没有响应？**

A: 确保使用 Vue 的响应式 API，正确更新数据。

---

## 总结

在 `views/extra` 目录下添加新功能的核心步骤：

1. ✅ 创建页面组件
2. ✅ 定义 API 接口
3. ✅ 配置路由
4. ✅ 添加国际化
5. ✅ 测试功能

详细的开发指南和代码示例请参考 `ARCHITECTURE.md` 文档。
