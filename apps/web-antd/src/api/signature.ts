import { requestClient } from '#/api/request';

/**
 * 签名状态枚举
 */
export enum SignatureStatus {
  /** 禁用 */
  DISABLED = 0,
  /** 启用 */
  ENABLED = 1,
}

/**
 * 签名信息
 */
export interface SignatureInfo {
  id?: number;
  /** 签名人姓名 */
  name: string;
  /** 签名图片地址 */
  image_url: string;
  remark?: string;
  sort?: number;
  status: SignatureStatus;
  created_by?: number;
  updated_by?: number;
  created_by_name?: string;
  updated_by_name?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * 签名选择器用的精简选项
 */
export interface SignatureOption {
  id: number;
  name: string;
  image_url: string;
}

/**
 * 签名列表查询参数
 */
export interface SignatureListParams {
  page?: number;
  page_size?: number;
  name?: string;
  status?: SignatureStatus;
}

/**
 * 签名列表返回结果
 */
export interface SignatureListResult {
  list: SignatureInfo[];
  total: number;
  page: number;
  page_size: number;
}

/**
 * 获取签名列表（分页）
 */
export async function getSignatureListApi(params?: SignatureListParams) {
  return requestClient.get<SignatureListResult>(
    '/system/business/signature/list',
    { params },
  );
}

/**
 * 获取启用状态的签名（单据表单签名选择器用）
 */
export async function getEnabledSignaturesApi() {
  return requestClient.get<SignatureOption[]>('/system/business/signature/all');
}

/**
 * 获取签名详情
 */
export async function getSignatureDetailApi(id: number) {
  return requestClient.get<SignatureInfo>(`/system/business/signature/${id}`);
}

/**
 * 创建签名
 */
export async function createSignatureApi(data: SignatureInfo) {
  return requestClient.post<SignatureInfo>('/system/business/signature', data);
}

/**
 * 更新签名
 */
export async function updateSignatureApi(id: number, data: SignatureInfo) {
  return requestClient.put<SignatureInfo>(
    `/system/business/signature/${id}`,
    data,
  );
}

/**
 * 删除签名
 *
 * 单据里存的是图片URL副本，删除签名不影响已签发的报告和证书。
 */
export async function deleteSignatureApi(id: number) {
  return requestClient.delete(`/system/business/signature/${id}`);
}

/**
 * 修改签名状态
 */
export async function changeSignatureStatusApi(
  id: number,
  status: SignatureStatus,
) {
  return requestClient.post('/system/business/signature/change-status', {
    id,
    status,
  });
}
