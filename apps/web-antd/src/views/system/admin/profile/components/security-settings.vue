<script setup lang="ts">
import { ref } from 'vue';
import {
  Form,
  FormItem,
  Input,
  List,
  ListItem,
  ListItemMeta,
  Modal,
  Button,  // ✅ 从 ant-design-vue 导入 Button
  message,
} from 'ant-design-vue';
import { changePasswordApi } from '#/api';

const emit = defineEmits<{
  success: [];
}>();

const passwordModalVisible = ref(false);
const passwordFormRef = ref();
const loading = ref(false);

const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

// 密码表单规则
const passwordRules = {
  oldPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' },
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于5位', trigger: 'blur' },
    { max: 50, message: '密码长度不能超过50位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (_rule: any, value: string) => {
        if (value !== passwordForm.value.newPassword) {
          return Promise.reject('两次输入的密码不一致');
        }
        return Promise.resolve();
      },
      trigger: 'blur',
    },
  ],
};

// 安全设置列表
const securityList = [
  {
    key: 'password',
    title: '账户密码',
    description: '定期修改密码可以提高账户安全性',
    action: '修改密码',
    icon: 'i-ant-design:lock-outlined',
    onClick: () => {
      passwordModalVisible.value = true;
    },
  },
  {
    key: 'phone',
    title: '密保手机',
    description: '已绑定手机：138****8888',
    action: '修改',
    icon: 'i-ant-design:mobile-outlined',
    onClick: () => {
      message.info('此功能待开发');
    },
  },
  {
    key: 'email',
    title: '密保邮箱',
    description: '已绑定邮箱：user@example.com',
    action: '修改',
    icon: 'i-ant-design:mail-outlined',
    onClick: () => {
      message.info('此功能待开发');
    },
  },
];

// 修改密码
const handleChangePassword = async () => {
  try {
    await passwordFormRef.value.validate();
    loading.value = true;

    await changePasswordApi({
      oldPassword: passwordForm.value.oldPassword,
      newPassword: passwordForm.value.newPassword,
      newPassword_confirmation: passwordForm.value.confirmPassword,
    });

    message.success('密码修改成功，请重新登录');
    passwordModalVisible.value = false;
    passwordForm.value = {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    };
    emit('success');

    // 3秒后跳转到登录页
    setTimeout(() => {
      window.location.href = '/auth/login';
    }, 3000);
  } catch (error: any) {
    if (error.errorFields) {
      return;
    }
    // message.error(error.message || '密码修改失败');
  } finally {
    loading.value = false;
  }
};

// 关闭密码弹窗
const handleClosePasswordModal = () => {
  passwordModalVisible.value = false;
  passwordFormRef.value?.resetFields();
};
</script>

<template>
  <div class="max-w-3xl">
    <List :data-source="securityList" :split="true">
      <template #renderItem="{ item }">
        <ListItem>
          <ListItemMeta>
            <template #avatar>
              <div class="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                <i :class="item.icon" class="text-2xl text-blue-500" />
              </div>
            </template>
            <template #title>
              <span class="font-medium">{{ item.title }}</span>
            </template>
            <template #description>
              <span class="text-gray-500">{{ item.description }}</span>
            </template>
          </ListItemMeta>
          <template #actions>
            <Button type="link" @click="item.onClick">
              {{ item.action }}
            </Button>
          </template>
        </ListItem>
      </template>
    </List>

    <!-- 修改密码弹窗 -->
    <Modal
      v-model:open="passwordModalVisible"
      title="修改密码"
      :confirm-loading="loading"
      @ok="handleChangePassword"
      @cancel="handleClosePasswordModal"
    >
      <Form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
        class="mt-4"
      >
        <FormItem label="当前密码" name="oldPassword">
          <Input.Password
            v-model:value="passwordForm.oldPassword"
            placeholder="请输入当前密码"
            allow-clear
          />
        </FormItem>

        <FormItem label="新密码" name="newPassword">
          <Input.Password
            v-model:value="passwordForm.newPassword"
            placeholder="请输入新密码（5-50位）"
            allow-clear
          />
        </FormItem>

        <FormItem label="确认新密码" name="confirmPassword">
          <Input.Password
            v-model:value="passwordForm.confirmPassword"
            placeholder="请再次输入新密码"
            allow-clear
          />
        </FormItem>

        <div class="text-sm text-gray-500 pl-24">
          <p class="mb-1">密码要求：</p>
          <ul class="list-disc list-inside space-y-1">
            <li>长度为 5-50 个字符</li>
            <li>建议包含字母、数字和特殊字符</li>
            <li>不要使用过于简单的密码</li>
          </ul>
        </div>
      </Form>
    </Modal>
  </div>
</template>
