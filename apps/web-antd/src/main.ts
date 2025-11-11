// src/main.ts
import { initPreferences } from '@vben/preferences';
import { unmountGlobalLoading } from '@vben/utils';
import { overridesPreferences } from './preferences';

async function initApplication() {
  const env = import.meta.env.PROD ? 'prod' : 'dev';
  const appVersion = import.meta.env.VITE_APP_VERSION;
  const namespace = `${import.meta.env.VITE_APP_NAMESPACE}-${appVersion}-${env}`;

  // 先用默认配置初始化
  await initPreferences({
    namespace,
    overrides: overridesPreferences,
  });

  // 启动应用（这里会初始化 Pinia）
  const { bootstrap } = await import('./bootstrap');
  await bootstrap(namespace);

  // 在 Pinia 初始化后加载远程配置
  await loadRemoteConfig();

  // 移除并销毁loading
  unmountGlobalLoading();
}

/**
 * 加载远程配置
 */
async function loadRemoteConfig() {
  try {
    const { getSystemConfigApi } = await import('#/api');
    const { transformConfigToPreferences } = await import('#/utils/config-transform');
    const { updatePreferences } = await import('@vben/preferences');

    const systemConfig = await getSystemConfigApi();
    const dynamicConfig = transformConfigToPreferences(systemConfig);

    // 动态更新配置
    updatePreferences(dynamicConfig);

    console.log('✅ 远程配置加载成功');
  } catch (error) {
    console.warn('⚠️ 获取远程配置失败，继续使用默认配置:', error);
  }
}

initApplication();
