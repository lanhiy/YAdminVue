// src/main.ts
import {
  initPreferences,
  preferencesManager,
  updatePreferences,
} from '@vben/preferences';
import { unmountGlobalLoading } from '@vben/utils';

import { overridesPreferences } from './preferences';

async function initApplication() {
  const env = import.meta.env.PROD ? 'prod' : 'dev';
  const appVersion = import.meta.env.VITE_APP_VERSION;
  const namespace = `${import.meta.env.VITE_APP_NAMESPACE}-${appVersion}-${env}`;

  // 1️⃣ 先用默认配置初始化
  await initPreferences({
    namespace,
    overrides: overridesPreferences,
  });
  const preserveLocalPreferences = preferencesManager.hasCachedPreferences();

  // 2️⃣ 启动应用（初始化 axios、Pinia、路由等）
  const { bootstrap } = await import('./bootstrap');
  await bootstrap(namespace);

  // 3️⃣ 在 bootstrap 后加载远程配置
  await loadRemoteConfig(preserveLocalPreferences);

  // 4️⃣ 移除 loading
  unmountGlobalLoading();
}

/**
 * 加载远程配置
 */
async function loadRemoteConfig(preserveLocalPreferences: boolean) {
  try {
    const { getSystemConfigApi } = await import('#/api');
    const { transformConfigToPreferences, transformConfigToSystemPreferences } =
      await import('#/utils/config-transform');

    const systemConfig = await getSystemConfigApi();

    const dynamicConfig = preserveLocalPreferences
      ? transformConfigToSystemPreferences(systemConfig)
      : transformConfigToPreferences(systemConfig);

    updatePreferences(dynamicConfig);
  } catch (error: unknown) {
    console.error('[配置加载] 加载远程配置失败，使用默认配置:', error);

    if (error instanceof Error) {
      console.error('   - 错误信息:', error.message);
    }
  }
}

initApplication();
