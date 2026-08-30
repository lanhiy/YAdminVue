import type { RouteRecordRaw } from 'vue-router';

const pageMeta = {
  title: '证书防伪查询',
  hideInMenu: true,
  hideInTab: true,
  ignoreAccess: true,
};

const routes: RouteRecordRaw[] = [
  {
    path: '/public-form/:token?',
    name: 'PublicForm',
    component: () => import('#/views/public-form/index.vue'),
    meta: pageMeta,
  },
  {
    path: '/certificate/:token',
    name: 'CertificateQuery',
    component: () => import('#/views/public-form/index.vue'),
    meta: pageMeta,
  },
];

export default routes;
