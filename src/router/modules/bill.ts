export default {
  path: "/bill",
  name: "Bill",
  component: () => import("@/layout/index.vue"),
  redirect: "/bill/index",
  meta: {
    icon: "ep:document",
    title: "账单",
    rank: 101,
    showLink: true
  },
  children: [
    {
      path: "/bill/index",
      name: "BillIndex",
      component: () => import("@/views/extra/bill/index.vue"),
      meta: {
        title: "账单",
        keepAlive: false,  // 不缓存此页面
        showLink: false
      }
    }
  ]
};