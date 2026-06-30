import type { Router } from 'vue-router';

import { useAccessStore, useUserStore } from '@vben/stores';

import { generateAccess } from '#/router/access';
import { accessRoutes } from '#/router/routes';

/** 菜单变更后重新拉取路由与侧栏菜单 */
export async function refreshAccess(router: Router) {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const userRoles = userStore.userInfo?.roles ?? [];

  const { accessibleMenus, accessibleRoutes } = await generateAccess({
    roles: userRoles,
    router,
    routes: accessRoutes,
  });

  accessStore.setAccessMenus(accessibleMenus);
  accessStore.setAccessRoutes(accessibleRoutes);
  accessStore.setIsAccessChecked(true);
}
