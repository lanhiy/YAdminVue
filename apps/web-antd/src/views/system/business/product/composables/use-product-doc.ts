import type { DocType } from '#/api';

import { ref } from 'vue';

import { message } from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  createDocApi,
  deleteDocApi,
  getDocByProductApi,
  updateDocApi,
} from '#/api';

/**
 * 产品单据（测试报告/检定证书/校准证书）的加载与保存逻辑。
 *
 * 三张子表与产品都是一对一，所以打开表单时先按产品ID查一次：
 * 查到就是编辑，没查到就是新增。三个表单共用这套流程。
 */
export function useProductDoc<T extends { id?: number; product_id: number }>(
  type: DocType,
  createDefault: (productId: number) => T,
  dateFields: (keyof T)[],
) {
  const loading = ref(false);
  const submitting = ref(false);
  /** 是否已存在单据，决定标题文案和走 create 还是 update */
  const isEdit = ref(false);
  const formData = ref<T>(createDefault(0));

  /**
   * 按产品ID载入单据，不存在则填一份默认值.
   */
  const load = async (productId: number) => {
    try {
      loading.value = true;
      const existing = await getDocByProductApi<T>(type, productId);

      if (existing) {
        isEdit.value = true;
        formData.value = { ...existing };
      } else {
        isEdit.value = false;
        formData.value = createDefault(productId);
      }
    } catch (error: any) {
      isEdit.value = false;
      formData.value = createDefault(productId);
      message.error(error.message || '加载单据失败');
    } finally {
      loading.value = false;
    }
  };

  /**
   * 提交，返回是否成功。日期统一格式化成 YYYY-MM-DD。
   */
  const submit = async (): Promise<boolean> => {
    try {
      submitting.value = true;

      const payload = { ...formData.value } as T;

      for (const field of dateFields) {
        const value = payload[field];
        if (value) {
          payload[field] = dayjs(value as any).format('YYYY-MM-DD') as any;
        }
      }

      if (isEdit.value && payload.id) {
        await updateDocApi<T>(type, payload.id, payload);
        message.success('更新成功');
      } else {
        await createDocApi<T>(type, payload);
        message.success('创建成功');
      }

      return true;
    } catch (error: any) {
      message.error(error.message || '保存失败');
      return false;
    } finally {
      submitting.value = false;
    }
  };

  /**
   * 删除当前单据.
   */
  const remove = async (): Promise<boolean> => {
    const id = formData.value.id;

    if (!id) {
      return false;
    }

    try {
      submitting.value = true;
      await deleteDocApi(type, id);
      message.success('删除成功');
      return true;
    } catch (error: any) {
      message.error(error.message || '删除失败');
      return false;
    } finally {
      submitting.value = false;
    }
  };

  return { formData, isEdit, load, loading, remove, submit, submitting };
}
