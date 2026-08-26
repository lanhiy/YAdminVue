// src/api/system/role.ts
import { requestClient } from '#/api/request';

/**
 * 角色状态枚举
 */
export enum RoleStatus {
  /** 禁用 */
  DISABLED = 0,
  /** 启用 */
  ENABLED = 1,
}

/**
 * 角色信息接口
 */
export interface RoleInfo {
  id?: number;
  name: string;
  code: string;
  description?: string;
  sort?: number;
  status: RoleStatus;
  /** 授权的菜单和按钮节点ID列表 */
  menu_ids?: number[];
  /** ID=1 的部署角色拥有全部权限 */
  is_super?: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * 角色列表查询参数
 */
export interface RoleListParams {
  page?: number;
  page_size?: number;
  name?: string;
  code?: string;
  status?: RoleStatus;
}

/**
 * 角色列表返回结果
 */
export interface RoleListResult {
  list: RoleInfo[];
  total: number;
  page: number;
  page_size: number;
}

/**
 * 获取角色列表（分页）
 */
export async function getRoleListApi(params?: RoleListParams) {
  return requestClient.get<RoleListResult>('/system/role/list', {
    params,
  });
}

/**
 * 获取所有角色（下拉选择用）
 */
export async function getAllRolesApi() {
  return requestClient.get<RoleInfo[]>('/system/role/all');
}

/**
 * 获取角色详情
 */
export async function getRoleDetailApi(id: number) {
  return requestClient.get<RoleInfo>(`/system/role/${id}`);
}

/**
 * 创建角色
 */
export async function createRoleApi(data: RoleInfo) {
  return requestClient.post<RoleInfo>('/system/role', data);
}

/**
 * 更新角色
 */
export async function updateRoleApi(id: number, data: RoleInfo) {
  return requestClient.put<RoleInfo>(`/system/role/${id}`, data);
}

/**
 * 删除角色
 */
export async function deleteRoleApi(id: number) {
  return requestClient.delete(`/system/role/${id}`);
}

/**
 * 修改角色状态
 */
export async function changeRoleStatusApi(id: number, status: RoleStatus) {
  return requestClient.post('/system/role/change-status', { id, status });
}
