<!-- src/views/system/admin/components/admin-form.vue -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  Modal,
  Form,
  FormItem,
  Input,
  InputNumber,
  Radio,
  RadioGroup,
  Select,
  Textarea,
  message,
} from 'ant-design-vue';
import {
  createAdminApi,
  updateAdminApi,
  type AdminInfo,
  AdminStatus,
  AdminGender,
} from '#/api';
import { getAllRolesApi, type RoleInfo } from '#/api';

interface Props {
  visible: boolean;
  mode: 'create' | 'edit';
  adminData: AdminInfo | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:visible': [value: boolean];
  success: [];
}>();

const formRef = ref();
const loading = ref(false);
const roleOptions = ref<Array<{ label: string; value: number }>>([]);

const formData = ref<AdminInfo>({
  username: '',
  nickname: '',
  password: '',
  mobile: '',
  email: '',
  gender: AdminGender.UNKNOWN,
  status: AdminStatus.ENABLED,
  sort: 0,
  remark: '',
  role_ids: [],
} as AdminInfo);

// 性别选项
const genderOptions = [
  { label: '未知', value: AdminGender.UNKNOWN },
  { label: '男', value: AdminGender.MALE },
  { label: '女', value: AdminGender.FEMALE },
];

// 状态选项
const statusOptions = [
  { label: '启用', value: AdminStatus.ENABLED },
  { label: '禁用', value: AdminStatus.DISABLED },
];

// 表单标题
const modalTitle = computed(() => {
  return props.mode === 'create' ? '新增用户' : '编辑用户';
});

// 表单规则
const rules = computed(() => ({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z0-9_]{4,20}$/,
      message: '用户名为5-20位字母、数字或下划线',
      trigger: 'blur',
    },
  ],
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  password:
    props.mode === 'create'
      ? [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码长度不能少于5位', trigger: 'blur' },
      ]
      : [{ min: 6, message: '密码长度不能少于5位', trigger: 'blur' }],
  mobile: [
    {
      pattern: /^1[3-9]\d{9}$/,
      message: '请输入正确的手机号',
      trigger: 'blur',
    },
  ],
  email: [{ type: 'email', message: '请输入正确的邮箱', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
}));

// 加载角色列表
const loadRoleList = async () => {
  try {
    const data = await getAllRolesApi();
    roleOptions.value = data.map((role: RoleInfo) => ({
      label: role.name,
      value: role.id!,
    }));
  } catch (error) {
    message.error('加载角色列表失败');
  }
};

// 监听弹窗显示
watch(
  () => props.visible,
  async (val) => {
    if (val) {
      await loadRoleList();
      if (props.adminData) {
        formData.value = {
          ...props.adminData,
          password: '', // 编辑时不显示密码
        };
      } else {
        formData.value = {
          username: '',
          nickname: '',
          password: '',
          mobile: '',
          email: '',
          gender: AdminGender.UNKNOWN,
          status: AdminStatus.ENABLED,
          sort: 0,
          remark: '',
          role_ids: [],
        } as AdminInfo;
      }
    }
  },
);

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value.validate();
    loading.value = true;

    const submitData = { ...formData.value };

    // 编辑模式下，如果密码为空则删除密码字段
    if (props.mode === 'edit' && !submitData.password) {
      delete submitData.password;
    }

    if (props.mode === 'create') {
      await createAdminApi(submitData);
      message.success('创建成功');
    } else {
      await updateAdminApi(formData.value.id!, submitData);
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

// 关闭弹窗
const handleClose = () => {
  formRef.value?.resetFields();
  emit('update:visible', false);
};
</script>

<template>
  <Modal
    :title="modalTitle"
    :open="visible"
    :confirm-loading="loading"
    :width="800"
    @cancel="handleClose"
    @ok="handleSubmit"
  >
    <Form
      ref="formRef"
      :model="formData"
      :rules="rules"
      :label-col="{ span: 5 }"
      :wrapper-col="{ span: 17 }"
      class="mt-4"
    >
      <FormItem label="用户名" name="username">
        <Input
          v-model:value="formData.username"
          placeholder="请输入用户名（5-20位字母、数字或下划线）"
          allow-clear
          :disabled="mode === 'edit'"
        />
      </FormItem>

      <FormItem label="昵称" name="nickname">
        <Input
          v-model:value="formData.nickname"
          placeholder="请输入昵称"
          allow-clear
        />
      </FormItem>

      <FormItem label="密码" name="password">
        <Input.Password
          v-model:value="formData.password"
          :placeholder="mode === 'create' ? '请输入密码（至少5位）' : '留空则不修改密码'"
          allow-clear
        />
      </FormItem>

      <FormItem label="手机号" name="mobile">
        <Input
          v-model:value="formData.mobile"
          placeholder="请输入手机号"
          allow-clear
        />
      </FormItem>

      <FormItem label="邮箱" name="email">
        <Input
          v-model:value="formData.email"
          placeholder="请输入邮箱"
          allow-clear
        />
      </FormItem>

      <FormItem label="性别" name="gender">
        <RadioGroup v-model:value="formData.gender" :options="genderOptions" />
      </FormItem>

      <FormItem label="角色" name="role_ids">
        <Select
          v-model:value="formData.role_ids"
          mode="multiple"
          placeholder="请选择角色"
          :options="roleOptions"
          allow-clear
        />
      </FormItem>

      <FormItem label="排序" name="sort">
        <InputNumber
          v-model:value="formData.sort"
          :min="0"
          placeholder="请输入排序"
          class="w-full"
        />
      </FormItem>

      <FormItem label="状态" name="status">
        <RadioGroup v-model:value="formData.status" :options="statusOptions" />
      </FormItem>

      <FormItem label="备注" name="remark">
        <Textarea
          v-model:value="formData.remark"
          placeholder="请输入备注"
          :rows="3"
          allow-clear
        />
      </FormItem>
    </Form>
  </Modal>
</template>
