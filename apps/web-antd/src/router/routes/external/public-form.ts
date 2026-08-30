import type { RouteRecordRaw } from 'vue-router';

const pageMeta = {
  title: '证书防伪查询',
  hideInMenu: true,
  hideInTab: true,
  ignoreAccess: true,
};

const routes: RouteRecordRaw[] = [
  {
    path: '/cert/:token',
    name: 'CertificateQuery',
    component: () => import('#/views/public-form/index.vue'),
    meta: pageMeta,
  },
];

export default routes;
