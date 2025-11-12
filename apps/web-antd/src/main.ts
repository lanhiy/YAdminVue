// src/main.ts
import { initPreferences, updatePreferences } from '@vben/preferences';
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

  // 2️⃣ 启动应用（初始化 axios、Pinia、路由等）
  const { bootstrap } = await import('./bootstrap');
  await bootstrap(namespace);

  // 3️⃣ 在 bootstrap 后加载远程配置
  await loadRemoteConfig();

  // 4️⃣ 移除 loading
  unmountGlobalLoading();
}

/**
 * 加载远程配置
 */
async function loadRemoteConfig() {
  try {
    console.log('🔄 [配置加载] 开始加载远程配置...');

    const { getSystemConfigApi } = await import('#/api');
    const { transformConfigToPreferences } = await import('#/utils/config-transform');

    console.log('🔄 [配置加载] 正在请求配置接口...');
    const systemConfig = await getSystemConfigApi();
    console.log('✅ [配置加载] 接口请求成功:', systemConfig);

    console.log('🔄 [配置加载] 正在转换配置格式...');
    const dynamicConfig = transformConfigToPreferences(systemConfig);
    console.log('✅ [配置加载] 配置转换成功:', dynamicConfig);

    console.log('🔄 [配置加载] 正在应用配置...');
    updatePreferences(dynamicConfig);
    console.log('✅ [配置加载] 远程配置应用成功！');

  } catch (error) {
    console.error('❌ [配置加载] 加载远程配置失败，使用默认配置:', error);

    // 打印详细错误信息
    if (error?.response) {
      console.error('   - 响应状态:', error.response.status);
      console.error('   - 响应数据:', error.response.data);
    } else if (error?.message) {
      console.error('   - 错误信息:', error.message);
    }
  }
}

initApplication();
