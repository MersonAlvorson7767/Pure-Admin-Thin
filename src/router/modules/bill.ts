/**
 * 账单模块路由配置
 * 
 * 该模块展示了如何配置一个基本的业务功能页面路由
 * 
 * 关键配置项说明:
 * - showLink: 父路由设置为 true 在菜单中显示，子路由设置为 false 避免重复
 * - keepAlive: 设置为 false 表示每次进入页面都会重新加载，适用于需要实时数据的页面
 * - rank: 控制菜单显示顺序，本模块设置为 101，在统计模块(99)之后
 */
export default {
  path: "/bill",
  name: "Bill",
  component: () => import("@/layout/index.vue"),
  redirect: "/bill/index",
  meta: {
    icon: "ep:document",                         // 使用文档图标
    title: "账单",                               // 菜单显示文本
    rank: 101,                                   // 菜单排序
    showLink: true                               // 在菜单中显示
  },
  children: [
    {
      path: "/bill/index",
      name: "BillIndex",
      component: () => import("@/views/extra/bill/index.vue"),
      meta: {
        title: "账单",
        keepAlive: false,                        // 不缓存此页面（每次访问都重新加载）
        showLink: false                          // 子路由不在菜单中显示
      }
    }
  ]
};