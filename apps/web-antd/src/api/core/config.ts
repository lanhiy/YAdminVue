import { requestClient } from '#/api/request';

/**
 * 系统配置项接口
 */
export interface SystemConfigItem {
  id?: number;
  config_key: string;
  config_value: string;
  config_value_decoded?: any;
  config_type: string;
  description?: string;
  sort?: number;
  status: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * 配置列表查询参数
 */
export interface ConfigListParams {
  page?: number;
  page_size?: number;
  config_key?: string;
  config_type?: string;
  status?: number;
}

/**
 * 配置列表返回结果
 */
export interface ConfigListResult {
  list: SystemConfigItem[];
  total: number;
}

/**
 * 获取配置列表（后台管理，需要认证）
 */
export async function getConfigListApi(params?: ConfigListParams) {
  return requestClient.get<ConfigListResult>('/system/config/list', { params });
}

/**
 * 按类型获取配置
 */
export async function getConfigByTypeApi(type: string) {
  return requestClient.get<SystemConfigItem[]>(`/system/config/type/${type}`);
}

/**
 * 获取配置详情
 */
export async function getConfigByIdApi(id: number) {
  return requestClient.get<SystemConfigItem>(`/system/config/${id}`);
}

/**
 * 创建配置
 */
export async function createConfigApi(data: SystemConfigItem) {
  return requestClient.post<SystemConfigItem>('/system/config', data);
}

/**
 * 更新配置
 */
export async function updateConfigApi(id: number, data: SystemConfigItem) {
  return requestClient.put<SystemConfigItem>(`/system/config/${id}`, data);
}

/**
 * 批量更新配置
 */
export async function batchUpdateConfigApi(configs: Record<string, any>) {
  return requestClient.post('/system/config/batch-update', { configs });
}

/**
 * 删除配置
 */
export async function deleteConfigApi(id: number) {
  return requestClient.delete(`/system/config/${id}`);
}

/**
 * 修改配置状态
 */
export async function changeConfigStatusApi(id: number, status: number) {
  return requestClient.post('/system/config/change-status', { id, status });
}
