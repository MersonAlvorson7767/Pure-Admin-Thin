# Pure Admin Thin 快速参考指南

## 项目快速启动

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 代码检查
pnpm lint

# 类型检查
pnpm typecheck
```

## 项目结构速览

```
src/
├── api/              # API 接口定义
├── assets/           # 静态资源
├── components/       # 全局组件
├── layout/           # 布局组件
├── router/           # 路由配置
│   └── modules/     # 路由模块（自动导入）
├── store/            # Pinia 状态管理
│   └── modules/     # 状态模块
├── utils/            # 工具函数
└── views/            # 页面组件
    └── extra/       # 业务功能页面 ⭐
```

## 添加新页面的快速步骤

### 1. 创建页面组件

```bash
mkdir -p src/views/extra/my-feature
```

创建 `src/views/extra/my-feature/index.vue`:

```vue
<template>
  <div class="page-content">
    <h1>{{ $t('menus.myFeature') }}</h1>
    
    <el-table :data="tableData" v-loading="loading">
      <el-table-column prop="name" label="名称" />
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getMyFeatureList } from "@/api/myFeature";

const loading = ref(false);
const tableData = ref([]);

const loadData = async () => {
  loading.value = true;
  try {
    const { data } = await getMyFeatureList({ pageNum: 1, pageSize: 10 });
    tableData.value = data.list;
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadData();
});
</script>
```

### 2. 创建 API 接口

创建 `src/api/myFeature.ts`:

```typescript
import { http } from "@/utils/http";

export const getMyFeatureList = (params: any) => {
  return http.request<any>("post", "/my-feature/list", { data: params });
};
```

### 3. 配置路由

创建 `src/router/modules/myFeature.ts`:

```typescript
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

### 4. 添加国际化

在 `locales/zh-CN.yaml` 中添加:

```yaml
menus:
  myFeature: 我的功能
```

在 `locales/en.yaml` 中添加:

```yaml
menus:
  myFeature: My Feature
```

## 常用代码片段

### 表格分页

```vue
<template>
  <el-table :data="tableData" v-loading="loading" />
  
  <el-pagination
    v-model:current-page="pagination.currentPage"
    v-model:page-size="pagination.pageSize"
    :total="pagination.total"
    @current-change="loadData"
  />
</template>

<script setup lang="ts">
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
});
</script>
```

### 表单对话框

```vue
<template>
  <el-button @click="dialogVisible = true">打开对话框</el-button>
  
  <el-dialog v-model="dialogVisible" title="标题">
    <el-form :model="formData">
      <el-form-item label="名称">
        <el-input v-model="formData.name" />
      </el-form-item>
    </el-form>
    
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
const dialogVisible = ref(false);
const formData = reactive({ name: "" });

const handleSubmit = () => {
  // 提交逻辑
  dialogVisible.value = false;
};
</script>
```

### 搜索表单

```vue
<template>
  <el-form :inline="true" :model="searchForm">
    <el-form-item label="关键词">
      <el-input v-model="searchForm.keyword" />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="handleSearch">查询</el-button>
      <el-button @click="handleReset">重置</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
const searchForm = reactive({
  keyword: ""
});

const handleSearch = () => {
  loadData();
};

const handleReset = () => {
  searchForm.keyword = "";
  loadData();
};
</script>
```

### 删除确认

```vue
<script setup lang="ts">
import { ElMessageBox } from "element-plus";
import { message } from "@/utils/message";

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除该数据吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    await deleteApi(row.id);
    message.success("删除成功");
    loadData();
  } catch (error) {
    if (error !== 'cancel') {
      message.error("删除失败");
    }
  }
};
</script>
```

## 路由配置参数说明

### 路由 meta 配置

```typescript
meta: {
  icon: "ep:icon-name",     // 菜单图标
  title: "menus.key",       // 菜单标题（i18n key）
  rank: 100,                // 排序权重（数字越小越靠前）
  showLink: true,           // 是否在菜单中显示
  keepAlive: false,         // 是否缓存页面
  roles: ["admin"],         // 权限角色
  showParent: false         // 是否显示父级面包屑
}
```

## Element Plus 图标

常用图标前缀 `ep:`:

- `ep:operation` - 操作
- `ep:document` - 文档
- `ep:data-analysis` - 数据分析
- `ep:user` - 用户
- `ep:setting` - 设置
- `ep:list` - 列表
- `ep:edit` - 编辑
- `ep:delete` - 删除
- `ep:plus` - 添加
- `ep:refresh` - 刷新

完整图标列表: https://element-plus.org/zh-CN/component/icon.html

## 工具函数

### 消息提示

```typescript
import { message } from "@/utils/message";

message.success("操作成功");
message.error("操作失败");
message.warning("警告信息");
message.info("提示信息");
```

### 本地存储

```typescript
import { storageLocal } from "@pureadmin/utils";

// 保存数据
storageLocal().setItem("key", value);

// 获取数据
const value = storageLocal().getItem("key");

// 删除数据
storageLocal().removeItem("key");
```

### 防抖和节流

```typescript
import { debounce } from "@pureadmin/utils";

const handleSearch = debounce(() => {
  loadData();
}, 300);
```

## 常见问题

### Q: 如何配置 API 代理？

在 `vite.config.ts` 中配置:

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

### Q: 如何添加权限控制？

在路由配置中添加 `roles`:

```typescript
meta: {
  roles: ["admin", "editor"]  // 只有这些角色可以访问
}
```

在模板中使用 `Auth` 组件:

```vue
<Auth value="admin">
  <el-button>管理员可见</el-button>
</Auth>
```

### Q: 如何缓存页面？

在路由配置中设置:

```typescript
meta: {
  keepAlive: true  // 启用页面缓存
}
```

## 开发建议

1. ✅ 遵循项目现有的代码风格
2. ✅ 使用 TypeScript 类型定义
3. ✅ 添加必要的注释
4. ✅ 使用国际化处理文本
5. ✅ 合理使用组件缓存
6. ✅ 处理加载和错误状态
7. ✅ 响应式设计（支持移动端）

## 相关文档

- **详细架构文档**: `ARCHITECTURE.md`
- **views/extra 开发指南**: `docs/VIEWS_EXTRA_GUIDE.md`
- **Element Plus**: https://element-plus.org/
- **Vue 3**: https://cn.vuejs.org/
- **Pinia**: https://pinia.vuejs.org/zh/

---

**提示**: 这是一个快速参考指南。详细的架构说明和最佳实践请参考 `ARCHITECTURE.md` 文档。
