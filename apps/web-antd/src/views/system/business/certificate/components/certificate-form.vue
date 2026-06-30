<script setup lang="ts">
import type { CertificateInfo } from '#/api';

import { computed, ref, watch } from 'vue';

import {
  DatePicker,
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  Modal,
  RadioGroup,
  Textarea,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  CertificateStatus,
  createCertificateApi,
  updateCertificateApi,
} from '#/api';

interface Props {
  visible: boolean;
  mode: 'create' | 'edit';
  certificateData: CertificateInfo | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  success: [];
  'update:visible': [value: boolean];
}>();

const formRef = ref();
const loading = ref(false);

const createDefaultForm = (): CertificateInfo => ({
  cert_no: '',
  unit_name: '',
  instrument_name: '',
  model: '',
  factory_no: '',
  manufacturer: '',
  check_date: '',
  valid_until: '',
  check_unit: '',
  remark: '',
  sort: 0,
  status: CertificateStatus.ENABLED,
});

const formData = ref<CertificateInfo>(createDefaultForm());

// 状态下拉选项
const statusOptions = [
  { label: '启用', value: CertificateStatus.ENABLED },
  { label: '禁用', value: CertificateStatus.DISABLED },
];

// 弹窗标题
const modalTitle = computed(() => {
  return props.mode === 'create' ? '新增证书' : '编辑证书';
});

// 表单验证规则
const rules = {
  cert_no: [{ required: true, message: '请输入证书编号', trigger: 'blur' }],
  unit_name: [{ required: true, message: '请输入单位名称', trigger: 'blur' }],
  instrument_name: [
    { required: true, message: '请输入器具名称', trigger: 'blur' },
  ],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
};

// 监听弹窗显示
watch(
  () => props.visible,
  (val) => {
    if (val) {
      formData.value = props.certificateData
        ? { ...props.certificateData }
        : createDefaultForm();
    }
  },
);

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value.validate();
    loading.value = true;

    const submitData = { ...formData.value };

    // 日期统一格式化为 YYYY-MM-DD
    if (submitData.check_date) {
      submitData.check_date = dayjs(submitData.check_date).format('YYYY-MM-DD');
    }
    if (submitData.valid_until) {
      submitData.valid_until = dayjs(submitData.valid_until).format(
        'YYYY-MM-DD',
      );
    }

    if (props.mode === 'create') {
      await createCertificateApi(submitData);
      message.success('创建成功');
    } else {
      await updateCertificateApi(formData.value.id!, submitData);
      message.success('更新成功');
    }

    emit('success');
    handleClose();
  } catch (error: any) {
    if (error.errorFields) {
      return; // 表单验证错误
    }
    message.error(error.message || '操作失败');
  } finally {
    loading.value = false;
  }
};

// 关闭弹窗
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
    :width="800"
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
      <FormItem label="证书编号" name="cert_no">
        <Input
          v-model:value="formData.cert_no"
          allow-clear
          placeholder="请输入证书编号"
        />
      </FormItem>

      <FormItem label="单位名称" name="unit_name">
        <Input
          v-model:value="formData.unit_name"
          allow-clear
          placeholder="请输入单位名称"
        />
      </FormItem>

      <FormItem label="器具名称" name="instrument_name">
        <Input
          v-model:value="formData.instrument_name"
          allow-clear
          placeholder="请输入器具名称"
        />
      </FormItem>

      <FormItem label="型号规格" name="model">
        <Input
          v-model:value="formData.model"
          allow-clear
          placeholder="请输入型号规格"
        />
      </FormItem>

      <FormItem label="出厂编号" name="factory_no">
        <Input
          v-model:value="formData.factory_no"
          allow-clear
          placeholder="请输入出厂编号"
        />
      </FormItem>

      <FormItem label="制造厂商" name="manufacturer">
        <Input
          v-model:value="formData.manufacturer"
          allow-clear
          placeholder="请输入制造厂商"
        />
      </FormItem>

      <FormItem label="校检日期" name="check_date">
        <DatePicker
          v-model:value="formData.check_date"
          class="w-full"
          placeholder="请选择校检日期"
          value-format="YYYY-MM-DD"
        />
      </FormItem>

      <FormItem label="有效期" name="valid_until">
        <DatePicker
          v-model:value="formData.valid_until"
          class="w-full"
          placeholder="请选择有效期"
          value-format="YYYY-MM-DD"
        />
      </FormItem>

      <FormItem label="校检单位" name="check_unit">
        <Input
          v-model:value="formData.check_unit"
          allow-clear
          placeholder="请输入校检单位"
        />
      </FormItem>

      <FormItem label="排序" name="sort">
        <InputNumber
          v-model:value="formData.sort"
          class="w-full"
          :min="0"
          placeholder="请输入排序"
        />
      </FormItem>

      <FormItem label="状态" name="status">
        <RadioGroup v-model:value="formData.status" :options="statusOptions" />
      </FormItem>

      <FormItem label="备注" name="remark">
        <Textarea
          v-model:value="formData.remark"
          allow-clear
          placeholder="请输入备注"
          :rows="3"
        />
      </FormItem>
    </Form>
  </Modal>
</template>
