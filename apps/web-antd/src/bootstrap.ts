// src/bootstrap.ts
import { createApp, watchEffect } from 'vue';

import { registerAccessDirective } from '@vben/access';
import { registerLoadingDirective } from '@vben/common-ui/es/loading';
import { preferences } from '@vben/preferences';
import { initStores } from '@vben/stores';
import '@vben/styles';
import '@vben/styles/antd';

import { useTitle } from '@vueuse/core';

import { $t, setupI18n } from '#/locales';

import { initComponentAdapter } from './adapter/component';
import { initSetupVbenForm } from './adapter/form';
import App from './app.vue';
import { router } from './router';

async function bootstrap(namespace: string) {
  // 初始化组件适配器
  await initComponentAdapter();

  // 初始化表单组件
  await initSetupVbenForm();

  const app = createApp(App);

  // 注册v-loading指令
  registerLoadingDirective(app, {
    loading: 'loading',
    spinning: 'spinning',
  });

  // 国际化 i18n 配置
  await setupI18n(app);

  // 配置 pinia-store
  await initStores(app, { namespace });

  // 安装权限指令
  registerAccessDirective(app);

  // 初始化 tippy
  const { initTippy } = await import('@vben/common-ui/es/tippy');
  initTippy(app);

  // 配置路由及路由守卫
  app.use(router);

  // 配置Motion插件
  const { MotionPlugin } = await import('@vben/plugins/motion');
  app.use(MotionPlugin);

  // 🔥 在这里加载远程配置
  await loadRemoteConfigInBootstrap();

  // 动态更新标题
  watchEffect(() => {
    if (preferences.app.dynamicTitle) {
      const routeTitle = router.currentRoute.value.meta?.title;
      const pageTitle =
        (routeTitle ? `${$t(routeTitle)} - ` : '') + preferences.app.name;
      useTitle(pageTitle);
    }
  });

  app.mount('#app');
}

/**
 * 在 bootstrap 中加载远程配置
 */
async function loadRemoteConfigInBootstrap() {
  try {
    console.log('🔄 [Bootstrap] 开始加载远程配置...');
    console.log('📋 [Bootstrap] 更新前 app.name:', preferences.app.name);

    const { getSystemConfigApi } = await import('#/api');
    const { transformConfigToPreferences } = await import('#/utils/config-transform');

    const response = await getSystemConfigApi();
    console.log('✅ [Bootstrap] API 响应:', response);

    const systemConfig = response.data || response;
    console.log('✅ [Bootstrap] 系统配置数据:', systemConfig);

    const dynamicConfig = transformConfigToPreferences(systemConfig);
    console.log('✅ [Bootstrap] 转换后的配置:', dynamicConfig);

    // 🔥 方法1: 直接使用 Object.assign 深度更新
    if (dynamicConfig.app) {
      Object.assign(preferences.app, dynamicConfig.app);
    }
    if (dynamicConfig.logo) {
      Object.assign(preferences.logo, dynamicConfig.logo);
    }
    if (dynamicConfig.theme) {
      Object.assign(preferences.theme, dynamicConfig.theme);
    }
    if (dynamicConfig.copyright) {
      Object.assign(preferences.copyright, dynamicConfig.copyright);
    }
    if (dynamicConfig.tabbar) {
      Object.assign(preferences.tabbar, dynamicConfig.tabbar);
    }
    if (dynamicConfig.sidebar) {
      Object.assign(preferences.sidebar, dynamicConfig.sidebar);
    }
    if (dynamicConfig.header) {
      Object.assign(preferences.header, dynamicConfig.header);
    }
    if (dynamicConfig.breadcrumb) {
      Object.assign(preferences.breadcrumb, dynamicConfig.breadcrumb);
    }
    if (dynamicConfig.footer) {
      Object.assign(preferences.footer, dynamicConfig.footer);
    }

    console.log('✅ [Bootstrap] 远程配置应用成功！');
    console.log('📋 [Bootstrap] 更新后 app.name:', preferences.app.name);
    console.log('📋 [Bootstrap] 完整配置:', JSON.parse(JSON.stringify(preferences)));

    // 🔥 手动触发 CSS 变量更新
    const { updateCSSVariables } = await import('@vben/preferences/update-css-variables');
    updateCSSVariables(preferences as any);

  } catch (error) {
    console.error('❌ [Bootstrap] 配置加载失败:', error);
    if (error?.response) {
      console.error('   响应状态:', error.response.status);
      console.error('   响应数据:', error.response.data);
    }
  }
}

export { bootstrap };
