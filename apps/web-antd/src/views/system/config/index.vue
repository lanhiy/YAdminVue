<script setup lang="ts">
import { ref, onMounted, h } from 'vue';
import { Icon } from '@iconify/vue';
import { Modal } from 'ant-design-vue';
import { Page } from '@vben/common-ui';
import { Button, Table, Switch, Input, Select, Space, Tabs, message } from 'ant-design-vue';
import {
  getConfigListApi,
  deleteConfigApi,
  changeConfigStatusApi,
  type SystemConfigItem,
} from '#/api';
import ConfigForm from './components/config-form.vue';
import ConfigBatchEdit from './components/config-batch-edit.vue';

// 数据
const loading = ref(false);
const configList = ref<SystemConfigItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const formModalVisible = ref(false);
const batchEditVisible = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const currentConfig = ref<SystemConfigItem | null>(null);
const activeTab = ref('all');

// 搜索条件
const searchForm = ref({
  config_key: '',
  config_type: undefined as string | undefined,
  status: undefined as number | undefined,
});

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

// 表格列配置
const columns = [
  {
    title: '配置键名',
    dataIndex: 'config_key',
    width: 200,
    ellipsis: true,
  },
  {
    title: '配置值',
    dataIndex: 'config_value',
    width: 250,
    ellipsis: true,
    customRender: ({ record }: { record: SystemConfigItem }) => {
      // 如果值太长,显示前50个字符
      const value = record.config_value || '';
      return value.length > 50 ? value.substring(0, 50) + '...' : value;
    },
  },
  {
    title: '配置类型',
    dataIndex: 'config_type',
    width: 120,
    customRender: ({ record }: { record: SystemConfigItem }) => {
      const type = configTypeOptions.find((t) => t.value === record.config_type);
      return type ? type.label : record.config_type;
    },
  },
  {
    title: '描述',
    dataIndex: 'description',
    width: 200,
    ellipsis: true,
  },
  {
    title: '排序',
    dataIndex: 'sort',
    width: 80,
  },
  {
    title: '状态',
    dataIndex: 'status',
    width: 100,
    customRender: ({ record }: { record: SystemConfigItem }) => {
      return h(Switch, {
        checked: record.status === 1,
        checkedChildren: '启用',
        unCheckedChildren: '禁用',
        onChange: (checked: boolean) => handleStatusChange(record, checked),
      });
    },
  },
  {
    title: '更新时间',
    dataIndex: 'updated_at',
    width: 180,
  },
  {
    title: '操作',
    key: 'action',
    width: 150,
    fixed: 'right',
    customRender: ({ record }: { record: SystemConfigItem }) => {
      return h('div', { class: 'flex items-center gap-2' }, [
        h(
          Button,
          {
            type: 'link',
            size: 'small',
            onClick: () => handleEdit(record),
          },
          {
            default: () => '编辑',
            icon: () => h(Icon, { icon: 'mdi:pencil', width: 16 }),
          },
        ),
        h(
          Button,
          {
            type: 'link',
            size: 'small',
            danger: true,
            onClick: () => handleDelete(record),
          },
          {
            default: () => '删除',
            icon: () => h(Icon, { icon: 'mdi:delete', width: 16 }),
          },
        ),
      ]);
    },
  },
];

