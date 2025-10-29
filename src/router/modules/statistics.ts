/**
 * 统计模块路由配置
 * 
 * 架构说明:
 * 1. 路由模块采用父子嵌套结构，父路由使用 layout 组件提供统一布局
 * 2. 所有路由配置文件会被 router/index.ts 自动导入（使用 import.meta.glob）
 * 3. 路由会经过扁平化处理，三级及以上路由自动转换为二级路由
 * 
 * 配置规范:
 * - path: 路由路径，使用 kebab-case 命名
 * - name: 路由名称，使用 PascalCase，必须唯一
 * - component: 使用动态导入实现路由懒加载
 * - redirect: 父路由重定向到默认子路由
 * - meta.icon: 菜单图标，使用 Element Plus 图标库 (ep:) 或 Iconify
 * - meta.title: 菜单标题，支持国际化 key 或直接字符串
 * - meta.rank: 菜单排序权重，数字越小越靠前
 * - meta.keepAlive: 是否缓存页面组件
 * - meta.showLink: 是否在菜单中显示该路由
 */
export default {
  // 父路由配置
  path: "/statistics",                           // 路由路径
  name: "Statistics",                            // 路由名称（必须唯一）
  component: () => import("@/layout/index.vue"), // 使用布局组件作为容器
  redirect: "/statistics/index",                 // 访问父路由时重定向到子路由
  meta: {
    icon: "ep:data-analysis",                    // 菜单图标
    title: "统计",                               // 菜单标题（可使用 i18n key）
    rank: 99                                     // 菜单排序（数字越小越靠前）
  },
  // 子路由配置
  children: [
    {
      path: "/statistics/index",                               // 子路由完整路径
      name: "StatisticsIndex",                                 // 子路由名称
      component: () => import("@/views/extra/statistics/index.vue"), // 页面组件
      meta: {
        title: "统计",                                         // 页面标题
        keepAlive: false,                                      // 不缓存此页面（每次进入都重新加载）
        showLink: false                                        // 不在菜单中显示（父级已显示）
      }
    }
  ]
};