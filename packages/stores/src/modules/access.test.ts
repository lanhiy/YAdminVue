import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useAccessStore } from './access';

describe('useAccessStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('updates accessMenus state', () => {
    const store = useAccessStore();
    expect(store.accessMenus).toEqual([]);
    store.setAccessMenus([{ name: 'Dashboard', path: '/dashboard' }]);
    expect(store.accessMenus).toEqual([
      { name: 'Dashboard', path: '/dashboard' },
    ]);
  });

  it('updates accessToken state correctly', () => {
    const store = useAccessStore();
    expect(store.accessToken).toBeNull(); // 初始状态
    store.setAccessToken('abc123', 1_800_000_000);
    expect(store.accessToken).toBe('abc123');
    expect(store.accessTokenExpiresAt).toBe(1_800_000_000);
  });

  it('returns the correct accessToken', () => {
    const store = useAccessStore();
    store.setAccessToken('xyz789', 1_800_000_000);
    expect(store.accessToken).toBe('xyz789');
  });

  it('clears the expiration when the accessToken is removed', () => {
    const store = useAccessStore();
    store.setAccessToken('xyz789', 1_800_000_000);
    store.setAccessToken(null);

    expect(store.accessToken).toBeNull();
    expect(store.accessTokenExpiresAt).toBeNull();
  });

  it('detects missing, expired, and valid expiration timestamps', () => {
    const store = useAccessStore();
    const now = Math.floor(Date.now() / 1000);

    store.setAccessToken('missing-expiration');
    expect(store.isAccessTokenExpired()).toBe(true);

    store.setAccessToken('expired', now - 1);
    expect(store.isAccessTokenExpired()).toBe(true);

    store.setAccessToken('expiring', now + 5);
    expect(store.isAccessTokenExpired()).toBe(true);

    store.setAccessToken('valid', now + 60);
    expect(store.isAccessTokenExpired()).toBe(false);
  });

  // 测试设置空的访问菜单列表
  it('handles empty accessMenus correctly', () => {
    const store = useAccessStore();
    store.setAccessMenus([]);
    expect(store.accessMenus).toEqual([]);
  });

  // 测试设置空的访问路由列表
  it('handles empty accessRoutes correctly', () => {
    const store = useAccessStore();
    store.setAccessRoutes([]);
    expect(store.accessRoutes).toEqual([]);
  });
});
