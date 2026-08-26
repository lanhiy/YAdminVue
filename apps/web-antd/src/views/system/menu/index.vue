<!-- src/views/system/menu/index.vue -->
<script setup lang="ts">
import type { TableColumnsType } from 'ant-design-vue';

import type { MenuInfo } from '#/api';

import { h, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { Page } from '@vben/common-ui';

import { Icon } from '@iconify/vue';
import { Button, message, Modal, Switch, Table } from 'ant-design-vue';

import {
  changeMenuStatusApi,
  deleteMenuApi,
  getMenuListApi,
  MenuStatus,
  MenuType,
} from '#/api';
import { refreshAccess } from '#/utils/refresh-access';

import MenuForm from './components/menu-form.vue';

const { hasAccessByCodes } = useAccess();

// 数据
const router = useRouter();
const loading = ref(false);
const menuList = ref<MenuInfo[]>([]);
const formModalVisible = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const currentMenu = ref<MenuInfo | null>(null);

// 表格列配置
const columns: TableColumnsType = [
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
      if (!record.icon) return null;
      return h(Icon, {
        icon: record.icon, // 直接使用 f7:command
        width: 20,
        height: 20,
      });
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
        [MenuType.BUTTON]: { text: '按钮', color: '#fa8c16' },
      };
      const type = typeMap[record.type];
      return h(
        'span',
        { style: { color: type?.color, fontWeight: 500 } },
        type?.text ?? '未知',
      );
    },
  },
  {
    title: '权限码',
    dataIndex: 'authority',
    width: 200,
    customRender: ({ record }: { record: MenuInfo }) => {
      const authorities = record.authority ?? [];
      return authorities.length > 0
        ? h('span', { class: 'text-xs text-gray-500' }, authorities.join(', '))
        : h('span', { class: 'text-gray-400' }, record.type === MenuType.CATALOG ? '由子节点授权' : '登录可见');
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
        disabled: !hasAccessByCodes(['system:menu:status']),
        onChange: (checked: unknown) =>
          handleStatusChange(record, checked === true),
      });
    },
  },
  {
    title: '操作',
    key: 'action',
    width: 200,
    fixed: 'right',
    customRender: ({ record }: { record: MenuInfo }) => {
      const actions = [];

      if (hasAccessByCodes(['system:menu:edit'])) {
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

      if (hasAccessByCodes(['system:menu:add'])) {
        actions.push(
          h(
            Button,
            {
              type: 'link',
              size: 'small',
              style: { color: '#52c41a' },
              onClick: () => handleAdd(record.id!),
            },
            {
              default: () => '添加',
              icon: () => h(Icon, { icon: 'mdi:plus', width: 16 }),
            },
          ),
        );
      }

      if (hasAccessByCodes(['system:menu:delete'])) {
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
        ? h('div', { class: 'flex items-center gap-3' }, actions)
        : h('span', { class: 'text-gray-400' }, '-');
    },
  },
];

// 加载菜单列表
const loadMenuList = async () => {
  try {
    loading.value = true;
    const data = await getMenuListApi();
    menuList.value = data;
  } catch {
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
        await refreshAccess(router);
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
    await refreshAccess(router);
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
      <Button v-access:code="['system:menu:add']" type="primary" @click="handleAdd()">
        <template #icon>
          <i class="i-ant-design:plus-outlined"></i>
        </template>
        新增菜单
      </Button>
    </template>

    <Table
      :columns="columns"
      :data-source="menuList"
      :loading="loading"
      :pagination="false"
      :scroll="{ x: 1400 }"
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
