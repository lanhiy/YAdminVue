import { requestClient } from '#/api/request';

/**
 * 证书状态枚举
 */
export enum CertificateStatus {
  /** 禁用 */
  DISABLED = 0,
  /** 启用 */
  ENABLED = 1,
}

/**
 * 证书信息接口
 */
export interface CertificateInfo {
  id?: number;
  cert_no: string;
  unit_name: string;
  instrument_name: string;
  model?: string;
  factory_no?: string;
  manufacturer?: string;
  check_date?: string;
  valid_until?: string;
  check_unit?: string;
  remark?: string;
  sort?: number;
  status: CertificateStatus;
  created_by?: number;
  updated_by?: number;
  created_by_name?: string;
  updated_by_name?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * 证书列表查询参数
 */
export interface CertificateListParams {
  page?: number;
  page_size?: number;
  cert_no?: string;
  unit_name?: string;
  instrument_name?: string;
  status?: CertificateStatus;
}

/**
 * 证书列表返回结果
 */
export interface CertificateListResult {
  list: CertificateInfo[];
  total: number;
  page: number;
  page_size: number;
}

/**
 * 获取证书列表（分页）
 */
export async function getCertificateListApi(params?: CertificateListParams) {
  return requestClient.get<CertificateListResult>(
    '/system/business/certificate/list',
    {
      params,
    },
  );
}

/**
 * 获取证书详情
 */
export async function getCertificateDetailApi(id: number) {
  return requestClient.get<CertificateInfo>(
    `/system/business/certificate/${id}`,
  );
}

/**
 * 创建证书
 */
export async function createCertificateApi(data: CertificateInfo) {
  return requestClient.post<CertificateInfo>(
    '/system/business/certificate',
    data,
  );
}

/**
 * 更新证书
 */
export async function updateCertificateApi(id: number, data: CertificateInfo) {
  return requestClient.put<CertificateInfo>(
    `/system/business/certificate/${id}`,
    data,
  );
}

/**
 * 删除证书
 */
export async function deleteCertificateApi(id: number) {
  return requestClient.delete(`/system/business/certificate/${id}`);
}

/**
 * 修改证书状态
 */
export async function changeCertificateStatusApi(
  id: number,
  status: CertificateStatus,
) {
  return requestClient.post('/system/business/certificate/change-status', {
    id,
    status,
  });
}
