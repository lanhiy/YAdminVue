import type {
  AppPreferences,
  HeaderPreferences,
  LogoPreferences,
  TabbarPreferences,
  ThemePreferences,
} from '@vben/preferences';

// src/api/system/config.ts
import { requestClient } from '#/api/request';

/**
 * 系统配置信息
 */
export interface SystemConfigInfo {
  // 应用配置
  app_name: string;
  app_default_home_path: string;
  app_access_mode: 'backend' | 'frontend';
  app_login_expired_mode: 'modal' | 'page';
  app_locale: AppPreferences['locale'];
  app_watermark: boolean;
  app_watermark_content: string;
  app_default_avatar: string;
  app_enable_refresh_token: boolean;
  app_dynamic_title: boolean;

  // Logo配置
  logo_enable: boolean;
  logo_source: string;
  logo_fit: LogoPreferences['fit'];

  // 主题配置
  theme_mode: 'auto' | 'dark' | 'light';
  theme_color_primary: string;
  theme_color_success: string;
  theme_color_warning: string;
  theme_color_destructive: string;
  theme_builtin_type: ThemePreferences['builtinType'];
  theme_radius: string;

  // 版权配置
  copyright_enable: boolean;
  copyright_company_name: string;
  copyright_company_site_link: string;
  copyright_date: string;
  copyright_icp: string;
  copyright_icp_link: string;

  // 布局配置
  layout_type: AppPreferences['layout'];
  content_compact: AppPreferences['contentCompact'];
  content_compact_width: number;

  // 标签页配置
  tabbar_enable: boolean;
  tabbar_keep_alive: boolean;
  tabbar_persist: boolean;
  tabbar_show_icon: boolean;
  tabbar_style_type: TabbarPreferences['styleType'];

  // 侧边栏配置
  sidebar_enable: boolean;
  sidebar_width: number;
  sidebar_collapsed_button: boolean;
  sidebar_expand_on_hover: boolean;

  // 头部配置
  header_enable: boolean;
  header_height: number;
  header_mode: HeaderPreferences['mode'];

  // 面包屑配置
  breadcrumb_enable: boolean;
  breadcrumb_show_icon: boolean;
  breadcrumb_show_home: boolean;

  // 页脚配置
  footer_enable: boolean;
  footer_height: number;
}

/**
 * 获取系统配置
 */
export async function getSystemConfigApi() {
  return requestClient.get<SystemConfigInfo>('/system/config', {
    authRequired: false,
  });
}

/**
 * 更新系统配置
 */
export async function updateSystemConfigApi(data: Partial<SystemConfigInfo>) {
  return requestClient.post('/system/config/update', data);
}
