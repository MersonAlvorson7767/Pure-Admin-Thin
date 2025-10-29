# Pure Admin Thin 架构图解

本文档使用可视化图表展示项目架构，帮助快速理解系统设计。

## 系统架构总览

```mermaid
graph TB
    User[用户] --> Browser[浏览器]
    Browser --> VueApp[Vue 3 应用]
    
    VueApp --> Router[Vue Router<br/>路由系统]
    VueApp --> Store[Pinia<br/>状态管理]
    VueApp --> Components[组件系统]
    
    Router --> Layout[Layout<br/>布局组件]
    Layout --> Views[Views<br/>页面组件]
    
    Views --> Extra[views/extra<br/>业务功能页面]
    
    Extra --> Statistics[统计模块]
    Extra --> Bill[账单模块]
    Extra --> SmsChat[短信聊天]
    Extra --> BatchStats[批次统计]
    Extra --> Unsent[昨日未发送]
    
    Views --> API[API 层]
    API --> HTTP[HTTP 工具<br/>Axios]
    HTTP --> Backend[后端服务]
    
    Components --> ElementPlus[Element Plus<br/>UI 组件库]
    Components --> CustomComp[自定义组件]
    
    Store --> UserStore[用户状态]
    Store --> PermStore[权限状态]
    Store --> AppStore[应用状态]
    
    style Extra fill:#e1f5ff
    style VueApp fill:#42b983
    style Backend fill:#ff6b6b
```

## 目录结构树

```
Pure-Admin-Thin/
│
├── 📁 build/                  # 构建配置
│   ├── plugins.ts            # Vite 插件
│   ├── optimize.ts           # 依赖优化
│   └── utils.ts              # 构建工具
│
├── 📁 locales/                # 国际化
│   ├── zh-CN.yaml           # 中文
│   └── en.yaml              # 英文
│
├── 📁 public/                 # 静态资源
│
├── 📁 src/                    # 源代码 ⭐
│   │
│   ├── 📁 api/               # API 接口层
│   │   ├── user.ts          # 用户接口
│   │   ├── statistics.ts    # 统计接口
│   │   ├── bill.ts          # 账单接口
│   │   └── ...
│   │
│   ├── 📁 assets/            # 资源文件
│   │   ├── iconfont/        # 图标字体
│   │   └── svg/             # SVG 图标
│   │
│   ├── 📁 components/        # 全局组件
│   │   ├── ReIcon/          # 图标组件
│   │   ├── ReAuth/          # 权限组件
│   │   ├── ReDialog/        # 对话框
│   │   └── ...
│   │
│   ├── 📁 config/            # 配置文件
│   │
│   ├── 📁 directives/        # 自定义指令
│   │
│   ├── 📁 layout/            # 布局组件
│   │   ├── components/      # 布局子组件
│   │   │   ├── lay-navbar/  # 导航栏
│   │   │   ├── lay-sidebar/ # 侧边栏
│   │   │   ├── lay-tag/     # 标签页
│   │   │   └── ...
│   │   └── index.vue        # 主布局
│   │
│   ├── 📁 plugins/           # 插件配置
│   │   ├── i18n/            # 国际化插件
│   │   └── elementPlus/     # Element Plus
│   │
│   ├── 📁 router/            # 路由配置 ⭐
│   │   ├── modules/         # 路由模块
│   │   │   ├── home.ts
│   │   │   ├── statistics.ts
│   │   │   ├── bill.ts
│   │   │   └── ...
│   │   ├── index.ts         # 路由主文件
│   │   └── utils.ts         # 路由工具
│   │
│   ├── 📁 store/             # 状态管理 ⭐
│   │   ├── modules/         # 状态模块
│   │   │   ├── app.ts       # 应用状态
│   │   │   ├── user.ts      # 用户状态
│   │   │   ├── permission.ts # 权限状态
│   │   │   └── ...
│   │   └── index.ts         # Store 导出
│   │
│   ├── 📁 style/             # 全局样式
│   │   ├── reset.scss       # 重置样式
│   │   ├── index.scss       # 主样式
│   │   └── tailwind.css     # Tailwind
│   │
│   ├── 📁 utils/             # 工具函数
│   │   ├── http/            # HTTP 封装
│   │   ├── auth.ts          # 认证工具
│   │   ├── message.ts       # 消息提示
│   │   └── ...
│   │
│   ├── 📁 views/             # 页面组件 ⭐⭐⭐
│   │   ├── 📁 extra/        # 业务功能页面（核心开发目录）
│   │   │   ├── statistics/  # 统计模块
│   │   │   ├── bill/        # 账单模块
│   │   │   ├── sms-chat/    # 短信聊天
│   │   │   ├── batch-statistics/ # 批次统计
│   │   │   └── unsent-yesterday/ # 昨日未发送
│   │   │
│   │   ├── error/           # 错误页面
│   │   ├── login/           # 登录页面
│   │   ├── permission/      # 权限页面
│   │   └── welcome/         # 欢迎页
│   │
│   ├── App.vue              # 根组件
│   └── main.ts              # 应用入口
│
├── 📄 package.json           # 项目依赖
├── 📄 vite.config.ts         # Vite 配置
├── 📄 tsconfig.json          # TypeScript 配置
└── 📄 ARCHITECTURE.md        # 架构文档
```

