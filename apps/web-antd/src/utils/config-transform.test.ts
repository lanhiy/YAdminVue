import type { SystemConfigInfo } from '#/api';

import { describe, expect, it } from 'vitest';

import {
  transformConfigToPreferences,
  transformConfigToSystemPreferences,
} from './config-transform';

const config = {
  app_access_mode: 'backend',
  app_default_avatar: '/avatar.webp',
  app_default_home_path: '/analytics',
  app_dynamic_title: true,
  app_enable_refresh_token: false,
  app_locale: 'zh-CN',
  app_login_expired_mode: 'page',
  app_name: '管理后台',
  app_watermark: true,
  app_watermark_content: '内部系统',
  breadcrumb_enable: true,
  breadcrumb_show_home: false,
  breadcrumb_show_icon: true,
  content_compact: 'wide',
  content_compact_width: 1200,
  copyright_company_name: 'Example',
  copyright_company_site_link: 'https://example.com',
  copyright_date: '2026',
  copyright_enable: true,
  copyright_icp: '',
  copyright_icp_link: '',
  footer_enable: false,
  footer_height: 32,
  header_enable: true,
  header_height: 50,
  header_mode: 'fixed',
  layout_type: 'sidebar-nav',
  logo_enable: true,
  logo_fit: 'contain',
  logo_source: 'https://static.example.com/logo.webp',
  sidebar_collapsed_button: true,
  sidebar_enable: true,
  sidebar_expand_on_hover: true,
  sidebar_width: 224,
  tabbar_enable: true,
  tabbar_keep_alive: true,
  tabbar_persist: true,
  tabbar_show_icon: true,
  tabbar_style_type: 'card',
  theme_builtin_type: 'default',
  theme_color_destructive: '#f00',
  theme_color_primary: '#00f',
  theme_color_success: '#0f0',
  theme_color_warning: '#ff0',
  theme_mode: 'light',
  theme_radius: '0.5',
} satisfies SystemConfigInfo;

describe('config-transform', () => {
  it('uses all system settings as defaults for a new client', () => {
    const preferences = transformConfigToPreferences(config);

    expect(preferences.logo?.source).toBe(config.logo_source);
    expect(preferences.theme?.mode).toBe(config.theme_mode);
    expect(preferences.sidebar?.width).toBe(config.sidebar_width);
  });

  it('only returns centrally managed settings for an existing client', () => {
    const preferences = transformConfigToSystemPreferences(config);

    expect(preferences.logo?.source).toBe(config.logo_source);
    expect(preferences.app?.name).toBe(config.app_name);
    expect(preferences.copyright?.companyName).toBe(
      config.copyright_company_name,
    );
    expect(preferences).not.toHaveProperty('theme');
    expect(preferences).not.toHaveProperty('sidebar');
    expect(preferences.app).not.toHaveProperty('locale');
    expect(preferences.app).not.toHaveProperty('layout');
  });
});
