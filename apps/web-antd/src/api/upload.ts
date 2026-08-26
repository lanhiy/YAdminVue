import { requestClient } from '#/api/request';

/**
 * 上传结果
 */
export interface UploadResult {
  /** 可直接用于 img src 的相对地址 */
  url: string;
  /** 相对上传根目录的存储路径 */
  path: string;
  /** 原始文件名 */
  name: string;
  /** 文件体积（字节） */
  size: number;
}

/**
 * 上传图片
 *
 * @param file 图片文件，限 jpg/jpeg/png/gif/webp/bmp，5MB 以内
 * @param dir 业务子目录，默认 signature
 */
export async function uploadImageApi(file: File, dir = 'signature') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('dir', dir);

  return requestClient.post<UploadResult>('/system/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}
