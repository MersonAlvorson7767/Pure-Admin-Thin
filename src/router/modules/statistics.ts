export default {
  path: "/statistics",
  name: "Statistics",
  component: () => import("@/layout/index.vue"),
  redirect: "/statistics/index",
  meta: {
    icon: "ep:data-analysis",
    title: "统计",
    rank: 99
  },
  children: [
    {
      path: "/statistics/index",
      name: "StatisticsIndex",
      component: () => import("@/views/extra/statistics/index.vue"),
      meta: {
        title: "统计",
        keepAlive: false,
        showLink: false
      }
    }
  ]
};