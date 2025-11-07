<script setup lang="ts">
import { ref, watch } from 'vue';
import {
  Form,
  FormItem,
  Input,
  Radio,
  RadioGroup,
  Textarea,
  Upload,
  Avatar,
  Button,  // ✅ 从 ant-design-vue 导入 Button
  message,
} from 'ant-design-vue';
import { AdminGender } from '#/api';
import { updateProfileApi } from '#/api';
import type { UploadChangeParam } from 'ant-design-vue';

interface Props {
  userInfo: {
    username: string;
    nickname: string;
    mobile: string;
    email: string;
    gender: number;
    avatar: string;
    remark: string;
  };
}

const props = defineProps<Props>();
const emit = defineEmits<{
  success: [];
}>();

const formRef = ref();
const loading = ref(false);
const avatarUrl = ref('');

const formData = ref({
  nickname: '',
  mobile: '',
  email: '',
  gender: AdminGender.UNKNOWN,
  avatar: '',
  remark: '',
});

// 性别选项
const genderOptions = [
  { label: '保密', value: AdminGender.UNKNOWN },
  { label: '男', value: AdminGender.MALE },
  { label: '女', value: AdminGender.FEMALE },
];

// 表单规则
const rules = {
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { max: 50, message: '昵称最多50个字符', trigger: 'blur' },
  ],
  mobile: [
    {
      pattern: /^1[3-9]\d{9}$/,
      message: '请输入正确的手机号',
      trigger: 'blur',
    },
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱', trigger: 'blur' },
    { max: 100, message: '邮箱最多100个字符', trigger: 'blur' },
  ],
  remark: [
    { max: 500, message: '备注最多500个字符', trigger: 'blur' },
  ],
};

// 监听用户信息变化
watch(
  () => props.userInfo,
  (newVal) => {
    if (newVal) {
      formData.value = { ...newVal };
      avatarUrl.value = newVal.avatar;
    }
  },
  { immediate: true, deep: true },
);

// 头像上传前验证
const beforeUpload = (file: File) => {
  const isImage = file.type.startsWith('image/');
  if (!isImage) {
    message.error('只能上传图片文件！');
    return false;
  }
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    message.error('图片大小不能超过 2MB！');
    return false;
  }
  return true;
};

// 头像上传变化
const handleAvatarChange = (info: UploadChangeParam) => {
  if (info.file.status === 'uploading') {
    loading.value = true;
    return;
  }
  if (info.file.status === 'done') {
    loading.value = false;
    const response = info.file.response;
    if (response && response.code === 0) {
      avatarUrl.value = response.data.avatar;
      formData.value.avatar = response.data.avatar;
      message.success('头像上传成功');
    } else {
      message.error('头像上传失败');
    }
  }
  if (info.file.status === 'error') {
    loading.value = false;
    message.error('头像上传失败');
  }
};

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value.validate();
    loading.value = true;

    await updateProfileApi(formData.value);

    message.success('更新成功');
    emit('success');
  } catch (error: any) {
    if (error.errorFields) {
      return;
    }
    message.error(error.message || '更新失败');
  } finally {
    loading.value = false;
  }
};

// 重置表单
const handleReset = () => {
  formData.value = { ...props.userInfo };
  avatarUrl.value = props.userInfo.avatar;
};
</script>

<template>
  <div class="max-w-2xl">
    <Form
      ref="formRef"
      :model="formData"
      :rules="rules"
      :label-col="{ span: 4 }"
      :wrapper-col="{ span: 18 }"
    >
      <!-- 头像上传 -->
      <FormItem label="头像">
        <div class="flex items-center gap-4">
          <Avatar
            :size="80"
            :src="avatarUrl"
            class="border-2 border-gray-200"
          >
            <template v-if="!avatarUrl" #icon>
              <i class="i-ant-design:user-outlined text-3xl" />
            </template>
          </Avatar>
          <Upload
            name="file"
            :show-upload-list="false"
            :before-upload="beforeUpload"
            :action="'/api/profile/upload-avatar'"
            @change="handleAvatarChange"
          >
            <Button :loading="loading">
              <template #icon>
                <i class="i-ant-design:upload-outlined" />
              </template>
              上传头像
            </Button>
            <div class="text-xs text-gray-500 mt-2">
              支持 jpg、png 格式，大小不超过 2MB
            </div>
          </Upload>
        </div>
      </FormItem>

      <!-- 用户名（只读） -->
      <FormItem label="用户名">
        <Input
          :value="props.userInfo.username"
          disabled
          placeholder="用户名不可修改"
        />
      </FormItem>

      <!-- 昵称 -->
      <FormItem label="昵称" name="nickname">
        <Input
          v-model:value="formData.nickname"
          placeholder="请输入昵称"
          allow-clear
        />
      </FormItem>

      <!-- 手机号 -->
      <FormItem label="手机号" name="mobile">
        <Input
          v-model:value="formData.mobile"
          placeholder="请输入手机号"
          allow-clear
        />
      </FormItem>

      <!-- 邮箱 -->
      <FormItem label="邮箱" name="email">
        <Input
          v-model:value="formData.email"
          placeholder="请输入邮箱"
          allow-clear
        />
      </FormItem>

      <!-- 性别 -->
      <FormItem label="性别" name="gender">
        <RadioGroup v-model:value="formData.gender" :options="genderOptions" />
      </FormItem>

      <!-- 个人简介 -->
      <FormItem label="个人简介" name="remark">
        <Textarea
          v-model:value="formData.remark"
          placeholder="请输入个人简介"
          :rows="4"
          :maxlength="500"
          show-count
          allow-clear
        />
      </FormItem>

      <!-- 操作按钮 -->
      <FormItem :wrapper-col="{ offset: 4, span: 18 }">
        <div class="flex gap-3">
          <Button
            type="primary"
            :loading="loading"
            @click="handleSubmit"
          >
            保存修改
          </Button>
          <Button @click="handleReset">
            重置
          </Button>
        </div>
      </FormItem>
    </Form>
  </div>
</template>
