// src/api/system/admin.ts
import { requestClient } from '#/api/request';

/**
 * 用户性别枚举
 */
export enum AdminGender {
  /** 未知 */
  UNKNOWN = 0,
  /** 男 */
  MALE = 1,
  /** 女 */
  FEMALE = 2,
}

/**
 * 用户状态枚举
 */
export enum AdminStatus {
  /** 禁用 */
  DISABLED = 0,
  /** 启用 */
  ENABLED = 1,
}

/**
 * 用户信息接口
 */
export interface AdminInfo {
  id?: number;
  username: string;
  mobile?: string;
  email?: string;
  password?: string;
  nickname: string;
  gender?: AdminGender;
  avatar?: string;
  status: AdminStatus;
  sort?: number;
  last_login_at?: string;
  last_login_ip?: string;
  remark?: string;
  role_ids?: number[];
  roles?: Array<{ id: number; name: string }>;
  created_at?: string;
  updated_at?: string;
}

/**
 * 用户列表查询参数
 */
export interface AdminListParams {
  page?: number;
  page_size?: number;
  username?: string;
  nickname?: string;
  mobile?: string;
  status?: AdminStatus;
  gender?: AdminGender;
}

/**
 * 用户列表返回结果
 */
export interface AdminListResult {
  list: AdminInfo[];
  total: number;
  page: number;
  page_size: number;
}

/**
 * 获取用户列表（分页）
 */
export async function getAdminListApi(params?: AdminListParams) {
  return requestClient.get<AdminListResult>('/system/admin/list', {
    params,
  });
}

/**
 * 获取用户详情
 */
export async function getAdminDetailApi(id: number) {
  return requestClient.get<AdminInfo>(`/system/admin/${id}`);
}

/**
 * 创建用户
 */
export async function createAdminApi(data: AdminInfo) {
  return requestClient.post<AdminInfo>('/system/admin', data);
}

/**
 * 更新用户
 */
export async function updateAdminApi(id: number, data: AdminInfo) {
  return requestClient.put<AdminInfo>(`/system/admin/${id}`, data);
}

/**
 * 删除用户
 */
export async function deleteAdminApi(id: number) {
  return requestClient.delete(`/system/admin/${id}`);
}

/**
 * 修改用户状态
 */
export async function changeAdminStatusApi(id: number, status: AdminStatus) {
  return requestClient.post('/system/admin/change-status', { id, status });
}
