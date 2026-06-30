import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/public-form',
    name: 'PublicForm',
    component: () => import('#/views/public-form/index.vue'),
    meta: {
      title: '公开表单',
      hideInMenu: true,
      hideInTab: true,
      ignoreAccess: true,
    },
  },
];

export default routes;
