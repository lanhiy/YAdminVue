// src/utils/config-transform.ts
import type { SystemConfigInfo } from '#/api';
import type { PreferencesType } from '@vben/preferences';

/**
 * 将后端配置转换为前端 preferences 格式
 */
export function transformConfigToPreferences(
  config: SystemConfigInfo,
): Partial<PreferencesType> {
  return {
    // 🔥 只保留一个 app 对象，合并所有配置
    app: {
      name: config.app_name,
      defaultHomePath: config.app_default_home_path,
      accessMode: config.app_access_mode,
      loginExpiredMode: config.app_login_expired_mode,
      locale: config.app_locale,
      watermark: config.app_watermark,
      watermarkContent: config.app_watermark_content,
      defaultAvatar: config.app_default_avatar,
      enableRefreshToken: config.app_enable_refresh_token,
      dynamicTitle: config.app_dynamic_title,
      // 添加布局相关配置（这些也属于 app）
      layout: config.layout_type,
      contentCompact: config.content_compact,
      contentCompactWidth: config.content_compact_width,
    },
    logo: {
      enable: config.logo_enable,
      source: config.logo_source,
      fit: config.logo_fit,
    },
    theme: {
      mode: config.theme_mode,
      colorPrimary: config.theme_color_primary,
      colorSuccess: config.theme_color_success,
      colorWarning: config.theme_color_warning,
      colorDestructive: config.theme_color_destructive,
      builtinType: config.theme_builtin_type,
      radius: config.theme_radius,
    },
    copyright: {
      enable: config.copyright_enable,
      companyName: config.copyright_company_name,
      companySiteLink: config.copyright_company_site_link,
      date: config.copyright_date,
      icp: config.copyright_icp,
      icpLink: config.copyright_icp_link,
    },
    tabbar: {
      enable: config.tabbar_enable,
      keepAlive: config.tabbar_keep_alive,
      persist: config.tabbar_persist,
      showIcon: config.tabbar_show_icon,
      styleType: config.tabbar_style_type,
    },
    sidebar: {
      enable: config.sidebar_enable,
      width: config.sidebar_width,
      collapsedButton: config.sidebar_collapsed_button,
      expandOnHover: config.sidebar_expand_on_hover,
    },
    header: {
      enable: config.header_enable,
      height: config.header_height,
      mode: config.header_mode,
    },
    breadcrumb: {
      enable: config.breadcrumb_enable,
      showIcon: config.breadcrumb_show_icon,
      showHome: config.breadcrumb_show_home,
    },
    footer: {
      enable: config.footer_enable,
      height: config.footer_height,
    },
  };
}
