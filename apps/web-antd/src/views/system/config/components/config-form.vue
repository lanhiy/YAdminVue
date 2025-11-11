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
  createConfigApi,
  updateConfigApi,
  type SystemConfigItem,
} from '#/api';

interface Props {
  visible: boolean;
  mode: 'create' | 'edit';
  configData: SystemConfigItem | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:visible': [value: boolean];
  success: [];
}>();

const formRef = ref();
const loading = ref(false);

const formData = ref<SystemConfigItem>({
  config_key: '',
  config_value: '',
  config_type: '',
  description: '',
  sort: 0,
  status: 1,
} as SystemConfigItem);

// 配置类型选项
const configTypeOptions = [
  { label: '应用配置', value: 'app' },
  { label: 'Logo配置', value: 'logo' },
  { label: '主题配置', value: 'theme' },
  { label: '版权配置', value: 'copyright' },
  { label: '布局配置', value: 'layout' },
  { label: '标签页配置', value: 'tabbar' },
  { label: '侧边栏配置', value: 'sidebar' },
  { label: '头部配置', value: 'header' },
  { label: '面包屑配置', value: 'breadcrumb' },
  { label: '页脚配置', value: 'footer' },
];

// 状态选项
const statusOptions = [
  { label: '启用', value: 1 },
  { label: '禁用', value: 0 },
];

// 表单标题
const modalTitle = computed(() => {
  return props.mode === 'create' ? '新增配置' : '编辑配置';
});

// 表单规则
const rules = {
  config_key: [
    { required: true, message: '请输入配置键名', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/,
      message: '键名必须以字母开头,只能包含字母、数字和下划线',
      trigger: 'blur',
    },
  ],
  config_value: [{ required: true, message: '请输入配置值', trigger: 'blur' }],
  config_type: [{ required: true, message: '请选择配置类型', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
};

// 监听弹窗显示
watch(
  () => props.visible,
  (val) => {
    if (val) {
      if (props.configData) {
        formData.value = { ...props.configData };
      } else {
        formData.value = {
          config_key: '',
          config_value: '',
          config_type: '',
          description: '',
          sort: 0,
          status: 1,
        } as SystemConfigItem;
      }
    }
  },
);

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value.validate();
    loading.value = true;

    if (props.mode === 'create') {
      await createConfigApi(formData.value);
      message.success('创建成功');
    } else {
      await updateConfigApi(formData.value.id!, formData.value);
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
    :width="700"
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
      <FormItem label="配置键名" name="config_key">
        <Input
          v-model:value="formData.config_key"
          placeholder="例如: app_name, theme_color_primary"
          allow-clear
          :disabled="mode === 'edit'"
        />
        <div class="text-xs text-gray-400 mt-1">
          键名格式: 字母开头,可包含字母、数字和下划线
        </div>
      </FormItem>

      <FormItem label="配置类型" name="config_type">
        <Select
          v-model:value="formData.config_type"
          placeholder="请选择配置类型"
          :options="configTypeOptions"
          allow-clear
        />
      </FormItem>

      <FormItem label="配置值" name="config_value">
        <Textarea
          v-model:value="formData.config_value"
          placeholder="请输入配置值（支持 JSON 格式）"
          :rows="4"
          allow-clear
        />
        <div class="text-xs text-gray-400 mt-1">
          提示: 可以输入普通文本或 JSON 格式的值
        </div>
      </FormItem>

      <FormItem label="配置描述" name="description">
        <Textarea
          v-model:value="formData.description"
          placeholder="请输入配置描述"
          :rows="3"
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
    </Form>
  </Modal>
</template>
