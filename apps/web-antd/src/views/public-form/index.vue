<script setup lang="ts">
import { reactive, ref } from 'vue';

import { Button, Form, FormItem, Input, message } from 'ant-design-vue';

const formRef = ref();
const loading = ref(false);

const formData = reactive({
  name: '',
  phone: '',
  email: '',
  remark: '',
});

async function handleSubmit() {
  try {
    await formRef.value?.validate();
    loading.value = true;
    message.success('提交成功');
  } finally {
    loading.value = false;
  }
}

function handleReset() {
  formRef.value?.resetFields();
}
</script>

<template>
  <div class="public-form-page">
    <div class="public-form-card">
      <h1 class="public-form-title">信息登记</h1>
      <Form
        ref="formRef"
        :model="formData"
        layout="horizontal"
        :label-col="{ style: { width: '80px' } }"
        :wrapper-col="{ style: { flex: 1 } }"
      >
        <FormItem
          label="姓名"
          name="name"
          :rules="[{ required: true, message: '请输入姓名' }]"
        >
          <Input v-model:value="formData.name" placeholder="请输入姓名" />
        </FormItem>
        <FormItem
          label="手机号"
          name="phone"
          :rules="[{ required: true, message: '请输入手机号' }]"
        >
          <Input v-model:value="formData.phone" placeholder="请输入手机号" />
        </FormItem>
        <FormItem label="邮箱" name="email">
          <Input v-model:value="formData.email" placeholder="请输入邮箱" />
        </FormItem>
        <FormItem label="备注" name="remark">
          <Input.TextArea
            v-model:value="formData.remark"
            placeholder="请输入备注"
            :rows="3"
          />
        </FormItem>
        <FormItem :wrapper-col="{ offset: 0, style: { marginLeft: '80px' } }">
          <Button type="primary" :loading="loading" @click="handleSubmit">
            提交
          </Button>
          <Button class="ml-2" @click="handleReset">重置</Button>
        </FormItem>
      </Form>
    </div>
  </div>
</template>

<style scoped>
.public-form-page {
  min-height: 100vh;
  padding: 48px 24px;
  background: #fff;
}

.public-form-card {
  max-width: 560px;
  margin: 0 auto;
}

.public-form-title {
  margin: 0 0 32px;
  font-size: 20px;
  font-weight: 600;
  color: rgb(0 0 0 / 88%);
}
</style>
