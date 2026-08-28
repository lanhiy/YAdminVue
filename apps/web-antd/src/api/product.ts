import { requestClient } from '#/api/request';

/**
 * 产品（器具）信息
 */
export interface ProductInfo {
  id?: number;
  /** 器具名称 */
  instrument_name: string;
  /** 器具编号 */
  instrument_no: string;
  /** 型号 */
  model?: string;
  /** 制造厂商 */
  manufacturer?: string;
  remark?: string;
  sort?: number;
  created_by?: number;
  updated_by?: number;
  created_by_name?: string;
  updated_by_name?: string;
  /** 以下由后端附加：三张子表的录入情况 */
  test_report_id?: number;
  verification_cert_id?: number;
  calibration_cert_id?: number;
  has_test_report?: boolean;
  has_verification_cert?: boolean;
  has_calibration_cert?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * 产品下拉选项
 */
export interface ProductOption {
  id: number;
  instrument_name: string;
  instrument_no: string;
  model: string;
}

/**
 * 产品列表查询参数
 */
export interface ProductListParams {
  page?: number;
  page_size?: number;
  instrument_name?: string;
  instrument_no?: string;
  model?: string;
  manufacturer?: string;
}

/**
 * 产品列表返回结果
 */
export interface ProductListResult {
  list: ProductInfo[];
  total: number;
  page: number;
  page_size: number;
}

/** PDF 模板类型；两种校准证书读取同一份校准证书数据。 */
export type ProductPdfType =
  | 'calibration-cert-cnas'
  | 'calibration-cert-no-cnas'
  | 'test-report'
  | 'verification-cert';

export interface ProductPdfData {
  certificate_id: number;
  document: Record<string, unknown>;
  document_name: string;
  document_type: ProductPdfType;
  public_token: string;
  product: ProductInfo;
  url: string;
}

/**
 * 获取产品列表（分页）
 */
export async function getProductListApi(params?: ProductListParams) {
  return requestClient.get<ProductListResult>('/system/business/product/list', {
    params,
  });
}

/**
 * 获取产品下拉选项
 */
export async function getProductOptionsApi() {
  return requestClient.get<ProductOption[]>('/system/business/product/options');
}

/**
 * 获取产品详情（含三张子表数据）
 */
export async function getProductDetailApi(id: number) {
  return requestClient.get<ProductInfo>(`/system/business/product/${id}`);
}

/**
 * 创建产品
 */
export async function createProductApi(data: ProductInfo) {
  return requestClient.post<ProductInfo>('/system/business/product', data);
}

/**
 * 复制产品及其已有报告/证书
 */
export async function copyProductApi(id: number) {
  return requestClient.post<ProductInfo>(`/system/business/product/copy/${id}`);
}

/** 获取指定 PDF 模板所需的产品及单据数据（暂不生成文件） */
export async function getProductPdfDataApi(
  certificateId: number,
  type: ProductPdfType,
) {
  return requestClient.post<ProductPdfData>(
    `/system/business/product/pdf-data/${certificateId}`,
    { type },
  );
}

/** 公开证书查询结果；字段值统一为字符串，缺失值为空字符串。 */
export interface CertificateResult {
  certificate_no: string;
  unit_name: string;
  instrument_name: string;
  model: string;
  instrument_no: string;
  manufacturer: string;
  check_date: string;
  valid_until: string;
  check_unit: string;
}

export async function getCertificateResultApi(token: string) {
  return requestClient.get<CertificateResult>(
    `/certificate/${encodeURIComponent(token)}`,
  );
}

/**
 * 更新产品
 */
export async function updateProductApi(id: number, data: ProductInfo) {
  return requestClient.put<ProductInfo>(`/system/business/product/${id}`, data);
}

/**
 * 删除产品（后端会级联删除三张子表数据）
 */
export async function deleteProductApi(id: number) {
  return requestClient.delete(`/system/business/product/${id}`);
}