## 路由系统流程

```mermaid
sequenceDiagram
    participant User as 用户
    participant Router as Vue Router
    participant Guard as 路由守卫
    participant Store as Pinia Store
    participant Layout as 布局组件
    participant View as 页面组件
    
    User->>Router: 访问 /statistics
    Router->>Guard: beforeEach 守卫
    Guard->>Store: 检查登录状态
    
    alt 未登录
        Guard->>Router: 重定向到 /login
        Router->>View: 显示登录页
    else 已登录
        Guard->>Guard: 检查权限
        Guard->>Store: 更新路由缓存
        Guard->>Layout: 加载布局组件
        Layout->>View: 加载页面组件
        View->>User: 显示页面内容
    end
    
    Router->>Guard: afterEach 守卫
    Guard->>Guard: 完成进度条
```

## 数据流向

```mermaid
graph LR
    A[页面组件] -->|1. 调用 API| B[API 层]
    B -->|2. HTTP 请求| C[HTTP 工具]
    C -->|3. Axios 请求| D[后端服务]
    D -->|4. 返回数据| C
    C -->|5. 响应处理| B
    B -->|6. 数据转换| A
    A -->|7. 更新视图| E[用户界面]
    
    A -.->|可选: 更新状态| F[Pinia Store]
    F -.->|状态变化| A
    
    style A fill:#e1f5ff
    style F fill:#fff4e1
    style D fill:#ffe1e1
```

## 添加新功能的流程图

```mermaid
graph TD
    Start[开始添加新功能] --> Plan[规划功能需求]
    Plan --> CreateDir[创建目录<br/>views/extra/new-feature]
    CreateDir --> CreateVue[创建页面组件<br/>index.vue]
    CreateVue --> CreateAPI[创建 API 接口<br/>api/newFeature.ts]
    CreateAPI --> CreateRoute[配置路由<br/>router/modules/newFeature.ts]
    CreateRoute --> AddI18n[添加国际化<br/>locales/*.yaml]
    AddI18n --> Test[测试功能]
    
    Test --> |发现问题| Debug[调试修复]
    Debug --> Test
    
    Test --> |测试通过| Commit[提交代码]
    Commit --> End[完成]
    
    style Start fill:#90EE90
    style End fill:#90EE90
    style CreateDir fill:#e1f5ff
    style CreateVue fill:#e1f5ff
    style CreateAPI fill:#fff4e1
    style CreateRoute fill:#fff4e1
```

## 组件通信模式

```mermaid
graph TB
    Parent[父组件] -->|Props 传递数据| Child1[子组件 1]
    Child1 -->|Emit 事件| Parent
    
    Parent -->|Props| Child2[子组件 2]
    Child2 -->|Emit 事件| Parent
    
    Child1 -.->|Provide/Inject| GrandChild1[孙组件]
    
    Child1 -.->|EventBus<br/>mitt| Child2
    
    Parent -.->|使用 Store| Store[Pinia Store]
    Child1 -.->|使用 Store| Store
    Child2 -.->|使用 Store| Store
    
    style Store fill:#fff4e1
```

## 页面组件生命周期

```mermaid
sequenceDiagram
    participant Route as 路由跳转
    participant Guard as 路由守卫
    participant Comp as 组件
    participant API as API 调用
    participant View as 视图渲染
    
    Route->>Guard: beforeEach
    Guard->>Guard: 权限检查
    Guard->>Comp: 创建组件实例
    
    Comp->>Comp: setup() 执行
    Comp->>Comp: 定义响应式数据
    Comp->>Comp: onMounted() 钩子
    Comp->>API: 调用 loadData()
    API->>API: 发送 HTTP 请求
    API->>Comp: 返回数据
    Comp->>Comp: 更新 tableData
    Comp->>View: 触发视图更新
    View->>View: 渲染表格
    
    Note over Route,View: 用户操作阶段
    
    View->>Comp: 用户点击刷新
    Comp->>API: 重新加载数据
    API->>Comp: 返回新数据
    Comp->>View: 更新视图
    
    Note over Route,View: 离开页面
    
    Route->>Comp: onBeforeUnmount()
    Comp->>Comp: 清理资源
```

## Element Plus 组件架构

