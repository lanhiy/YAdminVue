<script setup lang="ts">
import type { TableColumnsType } from 'ant-design-vue';

import { ref, onMounted, h } from 'vue';
import { Icon } from '@iconify/vue';
import { Modal } from 'ant-design-vue';
import { useAccess } from '@vben/access';
import { Page } from '@vben/common-ui';
import { Button, Table, Switch, Input, Select, Space, message } from 'ant-design-vue';
import {
  getRoleListApi,
  deleteRoleApi,
  changeRoleStatusApi,
  type RoleInfo,
  RoleStatus,
} from '#/api';
import RoleForm from './components/role-form.vue';

const { hasAccessByCodes } = useAccess();

// 数据
const loading = ref(false);
const roleList = ref<RoleInfo[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const formModalVisible = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const currentRole = ref<RoleInfo | null>(null);

// 搜索条件
const searchForm = ref({
  name: '',
  code: '',
  status: undefined as number | undefined,
});

// 状态选项 - 修复:移除"全部"选项,使用 allowClear 代替
const statusOptions = [
  { label: '启用', value: RoleStatus.ENABLED },
  { label: '禁用', value: RoleStatus.DISABLED },
];

// 表格列配置
const columns: TableColumnsType = [
  {
    title: '角色名称',
    dataIndex: 'name',
    width: 150,
  },
  {
    title: '角色编码',
    dataIndex: 'code',
    width: 150,
  },
  {
    title: '角色描述',
    dataIndex: 'description',
    width: 250,
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
    customRender: ({ record }: { record: RoleInfo }) => {
      return h(Switch, {
        checked: record.status === RoleStatus.ENABLED,
        checkedChildren: '启用',
        unCheckedChildren: '禁用',
        disabled: !hasAccessByCodes(['system:role:status']),
        onChange: (checked: unknown) =>
          handleStatusChange(record, checked === true),
      });
    },
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    width: 180,
  },
  {
    title: '操作',
    key: 'action',
    width: 150,
    fixed: 'right',
    customRender: ({ record }: { record: RoleInfo }) => {
      const actions = [];

      if (hasAccessByCodes(['system:role:edit'])) {
        actions.push(
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
        );
      }

      if (hasAccessByCodes(['system:role:delete'])) {
        actions.push(
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
        );
      }

      return actions.length > 0
        ? h('div', { class: 'flex items-center gap-2' }, actions)
        : h('span', { class: 'text-gray-400' }, '-');
    },
  },
];

// 加载角色列表
const loadRoleList = async () => {
  try {
    loading.value = true;
    const params = {
      page: page.value,
      page_size: pageSize.value,
      ...searchForm.value,
    };
    const data = await getRoleListApi(params);
    roleList.value = data.list;
    total.value = data.total;
  } catch (error) {
    message.error('加载角色列表失败');
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  page.value = 1;
  loadRoleList();
};

// 重置搜索
const handleReset = () => {
  searchForm.value = {
    name: '',
    code: '',
    status: undefined,
  };
  page.value = 1;
  loadRoleList();
};

// 新增角色
const handleAdd = () => {
  formMode.value = 'create';
  currentRole.value = null;
  formModalVisible.value = true;
};

// 编辑角色
const handleEdit = (record: RoleInfo) => {
  formMode.value = 'edit';
  currentRole.value = { ...record };
  formModalVisible.value = true;
};

// 删除角色
const handleDelete = (record: RoleInfo) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除角色「${record.name}」吗？`,
    okText: '确定',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        await deleteRoleApi(record.id!);
        message.success('删除成功');
        await loadRoleList();
      } catch (error: any) {
        message.error(error.message || '删除失败');
      }
    },
  });
};

// 修改状态
const handleStatusChange = async (record: RoleInfo, checked: boolean) => {
  try {
    const status = checked ? RoleStatus.ENABLED : RoleStatus.DISABLED;
    await changeRoleStatusApi(record.id!, status);
    message.success('状态修改成功');
    record.status = status;
  } catch (error: any) {
    message.error(error.message || '状态修改失败');
  }
};

// 分页变化
const handlePageChange = (newPage: number, newPageSize: number) => {
  page.value = newPage;
  pageSize.value = newPageSize;
  loadRoleList();
};

// 表单提交成功
const handleFormSuccess = () => {
  formModalVisible.value = false;
  loadRoleList();
};

onMounted(() => {
  loadRoleList();
});
</script>

<template>
  <Page
    auto-content-height
    description="系统角色管理，支持角色权限配置"
    title="角色管理"
  >
    <template #extra>
      <Button v-access:code="['system:role:add']" type="primary" @click="handleAdd">
        <template #icon>
          <i class="i-ant-design:plus-outlined" />
        </template>
        新增角色
      </Button>
    </template>

    <!-- 搜索表单 -->
    <div class="mb-4 p-4 bg-white rounded">
      <Space :size="16" wrap>
        <Input
          v-model:value="searchForm.name"
          placeholder="角色名称"
          allow-clear
          style="width: 200px"
          @pressEnter="handleSearch"
        />
        <Input
          v-model:value="searchForm.code"
          placeholder="角色编码"
          allow-clear
          style="width: 200px"
          @pressEnter="handleSearch"
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

    <!-- 表格 -->
    <Table
      :columns="columns"
      :data-source="roleList"
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
      :scroll="{ x: 1200 }"
      bordered
      row-key="id"
      size="middle"
    />

    <!-- 角色表单弹窗 -->
    <RoleForm
      v-model:visible="formModalVisible"
      :role-data="currentRole"
      :mode="formMode"
      @success="handleFormSuccess"
    />
  </Page>
</template>
