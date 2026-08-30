<script setup lang="ts">
import type { FormProps } from 'ant-design-vue';

import type { ProductInfo, TestReportInfo } from '#/api';

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
const createDefault = (productId: number): TestReportInfo => ({
  product_id: productId,
  report_no: '',
  client_name: '',
  approver_sign_img: '',
  reviewer_sign_img: '',
  tester_sign_img: '',
  test_date: '',
  total_pages: 1,
  remark: '',
});

const { formData, isEdit, load, loading, submit, submitting } =
  useProductDoc<TestReportInfo>('test-report', createDefault, ['test_date']);

const modalTitle = computed(() =>
  isEdit.value ? '编辑测试报告' : '新增测试报告',
);

const rules: FormProps['rules'] = {
  report_no: [{ required: true, message: '请输入报告编号', trigger: 'blur' }],
  test_date: [{ required: true, message: '请选择测试日期', trigger: 'change' }],
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
        <FormItem label="报告编号" name="report_no">
          <Input
            v-model:value="formData.report_no"
            allow-clear
            :maxlength="100"
            placeholder="请输入报告编号"
          />
        </FormItem>

        <FormItem label="委托方" name="client_name">
          <Input
            v-model:value="formData.client_name"
            allow-clear
            placeholder="请输入委托方"
          />
        </FormItem>

        <FormItem label="测试日期" name="test_date">
          <DatePicker
            v-model:value="formData.test_date"
            class="w-full"
            placeholder="请选择测试日期"
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

        <FormItem label="测试人签名" name="tester_sign_img">
          <SignaturePicker v-model:value="formData.tester_sign_img" />
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
