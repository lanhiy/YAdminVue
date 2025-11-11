<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  Modal,
  Form,
  FormItem,
  Input,
  InputNumber,
  Switch,
  Divider,
  message,
  Spin,
} from 'ant-design-vue';
import {
  getConfigByTypeApi,
  batchUpdateConfigApi,
  type SystemConfigItem,
} from '#/api';

interface Props {
  visible: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:visible': [value: boolean];
  success: [];
}>();

const loading = ref(false);
const submitLoading = ref(false);

// 配置分组数据
const configGroups = ref<Record<string, SystemConfigItem[]>>({
  app: [],
  logo: [],
  theme: [],
  copyright: [],
  layout: [],
  tabbar: [],
  sidebar: [],
  header: [],
  breadcrumb: [],
  footer: [],
});

// 配置分组标题
const groupTitles: Record<string, string> = {
  app: '应用配置',
  logo: 'Logo配置',
  theme: '主题配置',
  copyright: '版权配置',
  layout: '布局配置',
  tabbar: '标签页配置',
  sidebar: '侧边栏配置',
  header: '头部配置',
  breadcrumb: '面包屑配置',
  footer: '页脚配置',
};

// 加载所有配置
const loadAllConfigs = async () => {
  loading.value = true;
  try {
    const types = Object.keys(configGroups.value);
    const promises = types.map((type) => getConfigByTypeApi(type));
    const results = await Promise.all(promises);

    types.forEach((type, index) => {
      configGroups.value[type] = results[index] || [];
    });
  } catch (error) {
    message.error('加载配置失败');
  } finally {
    loading.value = false;
  }
};

// 判断配置值类型
const getValueType = (value: string): 'boolean' | 'number' | 'string' => {
  if (value === 'true' || value === 'false') return 'boolean';
  if (!isNaN(Number(value))) return 'number';
  return 'string';
};

// 转换布尔值显示
const getBooleanValue = (value: string): boolean => {
  return value === 'true' || value === '1';
};

// 提交表单
const handleSubmit = async () => {
  try {
    submitLoading.value = true;

    // 收集所有配置项
    const configs: Record<string, any> = {};
    Object.values(configGroups.value).forEach((items) => {
      items.forEach((item) => {
        configs[item.config_key] = item.config_value;
      });
    });

    await batchUpdateConfigApi(configs);
    message.success('批量更新成功');
    emit('success');
    handleClose();
  } catch (error: any) {
    message.error(error.message || '批量更新失败');
  } finally {
    submitLoading.value = false;
  }
};

// 关闭弹窗
const handleClose = () => {
  emit('update:visible', false);
};

// 监听弹窗显示
onMounted(() => {
  if (props.visible) {
    loadAllConfigs();
  }
});
</script>

<template>
  <Modal
    title="批量编辑配置"
    :open="visible"
    :confirm-loading="submitLoading"
    :width="900"
    :body-style="{ maxHeight: '70vh', overflowY: 'auto' }"
    @cancel="handleClose"
    @ok="handleSubmit"
  >
    <Spin :spinning="loading">
      <div class="py-4">
        <template v-for="(items, type) in configGroups" :key="type">
          <div v-if="items.length > 0" class="mb-6">
            <Divider orientation="left">
              <span class="text-base font-semibold">{{ groupTitles[type] }}</span>
            </Divider>

            <Form :label-col="{ span: 8 }" :wrapper-col="{ span: 14 }">
              <FormItem
                v-for="item in items"
                :key="item.id"
                :label="item.description || item.config_key"
              >
                <!-- 布尔值 -->
                <Switch
                  v-if="getValueType(item.config_value) === 'boolean'"
                  v-model:checked="item.config_value"
                  :checked-value="'true'"
                  :un-checked-value="'false'"
                  checked-children="是"
                  un-checked-children="否"
                />

                <!-- 数字 -->
                <InputNumber
                  v-else-if="getValueType(item.config_value) === 'number'"
                  v-model:value="item.config_value"
                  :min="0"
                  class="w-full"
                />

                <!-- 字符串 -->
                <Input
                  v-else
                  v-model:value="item.config_value"
                  allow-clear
                  :placeholder="`请输入${item.description || item.config_key}`"
                />

                <div class="text-xs text-gray-400 mt-1">
                  键名: {{ item.config_key }}
                </div>
              </FormItem>
            </Form>
          </div>
        </template>

        <div v-if="Object.values(configGroups).every((items) => items.length === 0)" class="text-center text-gray-400 py-8">
          暂无配置数据
        </div>
      </div>
    </Spin>
  </Modal>
</template>
