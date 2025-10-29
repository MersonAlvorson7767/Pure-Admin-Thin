// 模拟后端动态生成路由
import { defineFakeRoute } from "vite-plugin-fake-server/client";


const newMenus = [
  {
    path: "/batch-statistics",
    name: "BatchStatistics",
    component: "extra/batch-statistics/index",
    meta: {
      title: "menus.batchStatistics",
      icon: "ep:collection",
      rank: 21,
      showLink: true
    }
  },
  {
    path: "/bill",
    name: "Bill",
    component: "extra/bill/index",
    meta: {
      title: "menus.bill",
      icon: "ep:document",
      rank: 22,
      showLink: true
    }
  },
  {
    path: "/sms-chat",
    name: "SmsChat",
    component: "extra/sms-chat/index",
    meta: {
      title: "menus.smsChat",
      icon: "ep:chat-line-round",
      rank: 23,
      showLink: true
    }
  },
  {
    path: "/statistics",
    name: "Statistics",
    component: "extra/statistics/index",
    meta: {
      title: "menus.statistics",
      icon: "ep:data-analysis",
      rank: 24,
      showLink: true
    }
  },
  {
    path: "/unsent-yesterday",
    name: "UnsentYesterday",
    component: "extra/unsent-yesterday/index",
    meta: {
      title: "menus.unsentYesterday",
      icon: "ep:close",
      rank: 25,
      showLink: true
    }
  }
];
/**
 * roles：页面级别权限，这里模拟二种 "admin"、"common"
 * admin：管理员角色
 * common：普通角色
 */
const permissionRouter = {
  path: "/permission",
  meta: {
    title: "menus.purePermission",
    icon: "ep:lollipop",
    rank: 10
  },
  children: [
    {
      path: "/permission/page/index",
      name: "PermissionPage",
      meta: {
        title: "menus.purePermissionPage",
        roles: ["admin", "common"]
      }
    },
    {
      path: "/permission/button",
      meta: {
        title: "menus.purePermissionButton",
        roles: ["admin", "common"]
      },
      children: [
        {
          path: "/permission/button/router",
          component: "permission/button/index",
          name: "PermissionButtonRouter",
          meta: {
            title: "menus.purePermissionButtonRouter",
            auths: [
              "permission:btn:add",
              "permission:btn:edit",
              "permission:btn:delete"
            ]
          }
        },
        {
          path: "/permission/button/login",
          component: "permission/button/perms",
          name: "PermissionButtonLogin",
          meta: {
            title: "menus.purePermissionButtonLogin"
          }
        }
      ]
    }
  ]
};

export default defineFakeRoute([
  {
    url: "/get-async-routes",
    method: "get",
    response: () => {
      return {
        success: true,
        data: [permissionRouter, ...newMenus]
      };
    }
  }
]);
