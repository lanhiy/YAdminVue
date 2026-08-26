<script setup lang="ts">
import type { FormProps } from 'ant-design-vue';

import type { ProductInfo } from '#/api';

import { computed, ref, watch } from 'vue';

import {
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  Modal,
  RadioGroup,
  Textarea,
} from 'ant-design-vue';

import { createProductApi, ProductStatus, updateProductApi } from '#/api';

interface Props {
  visible: boolean;
  mode: 'create' | 'edit';
  productData: null | ProductInfo;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  success: [];
  'update:visible': [value: boolean];
}>();

const formRef = ref();
const loading = ref(false);

const createDefaultForm = (): ProductInfo => ({
  instrument_name: '',
  instrument_no: '',
  model: '',
  manufacturer: '',
  unit_name: '',
  remark: '',
  sort: 0,
  status: ProductStatus.ENABLED,
});

const formData = ref<ProductInfo>(createDefaultForm());

const statusOptions = [
  { label: '启用', value: ProductStatus.ENABLED },
  { label: '禁用', value: ProductStatus.DISABLED },
];

const modalTitle = computed(() =>
  props.mode === 'create' ? '新增产品' : '编辑产品',
);

const rules: FormProps['rules'] = {
  instrument_name: [
    { required: true, message: '请输入器具名称', trigger: 'blur' },
  ],
  instrument_no: [
    { required: true, message: '请输入器具编号', trigger: 'blur' },
  ],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
};

watch(
  () => props.visible,
  (val) => {
    if (val) {
      formData.value = props.productData
        ? { ...props.productData }
        : createDefaultForm();
    }
  },
);

const handleSubmit = async () => {
  try {
    await formRef.value.validate();
    loading.value = true;

    if (props.mode === 'create') {
      await createProductApi(formData.value);
      message.success('创建成功');
    } else {
      await updateProductApi(formData.value.id!, formData.value);
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
    :width="720"
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
      <FormItem label="器具名称" name="instrument_name">
        <Input
          v-model:value="formData.instrument_name"
          allow-clear
          placeholder="请输入器具名称"
        />
      </FormItem>

      <FormItem label="器具编号" name="instrument_no">
        <Input
          v-model:value="formData.instrument_no"
          allow-clear
          placeholder="请输入器具编号，需唯一"
        />
      </FormItem>

      <FormItem label="型号" name="model">
        <Input
          v-model:value="formData.model"
          allow-clear
          placeholder="请输入型号"
        />
      </FormItem>

      <FormItem label="制造厂商" name="manufacturer">
        <Input
          v-model:value="formData.manufacturer"
          allow-clear
          placeholder="请输入制造厂商"
        />
      </FormItem>

      <FormItem label="单位名称" name="unit_name">
        <Input
          v-model:value="formData.unit_name"
          allow-clear
          placeholder="请输入单位名称"
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
