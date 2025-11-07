import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/account',
    name: 'Account',
    meta: {
      title: '个人中心',
      hideInMenu: true,
      hideInBreadcrumb: true,
    },
    children: [
      {
        path: 'profile',
        name: 'AccountProfile',
        component: () => import('#/views/system/admin/profile/index.vue'),
        meta: {
          title: '个人设置',
          icon: 'i-ant-design:user-outlined',
        },
      },
    ],
  },
];

export default routes;
