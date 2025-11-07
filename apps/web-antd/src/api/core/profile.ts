// #/api/profile.ts
import { requestClient } from '#/api/request';

export interface UpdateProfileParams {
  nickname: string;
  mobile?: string;
  email?: string;
  gender?: number;
  avatar?: string;
  remark?: string;
}

export interface ChangePasswordParams {
  oldPassword: string;
  newPassword: string;
  newPassword_confirmation: string;
}

/**
 * 获取个人资料
 */
export async function getProfileApi() {
  return requestClient.get('/system/profile'); // ✅ 添加 /system 前缀
}

/**
 * 更新个人资料
 */
export async function updateProfileApi(data: UpdateProfileParams) {
  return requestClient.put('/system/profile', data); // ✅ 添加 /system 前缀
}

/**
 * 修改密码
 */
export async function changePasswordApi(data: ChangePasswordParams) {
  return requestClient.post('/system/profile/change-password', data); // ✅ 添加 /system 前缀
}

/**
 * 上传头像
 */
export async function uploadAvatarApi(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return requestClient.post('/system/profile/upload-avatar', formData, { // ✅ 添加 /system 前缀
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
