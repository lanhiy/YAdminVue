// src/api/system/menu.ts
import type { RouteRecordStringComponent } from '@vben/types';
import { requestClient } from '#/api/request';

/** 菜单、目录和按钮共同组成 RBAC 授权树。 */
export enum MenuType {
  /** 目录：可见性由子节点推导 */
  CATALOG = 1,
  /** 页面菜单 */
  MENU = 2,
  /** 按钮：authority 是后端接口权限码 */
  BUTTON = 3,
}

/** 菜单状态 */
export enum MenuStatus {
  /** 禁用 */
  DISABLED = 0,
  /** 启用 */
  ENABLED = 1,
}

/** 菜单数据结构 */
export interface MenuInfo {
  id?: number;
  parent_id: number;
  name: string;
  path: string;
  component?: string;
  redirect?: string;
  type: MenuType;
  title: string;
  icon?: string;
  active_icon?: string;
  hide_in_menu?: number;
  hide_in_tab?: number;
  hide_in_breadcrumb?: number;
  hide_children_in_menu?: number;
  keep_alive?: number;
  /** 按钮权限码列表，来自 system_menu.authority */
  authority?: string[];
  ignore_access?: number;
  menu_visible_with_forbidden?: number;
  badge?: string;
  badge_type?: string;
  badge_variants?: string;
  affix_tab?: number;
  affix_tab_order?: number;
  full_path_key?: number;
  active_path?: string;
  max_num_of_open_tab?: number;
  link?: string;
  iframe_src?: string;
  open_in_new_window?: number;
  no_basic_layout?: number;
  query?: Record<string, any>;
  sort?: number;
  status: MenuStatus;
  remark?: string;
  children?: MenuInfo[];
}

/**
 * 获取菜单列表（树形）
 */
export async function getMenuListApi() {
  return requestClient.get<MenuInfo[]>('/system/menu/list');
}

/**
 * 获取用户所有路由菜单
 */
export async function getAllMenusApi() {
  return requestClient.get<RouteRecordStringComponent[]>('/system/menu/routes');
}

/**
 * 获取菜单详情
 */
export async function getMenuDetailApi(id: number) {
  return requestClient.get<MenuInfo>(`/system/menu/${id}`);
}

/**
 * 创建菜单
 */
export async function createMenuApi(data: MenuInfo) {
  return requestClient.post<MenuInfo>('/system/menu', data);
}

/**
 * 更新菜单
 */
export async function updateMenuApi(id: number, data: MenuInfo) {
  return requestClient.put<MenuInfo>(`/system/menu/${id}`, data);
}

/**
 * 删除菜单
 */
export async function deleteMenuApi(id: number) {
  return requestClient.delete(`/system/menu/${id}`);
}

/**
 * 修改菜单状态
 */
export async function changeMenuStatusApi(id: number, status: MenuStatus) {
  return requestClient.post('/system/menu/change-status', { id, status });
}