```mermaid
graph TB
    App[应用根组件] --> ElConfigProvider[el-config-provider<br/>全局配置]
    
    ElConfigProvider --> Layout[布局组件]
    
    Layout --> ElContainer[el-container<br/>容器]
    ElContainer --> ElHeader[el-header<br/>头部]
    ElContainer --> ElAside[el-aside<br/>侧边栏]
    ElContainer --> ElMain[el-main<br/>主内容]
    
    ElMain --> Page[页面组件]
    
    Page --> ElTable[el-table<br/>表格]
    Page --> ElForm[el-form<br/>表单]
    Page --> ElDialog[el-dialog<br/>对话框]
    Page --> ElPagination[el-pagination<br/>分页]
    
    ElTable --> ElTableColumn[el-table-column<br/>表格列]
    ElForm --> ElFormItem[el-form-item<br/>表单项]
    ElFormItem --> ElInput[el-input<br/>输入框]
    ElFormItem --> ElSelect[el-select<br/>选择器]
    
    style App fill:#90EE90
    style Page fill:#e1f5ff
```

## 状态管理架构

```mermaid
graph TB
    subgraph "Pinia Store"
        AppStore[app<br/>应用状态]
        UserStore[user<br/>用户信息]
        PermStore[permission<br/>权限路由]
        TagsStore[multiTags<br/>标签页]
        SettingsStore[settings<br/>系统设置]
    end
    
    subgraph "组件层"
        Layout[布局组件]
        Navbar[导航栏]
        Sidebar[侧边栏]
        Tags[标签页]
        Content[内容区]
    end
    
    Layout --> AppStore
    Navbar --> UserStore
    Sidebar --> PermStore
    Tags --> TagsStore
    Content --> SettingsStore
    
    AppStore -.->|sidebar 状态| Layout
    UserStore -.->|用户信息| Navbar
    PermStore -.->|菜单数据| Sidebar
    TagsStore -.->|标签列表| Tags
    
    style AppStore fill:#fff4e1
    style UserStore fill:#fff4e1
    style PermStore fill:#fff4e1
    style TagsStore fill:#fff4e1
    style SettingsStore fill:#fff4e1
```

## views/extra 模块架构

```mermaid
graph TB
    Extra[views/extra<br/>业务功能目录] --> Statistics[statistics<br/>统计模块]
    Extra --> Bill[bill<br/>账单模块]
    Extra --> SmsChat[sms-chat<br/>短信聊天]
    Extra --> BatchStats[batch-statistics<br/>批次统计]
    Extra --> Unsent[unsent-yesterday<br/>昨日未发送]
    
    Statistics --> StatAPI[api/statistics.ts]
    Statistics --> StatRoute[router/modules/statistics.ts]
    
    Bill --> BillAPI[api/bill.ts]
    Bill --> BillRoute[router/modules/bill.ts]
    
    SmsChat --> ChatAPI[api/smsChat.ts]
    
    BatchStats --> BatchAPI[api/batch-statistics.ts]
    
    StatAPI --> HTTP[utils/http]
    BillAPI --> HTTP
    ChatAPI --> HTTP
    BatchAPI --> HTTP
    
    HTTP --> Backend[后端 API]
    
    style Extra fill:#e1f5ff
    style Statistics fill:#90EE90
    style Bill fill:#90EE90
    style SmsChat fill:#90EE90
    style BatchStats fill:#90EE90
    style Unsent fill:#90EE90
```

## 构建和部署流程

```mermaid
graph LR
    Dev[开发环境] -->|pnpm dev| DevServer[Vite Dev Server]
    
    Source[源代码] -->|pnpm build| Build[构建过程]
    
    Build --> Vite[Vite 构建]
    Vite --> Compile[编译 TypeScript]
    Compile --> Bundle[打包模块]
    Bundle --> Optimize[优化资源]
    Optimize --> Dist[dist/ 目录]
    
    Dist -->|部署| Staging[预发布环境]
    Dist -->|部署| Prod[生产环境]
    
    Staging -->|测试通过| Prod
    
    style Dev fill:#90EE90
    style Dist fill:#ffe1e1
    style Prod fill:#ff6b6b
```

---

## 图例说明

- 🟢 绿色: 入口/出口节点
- 🔵 蓝色: 核心业务模块
- 🟡 黄色: 状态管理/配置
- 🔴 红色: 外部服务/生产环境
- 实线箭头: 直接调用/依赖
- 虚线箭头: 数据流向/状态变化

## 查看建议

1. 使用支持 Mermaid 的 Markdown 查看器（如 GitHub、VS Code + Mermaid 插件）
2. 在线查看: https://mermaid.live/
3. 导出为图片后查看

---

**相关文档**:
- [ARCHITECTURE.md](./ARCHITECTURE.md) - 完整架构文档
- [docs/README.md](./docs/README.md) - 文档索引
- [docs/QUICK_REFERENCE.md](./docs/QUICK_REFERENCE.md) - 快速参考
