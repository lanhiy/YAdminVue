<script setup lang="ts">
import type { FormProps } from 'ant-design-vue';

import type { ProductInfo, VerificationCertInfo } from '#/api';

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
  Spin,
  Textarea,
} from 'ant-design-vue';


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
const createDefault = (productId: number): VerificationCertInfo => ({
  product_id: productId,
  cert_no: '',
  submit_unit: '',
  unit_name: '',
  basis: '',
  conclusion: '',
  approver_sign_img: '',
  reviewer_sign_img: '',
  verifier_sign_img: '',
  verify_date: '',
  valid_until: '',
  total_pages: 1,
  remark: '',
});

const { formData, isEdit, load, loading, submit, submitting } =
  useProductDoc<VerificationCertInfo>('verification-cert', createDefault, [
    'verify_date',
    'valid_until',
  ]);

const modalTitle = computed(() =>
  isEdit.value ? '编辑检定证书' : '新增检定证书',
);

const rules: FormProps['rules'] = {
  cert_no: [{ required: true, message: '请输入证书编号', trigger: 'blur' }],
  verify_date: [
    { required: true, message: '请选择检定日期', trigger: 'change' },
  ],
  valid_until: [{ required: true, message: '请选择有效期', trigger: 'change' }],
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

        <FormItem label="送检单位" name="submit_unit">
          <Input
            v-model:value="formData.submit_unit"
            allow-clear
            placeholder="请输入送检单位"
          />
        </FormItem>

        <FormItem label="单位名称" name="unit_name">
          <Input
            v-model:value="formData.unit_name"
            allow-clear
            placeholder="请输入单位名称"
          />
        </FormItem>

        <FormItem label="检定依据" name="basis">
          <Textarea
            v-model:value="formData.basis"
            allow-clear
            placeholder="请输入检定依据，如 JJG 315-2019"
            :rows="2"
          />
        </FormItem>

        <FormItem label="检定结论" name="conclusion">
          <Input
            v-model:value="formData.conclusion"
            allow-clear
            placeholder="请输入检定结论，如：合格"
          />
        </FormItem>

        <FormItem label="检定日期" name="verify_date">
          <DatePicker
            v-model:value="formData.verify_date"
            class="w-full"
            placeholder="请选择检定日期"
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

        <FormItem label="检定人签名" name="verifier_sign_img">
          <SignaturePicker v-model:value="formData.verifier_sign_img" />
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
