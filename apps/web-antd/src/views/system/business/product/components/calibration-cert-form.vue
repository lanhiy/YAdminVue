<script setup lang="ts">
import type { FormProps } from 'ant-design-vue';

import type { CalibrationCertInfo, ProductInfo } from '#/api';

import { computed, ref, watch } from 'vue';

import {
  DatePicker,
  Descriptions,
  DescriptionsItem,
  Form,
  FormItem,
  Input,
  InputNumber,
  Modal,
  RadioGroup,
  Spin,
  Textarea,
} from 'ant-design-vue';

import { DocStatus } from '#/api';

import { useProductDoc } from '../composables/use-product-doc';
import SignaturePicker from './signature-picker.vue';

interface Props {
  visible: boolean;
  product: null | ProductInfo;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  success: [];
  'update:visible': [value: boolean];
}>();

const formRef = ref();

/** 一对一：打开时按产品ID查，有则编辑无则新增 */
const createDefault = (productId: number): CalibrationCertInfo => ({
  product_id: productId,
  cert_no: '',
  client_name: '',
  unit_name: '',
  address: '',
  approver_sign_img: '',
  reviewer_sign_img: '',
  calibrator_sign_img: '',
  receive_date: '',
  calibrate_date: '',
  issue_date: '',
  total_pages: 1,
  remark: '',
  status: DocStatus.ENABLED,
});

const { formData, isEdit, load, loading, submit, submitting } =
  useProductDoc<CalibrationCertInfo>('calibration-cert', createDefault, [
    'receive_date',
    'calibrate_date',
    'issue_date',
  ]);

const statusOptions = [
  { label: '启用', value: DocStatus.ENABLED },
  { label: '禁用', value: DocStatus.DISABLED },
];

const modalTitle = computed(() =>
  isEdit.value ? '编辑校准证书' : '新增校准证书',
);

const rules: FormProps['rules'] = {
  cert_no: [{ required: true, message: '请输入证书编号', trigger: 'blur' }],
  receive_date: [
    { required: true, message: '请选择接收日期', trigger: 'change' },
  ],
  calibrate_date: [
    { required: true, message: '请选择校准日期', trigger: 'change' },
  ],
  issue_date: [
    { required: true, message: '请选择签发日期', trigger: 'change' },
  ],
};

watch(
  () => props.visible,
  (val) => {
    if (val && props.product?.id) {
      load(props.product.id);
    }
  },
);

const handleSubmit = async () => {
  try {
    await formRef.value.validate();
  } catch {
    return;
  }

  if (await submit()) {
    emit('success');
    handleClose();
  }
};

const handleClose = () => {
  emit('update:visible', false);
};
</script>

<template>
  <Modal
    :confirm-loading="submitting"
    :open="visible"
    :title="modalTitle"
    :width="860"
    @cancel="handleClose"
    @ok="handleSubmit"
  >
    <Spin :spinning="loading">
      <!-- 所属产品只读展示 -->
      <Descriptions
        v-if="product"
        bordered
        class="mb-4"
        :column="2"
        size="small"
        title="所属产品"
      >
        <DescriptionsItem label="器具名称">
          {{ product.instrument_name }}
        </DescriptionsItem>
        <DescriptionsItem label="器具编号">
          {{ product.instrument_no }}
        </DescriptionsItem>
        <DescriptionsItem label="型号">
          {{ product.model || '-' }}
        </DescriptionsItem>
        <DescriptionsItem label="制造厂商">
          {{ product.manufacturer || '-' }}
        </DescriptionsItem>
      </Descriptions>

      <Form
        ref="formRef"
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

        <FormItem label="委托方" name="client_name">
          <Input
            v-model:value="formData.client_name"
            allow-clear
            placeholder="请输入委托方"
          />
        </FormItem>

        <FormItem label="单位名称" name="unit_name">
          <Input
            v-model:value="formData.unit_name"
            allow-clear
            placeholder="请输入单位名称"
          />
        </FormItem>

        <FormItem label="地址" name="address">
          <Input
            v-model:value="formData.address"
            allow-clear
            placeholder="请输入地址"
          />
        </FormItem>

        <FormItem label="接收日期" name="receive_date">
          <DatePicker
            v-model:value="formData.receive_date"
            class="w-full"
            placeholder="请选择接收日期"
            value-format="YYYY-MM-DD"
          />
        </FormItem>

        <FormItem label="校准日期" name="calibrate_date">
          <DatePicker
            v-model:value="formData.calibrate_date"
            class="w-full"
            placeholder="请选择校准日期"
            value-format="YYYY-MM-DD"
          />
        </FormItem>

        <FormItem label="签发日期" name="issue_date">
          <DatePicker
            v-model:value="formData.issue_date"
            class="w-full"
            placeholder="请选择签发日期"
            value-format="YYYY-MM-DD"
          />
        </FormItem>

        <FormItem label="总页数" name="total_pages">
          <InputNumber
            v-model:value="formData.total_pages"
            class="w-full"
            :min="1"
            placeholder="请输入总页数"
          />
        </FormItem>

        <FormItem label="批准人签名" name="approver_sign_img">
          <SignaturePicker v-model:value="formData.approver_sign_img" />
        </FormItem>

        <FormItem label="核验人签名" name="reviewer_sign_img">
          <SignaturePicker v-model:value="formData.reviewer_sign_img" />
        </FormItem>

        <FormItem label="校准人签名" name="calibrator_sign_img">
          <SignaturePicker v-model:value="formData.calibrator_sign_img" />
        </FormItem>

        <FormItem label="状态" name="status">
          <RadioGroup
            v-model:value="formData.status"
            :options="statusOptions"
          />
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
    </Spin>
  </Modal>
</template>
