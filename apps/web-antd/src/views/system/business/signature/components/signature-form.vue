<script setup lang="ts">
import type { FormProps } from 'ant-design-vue';

import type { SignatureInfo } from '#/api';

import { computed, ref, watch } from 'vue';

import {
  Button,
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  Modal,
  Textarea,
  Upload,
} from 'ant-design-vue';

import {
  createSignatureApi,
  updateSignatureApi,
  uploadImageApi,
} from '#/api';
import { resolveAssetUrl } from '#/utils/asset';

interface Props {
  visible: boolean;
  mode: 'create' | 'edit';
  signatureData: null | SignatureInfo;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  success: [];
  'update:visible': [value: boolean];
}>();

const formRef = ref();
const loading = ref(false);
const uploading = ref(false);

const createDefaultForm = (): SignatureInfo => ({
  name: '',
  image_url: '',
  remark: '',
  sort: 0,
});

const formData = ref<SignatureInfo>(createDefaultForm());

const modalTitle = computed(() =>
  props.mode === 'create' ? '新增签名' : '编辑签名',
);

const previewUrl = computed(() => resolveAssetUrl(formData.value.image_url));

const rules: FormProps['rules'] = {
  name: [{ required: true, message: '请输入签名人姓名', trigger: 'blur' }],
  image_url: [{ required: true, message: '请上传签名图片', trigger: 'change' }],
};

watch(
  () => props.visible,
  (val) => {
    if (val) {
      formData.value = props.signatureData
        ? { ...props.signatureData }
        : createDefaultForm();
    }
  },
);

/** 交给自定义上传，绕开 Upload 组件默认的 action 行为 */
const handleUpload = async (options: any) => {
  const { file, onError, onSuccess } = options;

  try {
    uploading.value = true;
    const result = await uploadImageApi(file as File, 'signature');
    formData.value.image_url = result.url;
    message.success('图片上传成功');
    onSuccess?.(result);
  } catch (error: any) {
    message.error(error.message || '图片上传失败');
    onError?.(error);
  } finally {
    uploading.value = false;
  }
};

/** 上传前本地校验，省一次无效请求 */
const beforeUpload = (file: File) => {
  const allowed = [
    'image/bmp',
    'image/gif',
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  if (!allowed.includes(file.type)) {
    message.error('只支持 jpg/png/gif/webp/bmp 格式的图片');
    return Upload.LIST_IGNORE;
  }

  if (file.size > 5 * 1024 * 1024) {
    message.error('图片大小不能超过 5MB');
    return Upload.LIST_IGNORE;
  }

  return true;
};

const handleSubmit = async () => {
  try {
    await formRef.value.validate();
    loading.value = true;

    if (props.mode === 'create') {
      await createSignatureApi(formData.value);
      message.success('创建成功');
    } else {
      await updateSignatureApi(formData.value.id!, formData.value);
      message.success('更新成功');
    }

    emit('success');
    handleClose();
  } catch (error: any) {
    if (error.errorFields) {
      return;
    }
    message.error(error.message || '操作失败');
  } finally {
    loading.value = false;
  }
};

const handleClose = () => {
  formRef.value?.resetFields();
  emit('update:visible', false);
};
</script>

<template>
  <Modal
    :confirm-loading="loading"
    :open="visible"
    :title="modalTitle"
    :width="640"
    @cancel="handleClose"
    @ok="handleSubmit"
  >
    <Form
      ref="formRef"
      class="mt-4"
      :label-col="{ span: 5 }"
      :model="formData"
      :rules="rules"
      :wrapper-col="{ span: 17 }"
    >
      <FormItem label="签名人姓名" name="name">
        <Input
          v-model:value="formData.name"
          allow-clear
          placeholder="请输入签名人姓名"
        />
      </FormItem>

      <FormItem label="签名图片" name="image_url">
        <div class="flex items-center gap-3">
          <div
            class="flex h-20 w-40 shrink-0 items-center justify-center overflow-hidden rounded border border-dashed border-gray-300 bg-gray-50"
          >
            <img
              v-if="previewUrl"
              :src="previewUrl"
              alt="签名预览"
              class="h-full w-full object-contain"
            />
            <span v-else class="text-xs text-gray-400">暂无图片</span>
          </div>
          <Upload
            :before-upload="beforeUpload"
            :custom-request="handleUpload"
            :show-upload-list="false"
          >
            <Button :loading="uploading">
              {{ formData.image_url ? '重新上传' : '上传图片' }}
            </Button>
          </Upload>
        </div>
        <div class="mt-1 text-xs text-gray-400">
          支持 jpg/png/gif/webp/bmp，5MB 以内。建议使用透明背景 PNG。
        </div>
      </FormItem>

      <FormItem label="排序" name="sort">
        <InputNumber
          v-model:value="formData.sort"
          class="w-full"
          :min="0"
          placeholder="请输入排序"
        />
      </FormItem>


      <FormItem label="备注" name="remark">
        <Textarea
          v-model:value="formData.remark"
          allow-clear
          placeholder="请输入备注，例如该签名的用途"
          :rows="3"
        />
      </FormItem>
    </Form>
  </Modal>
</template>
