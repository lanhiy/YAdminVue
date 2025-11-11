<script setup lang="ts">
import { ref, onMounted, h } from 'vue';
import { Icon } from '@iconify/vue';
import { Modal, Tag } from 'ant-design-vue';
import { Page } from '@vben/common-ui';
import { Button, Table, Switch, Input, Select, Space, message } from 'ant-design-vue';
import {
  getAdminListApi,
  deleteAdminApi,
  changeAdminStatusApi,
  type AdminInfo,
  AdminStatus,
  AdminGender,
} from '#/api';
import AdminForm from './components/admin-form.vue';

// 数据
const loading = ref(false);
const adminList = ref<AdminInfo[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const formModalVisible = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const currentAdmin = ref<AdminInfo | null>(null);

// 搜索条件
const searchForm = ref({
  username: '',
  nickname: '',
  mobile: '',
  status: undefined as number | undefined,
  gender: undefined as number | undefined,
});

// 状态选项 - 修复:移除"全部"选项,使用 allowClear 代替
const statusOptions = [
  { label: '启用', value: AdminStatus.ENABLED },
  { label: '禁用', value: AdminStatus.DISABLED },
];

// 性别选项 - 修复:移除"全部"选项,使用 allowClear 代替
const genderOptions = [
  { label: '未知', value: AdminGender.UNKNOWN },
  { label: '男', value: AdminGender.MALE },
  { label: '女', value: AdminGender.FEMALE },
];

// 性别标签映射
const genderMap = {
  [AdminGender.UNKNOWN]: { text: '未知', color: 'default' },
  [AdminGender.MALE]: { text: '男', color: 'blue' },
  [AdminGender.FEMALE]: { text: '女', color: 'pink' },
};

// 表格列配置
const columns = [
  {
    title: '用户名',
    dataIndex: 'username',
    width: 120,
  },
  {
    title: '昵称',
    dataIndex: 'nickname',
    width: 120,
  },
  {
    title: '手机号',
    dataIndex: 'mobile',
    width: 130,
  },
  {
    title: '邮箱',
    dataIndex: 'email',
    width: 180,
    ellipsis: true,
  },
  {
    title: '性别',
    dataIndex: 'gender',
    width: 80,
    customRender: ({ record }: { record: AdminInfo }) => {
      const gender = genderMap[record.gender || AdminGender.UNKNOWN];
      return h(Tag, { color: gender.color }, () => gender.text);
    },
  },
  {
    title: '角色',
    dataIndex: 'roles',
    width: 200,
    ellipsis: true,
    customRender: ({ record }: { record: AdminInfo }) => {
      if (!record.roles || record.roles.length === 0) {
        return '-';
      }
      return h(
        'div',
        { class: 'flex gap-1 flex-wrap' },
        record.roles.map((role) =>
          h(Tag, { color: 'blue', key: role.id }, () => role.name),
        ),
      );
    },
  },
  {
    title: '状态',
    dataIndex: 'status',
    width: 100,
    customRender: ({ record }: { record: AdminInfo }) => {
      return h(Switch, {
        checked: record.status === AdminStatus.ENABLED,
        checkedChildren: '启用',
        unCheckedChildren: '禁用',
        onChange: (checked: boolean) => handleStatusChange(record, checked),
      });
    },
  },
  {
    title: '最后登录时间',
    dataIndex: 'last_login_at',
    width: 180,
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
    customRender: ({ record }: { record: AdminInfo }) => {
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

// 加载用户列表
const loadAdminList = async () => {
  try {
    loading.value = true;
    const params = {
      page: page.value,
      page_size: pageSize.value,
      ...searchForm.value,
    };
    const data = await getAdminListApi(params);
    adminList.value = data.list;
    total.value = data.total;
  } catch (error) {
    message.error('加载用户列表失败');
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  page.value = 1;
  loadAdminList();
};

// 重置搜索
const handleReset = () => {
  searchForm.value = {
    username: '',
    nickname: '',
    mobile: '',
    status: undefined,
    gender: undefined,
  };
  page.value = 1;
  loadAdminList();
};

// 新增用户
const handleAdd = () => {
  formMode.value = 'create';
  currentAdmin.value = null;
  formModalVisible.value = true;
};

// 编辑用户
const handleEdit = (record: AdminInfo) => {
  formMode.value = 'edit';
  currentAdmin.value = { ...record };
  formModalVisible.value = true;
};

// 删除用户
const handleDelete = (record: AdminInfo) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除用户「${record.username}」吗？`,
    okText: '确定',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        await deleteAdminApi(record.id!);
        message.success('删除成功');
        await loadAdminList();
      } catch (error: any) {
        message.error(error.message || '删除失败');
      }
    },
  });
};

// 修改状态
const handleStatusChange = async (record: AdminInfo, checked: boolean) => {
  try {
    const status = checked ? AdminStatus.ENABLED : AdminStatus.DISABLED;
    await changeAdminStatusApi(record.id!, status);
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
  loadAdminList();
};

// 表单提交成功
const handleFormSuccess = () => {
  formModalVisible.value = false;
  loadAdminList();
};

onMounted(() => {
  loadAdminList();
});
</script>

<template>
  <Page
    auto-content-height
    description="系统用户管理，支持用户角色分配"
    title="用户管理"
  >
    <template #extra>
      <Button type="primary" @click="handleAdd">
        <template #icon>
          <i class="i-ant-design:plus-outlined" />
        </template>
        新增用户
      </Button>
    </template>

    <!-- 搜索表单 -->
    <div class="mb-4 p-4 bg-white rounded">
      <Space :size="16" wrap>
        <Input
          v-model:value="searchForm.username"
          placeholder="用户名"
          allow-clear
          style="width: 150px"
          @pressEnter="handleSearch"
        />
        <Input
          v-model:value="searchForm.nickname"
          placeholder="昵称"
          allow-clear
          style="width: 150px"
          @pressEnter="handleSearch"
        />
        <Input
          v-model:value="searchForm.mobile"
          placeholder="手机号"
          allow-clear
          style="width: 150px"
          @pressEnter="handleSearch"
        />
        <Select
          v-model:value="searchForm.gender"
          placeholder="性别"
          :options="genderOptions"
          allow-clear
          style="width: 100px"
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
      :data-source="adminList"
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
      :scroll="{ x: 1500 }"
      bordered
      row-key="id"
      size="middle"
    />

    <!-- 用户表单弹窗 -->
    <AdminForm
      v-model:visible="formModalVisible"
      :admin-data="currentAdmin"
      :mode="formMode"
      @success="handleFormSuccess"
    />
  </Page>
</template>
