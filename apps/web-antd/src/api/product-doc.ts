import { requestClient } from '#/api/request';

/**
 * 单据状态枚举（测试报告 / 检定证书 / 校准证书共用）
 */
export enum DocStatus {
  /** 禁用 */
  DISABLED = 0,
  /** 启用 */
  ENABLED = 1,
}

/**
 * 单据上附带的产品简要信息（后端附加）
 */
export interface DocProductBrief {
  id: number;
  instrument_name: string;
  instrument_no: string;
  model: string;
  manufacturer: string;
  unit_name: string;
}

/**
 * 三张子表的公共字段
 */
interface DocBase {
  id?: number;
  product_id: number;
  /** 单位名称 */
  unit_name?: string;
  total_pages?: number;
  remark?: string;
  status: DocStatus;
  created_by?: number;
  updated_by?: number;
  created_by_name?: string;
  updated_by_name?: string;
  product?: DocProductBrief | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * 测试报告
 */
export interface TestReportInfo extends DocBase {
  /** 报告编号 */
  report_no: string;
  /** 委托方 */
  client_name?: string;
  /** 批准人签名图片 */
  approver_sign_img?: string;
  /** 核验人签名图片 */
  reviewer_sign_img?: string;
  /** 测试人签名图片 */
  tester_sign_img?: string;
  /** 测试日期 */
  test_date: string;
}

/**
 * 检定证书
 */
export interface VerificationCertInfo extends DocBase {
  /** 证书编号 */
  cert_no: string;
  /** 送检单位 */
  submit_unit?: string;
  /** 检定依据 */
  basis?: string;
  /** 检定结论 */
  conclusion?: string;
  /** 批准人签名图片 */
  approver_sign_img?: string;
  /** 核验人签名图片 */
  reviewer_sign_img?: string;
  /** 检定人签名图片 */
  verifier_sign_img?: string;
  /** 检定日期 */
  verify_date: string;
  /** 有效期 */
  valid_until: string;
}

/**
 * 校准证书
 */
export interface CalibrationCertInfo extends DocBase {
  /** 证书编号 */
  cert_no: string;
  /** 委托方 */
  client_name?: string;
  /** 地址 */
  address?: string;
  /** 批准人签名图片 */
  approver_sign_img?: string;
  /** 核验人签名图片 */
  reviewer_sign_img?: string;
  /** 校准人签名图片 */
  calibrator_sign_img?: string;
  /** 接收日期 */
  receive_date: string;
  /** 校准日期 */
  calibrate_date: string;
  /** 签发日期 */
  issue_date: string;
}

/**
 * 单据类型标识，与后端路由段一一对应
 */
export type DocType = 'calibration-cert' | 'test-report' | 'verification-cert';

/**
 * 按产品ID获取单据，未录入时返回 null
 */
export async function getDocByProductApi<T>(type: DocType, productId: number) {
  return requestClient.get<null | T>(
    `/system/business/${type}/by-product/${productId}`,
  );
}

/**
 * 创建单据
 */
export async function createDocApi<T>(type: DocType, data: T) {
  return requestClient.post<T>(`/system/business/${type}`, data);
}

/**
 * 更新单据
 */
export async function updateDocApi<T>(type: DocType, id: number, data: T) {
  return requestClient.put<T>(`/system/business/${type}/${id}`, data);
}

/**
 * 删除单据
 */
export async function deleteDocApi(type: DocType, id: number) {
  return requestClient.delete(`/system/business/${type}/${id}`);
}
