<!-- src/views/system/menu/index.vue -->
<script setup lang="ts">
import { ref, onMounted, h } from 'vue';
import { Modal } from 'ant-design-vue';
import { Page } from '@vben/common-ui';
import { Button, Table, Switch,message } from 'ant-design-vue';
import {
  getMenuListApi,
  deleteMenuApi,
  changeMenuStatusApi,
  type MenuInfo,
  MenuType,
  MenuStatus,
} from '#/api';
import MenuForm from './components/menu-form.vue';

// 数据
const loading = ref(false);
const menuList = ref<MenuInfo[]>([]);
const formModalVisible = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const currentMenu = ref<MenuInfo | null>(null);

// 表格列配置
const columns = [
  {
    title: '菜单名称',
    dataIndex: 'title',
    width: 200,
  },
  {
    title: '图标',
    dataIndex: 'icon',
    width: 80,
    customRender: ({ record }: { record: MenuInfo }) => {
      return record.icon
        ? h('i', { class: record.icon, style: { fontSize: '18px' } })
        : '-';
    },
  },
  {
    title: '路由名称',
    dataIndex: 'name',
    width: 150,
  },
  {
    title: '路由路径',
    dataIndex: 'path',
    width: 200,
  },
  {
    title: '组件路径',
    dataIndex: 'component',
    width: 200,
  },
  {
    title: '类型',
    dataIndex: 'type',
    width: 80,
    customRender: ({ record }: { record: MenuInfo }) => {
      const typeMap = {
        [MenuType.CATALOG]: { text: '目录', color: '#1890ff' },
        [MenuType.MENU]: { text: '菜单', color: '#52c41a' },
        [MenuType.BUTTON]: { text: '按钮', color: '#faad14' },
      };
      const type = typeMap[record.type];
      return h(
        'span',
        { style: { color: type.color, fontWeight: 500 } },
        type.text,
      );
    },
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
    customRender: ({ record }: { record: MenuInfo }) => {
      return h(Switch, {
        checked: record.status === MenuStatus.ENABLED,
        checkedChildren: '启用',
        unCheckedChildren: '禁用',
        onChange: (checked: boolean) => handleStatusChange(record, checked),
      });
    },
  },
  {
    title: '操作',
    key: 'action',
    width: 200,
    fixed: 'right',
    customRender: ({ record }: { record: MenuInfo }) => {
      return h('div', { class: 'flex gap-2' }, [
        h(
          'a',
          {
            onClick: () => handleEdit(record),
          },
          '编辑',
        ),
        h(
          'a',
          {
            onClick: () => handleAdd(record.id!),
            style: { color: '#52c41a' },
          },
          '添加子菜单',
        ),
        h(
          'a',
          {
            onClick: () => handleDelete(record),
            style: { color: '#ff4d4f' },
          },
          '删除',
        ),
      ]);
    },
  },
];

// 加载菜单列表
const loadMenuList = async () => {
  try {
    loading.value = true;
    const data = await getMenuListApi();
    menuList.value = data;
  } catch (error) {
    message.error('加载菜单列表失败');
  } finally {
    loading.value = false;
  }
};

// 新增菜单
const handleAdd = (parentId?: number) => {
  formMode.value = 'create';
  currentMenu.value = {
    parent_id: parentId || 0,
    name: '',
    path: '',
    type: MenuType.MENU,
    title: '',
    status: MenuStatus.ENABLED,
    sort: 0,
  } as MenuInfo;
  formModalVisible.value = true;
};

// 编辑菜单
const handleEdit = (record: MenuInfo) => {
  formMode.value = 'edit';
  currentMenu.value = { ...record };
  formModalVisible.value = true;
};

// 删除菜单
const handleDelete = (record: MenuInfo) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除菜单「${record.title}」吗?`,
    okText: '确定',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        await deleteMenuApi(record.id!);
        message.success('删除成功');
        await loadMenuList();
      } catch (error: any) {
        message.error(error.message || '删除失败');
      }
    },
  });
};

// 修改状态
const handleStatusChange = async (record: MenuInfo, checked: boolean) => {
  try {
    const status = checked ? MenuStatus.ENABLED : MenuStatus.DISABLED;
    await changeMenuStatusApi(record.id!, status);
    message.success('状态修改成功');
    record.status = status;
  } catch (error: any) {
    message.error(error.message || '状态修改失败');
  }
};

// 表单提交成功
const handleFormSuccess = () => {
  formModalVisible.value = false;
  loadMenuList();
};

onMounted(() => {
  loadMenuList();
});
</script>

<template>
  <Page
    auto-content-height
    description="系统菜单管理，支持树形结构的菜单配置"
    title="菜单管理"
  >
    <template #extra>
      <Button type="primary" @click="handleAdd()">
        <template #icon>
          <i class="i-ant-design:plus-outlined" />
        </template>
        新增菜单
      </Button>
    </template>

    <Table
      :columns="columns"
      :data-source="menuList"
      :loading="loading"
      :pagination="false"
      :scroll="{ x: 1200 }"
      bordered
      row-key="id"
      size="middle"
      :default-expand-all-rows="true"
    />

    <!-- 菜单表单弹窗 -->
    <MenuForm
      v-model:visible="formModalVisible"
      :menu-data="currentMenu"
      :menu-list="menuList"
      :mode="formMode"
      @success="handleFormSuccess"
    />
  </Page>
</template>
