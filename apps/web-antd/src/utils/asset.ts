import { useAppConfig } from '@vben/hooks';

const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);

/**
 * 把后端返回的相对地址（/uploads/xxx）补成可直接访问的完整地址。
 *
 * 后端只存相对路径，换域名不用改库；前端与接口不同源，
 * 所以 img src 需要拼上接口地址。
 */
export function resolveAssetUrl(url?: string): string {
  if (!url) {
    return '';
  }

  // 已经是完整地址或 base64，原样返回
  if (/^(?:blob:|data:|https?:\/\/)/.test(url)) {
    return url;
  }

  const base = (apiURL ?? '').replace(/\/$/, '');

  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
}