// 加载配置列表
const loadConfigList = async () => {
  try {
    loading.value = true;
    const params = {
      page: page.value,
      page_size: pageSize.value,
      ...searchForm.value,
      // 如果选择了特定类型标签,则过滤
      ...(activeTab.value !== 'all' ? { config_type: activeTab.value } : {}),
    };
    const data = await getConfigListApi(params);
    configList.value = data.list;
    total.value = data.total;
  } catch (error) {
    message.error('加载配置列表失败');
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  page.value = 1;
  loadConfigList();
};

// 重置搜索
const handleReset = () => {
  searchForm.value = {
    config_key: '',
    config_type: undefined,
    status: undefined,
  };
  page.value = 1;
  loadConfigList();
};

// 新增配置
const handleAdd = () => {
  formMode.value = 'create';
  currentConfig.value = null;
  formModalVisible.value = true;
};

// 编辑配置
const handleEdit = (record: SystemConfigItem) => {
  formMode.value = 'edit';
  currentConfig.value = { ...record };
  formModalVisible.value = true;
};

// 删除配置
const handleDelete = (record: SystemConfigItem) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除配置「${record.config_key}」吗？`,
    okText: '确定',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        await deleteConfigApi(record.id!);
        message.success('删除成功');
        await loadConfigList();
      } catch (error: any) {
        message.error(error.message || '删除失败');
      }
    },
  });
};

// 修改状态
const handleStatusChange = async (record: SystemConfigItem, checked: boolean) => {
  try {
    const status = checked ? 1 : 0;
    await changeConfigStatusApi(record.id!, status);
    message.success('状态修改成功');
    record.status = status;
  } catch (error: any) {
    message.error(error.message || '状态修改失败');
  }
};

// 批量编辑
const handleBatchEdit = () => {
  batchEditVisible.value = true;
};

// 分页变化
const handlePageChange = (newPage: number, newPageSize: number) => {
  page.value = newPage;
  pageSize.value = newPageSize;
  loadConfigList();
};

// 表单提交成功
const handleFormSuccess = () => {
  formModalVisible.value = false;
  loadConfigList();
};

// 批量编辑成功
const handleBatchEditSuccess = () => {
  batchEditVisible.value = false;
  loadConfigList();
};

// 标签页切换
const handleTabChange = (key: string) => {
  activeTab.value = key;
  page.value = 1;
  loadConfigList();
};

onMounted(() => {
  loadConfigList();
});
</script>

<template>
  <Page
    auto-content-height
    description="系统配置管理，支持动态配置前端应用的各项参数"
    title="系统配置"
  >
    <template #extra>
      <Space>
        <Button @click="handleBatchEdit">
          <template #icon>
            <i class="i-ant-design:edit-outlined" />
          </template>
          批量编辑
        </Button>
        <Button type="primary" @click="handleAdd">
          <template #icon>
            <i class="i-ant-design:plus-outlined" />
          </template>
          新增配置
        </Button>
      </Space>
    </template>

    <!-- 搜索表单 -->
    <div class="mb-4 p-4 bg-white rounded">
      <Space :size="16" wrap>
        <Input
          v-model:value="searchForm.config_key"
          placeholder="配置键名"
          allow-clear
          style="width: 200px"
          @pressEnter="handleSearch"
        />
        <Select
          v-model:value="searchForm.config_type"
          placeholder="配置类型"
          :options="configTypeOptions"
          allow-clear
          style="width: 150px"
        />
        <Select
          v-model:value="searchForm.status"
          placeholder="状态"
          :options="statusOptions"
          allow-clear
          style="width: 120px"
        />
        <Button type="primary" @click="handleSearch">
          <template #icon>
            <i class="i-ant-design:search-outlined" />
          </template>
          搜索
        </Button>
        <Button @click="handleReset">
          <template #icon>
            <i class="i-ant-design:reload-outlined" />
          </template>
          重置
        </Button>
      </Space>
    </div>

    <!-- 配置分类标签 -->
    <div class="mb-4 bg-white rounded">
      <Tabs :active-key="activeTab" @change="handleTabChange">
        <Tabs.TabPane key="all" tab="全部配置" />
        <Tabs.TabPane key="app" tab="应用配置" />
        <Tabs.TabPane key="logo" tab="Logo配置" />
        <Tabs.TabPane key="theme" tab="主题配置" />
        <Tabs.TabPane key="copyright" tab="版权配置" />
        <Tabs.TabPane key="layout" tab="布局配置" />
        <Tabs.TabPane key="tabbar" tab="标签页配置" />
        <Tabs.TabPane key="sidebar" tab="侧边栏配置" />
        <Tabs.TabPane key="header" tab="头部配置" />
        <Tabs.TabPane key="breadcrumb" tab="面包屑配置" />
        <Tabs.TabPane key="footer" tab="页脚配置" />
      </Tabs>
    </div>

    <!-- 表格 -->
    <Table
      :columns="columns"
      :data-source="configList"
      :loading="loading"
      :pagination="{
        current: page,
        pageSize: pageSize,
        total: total,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total: number) => `共 ${total} 条`,
        onChange: handlePageChange,
      }"
      :scroll="{ x: 1400 }"
      bordered
      row-key="id"
      size="middle"
    />

    <!-- 配置表单弹窗 -->
    <ConfigForm
      v-model:visible="formModalVisible"
      :config-data="currentConfig"
      :mode="formMode"
      @success="handleFormSuccess"
    />

    <!-- 批量编辑弹窗 -->
    <ConfigBatchEdit
      v-model:visible="batchEditVisible"
      @success="handleBatchEditSuccess"
    />
  </Page>
</template>
