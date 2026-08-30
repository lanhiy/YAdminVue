<script setup lang="ts">
import type { FormProps } from 'ant-design-vue';
import type { Key } from 'ant-design-vue/es/_util/type';

import type { MenuInfo, RoleInfo } from '#/api';

import { computed, ref, watch } from 'vue';

import {
  Col,
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  Modal,
  RadioGroup,
  Row,
  Spin,
  Tag,
  Textarea,
  Tree,
} from 'ant-design-vue';

import {
  createRoleApi,
  getMenuListApi,
  RoleStatus,
  updateRoleApi,
} from '#/api';

interface Props {
  visible: boolean;
  mode: 'create' | 'edit';
  roleData: null | RoleInfo;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  success: [];
  'update:visible': [value: boolean];
}>();

const formRef = ref();
const loading = ref(false);
const treeLoading = ref(false);
const menuTree = ref<MenuInfo[]>([]);
const checkedKeys = ref<Key[]>([]);

const createDefaultForm = (): RoleInfo => ({
  name: '',
  code: '',
  description: '',
  sort: 0,
  status: RoleStatus.ENABLED,
  menu_ids: [],
});

const formData = ref<RoleInfo>(createDefaultForm());
const statusOptions = [
  { label: '启用', value: RoleStatus.ENABLED },
  { label: '禁用', value: RoleStatus.DISABLED },
];
const modalTitle = computed(() =>
  props.mode === 'create' ? '新增角色' : '编辑角色',
);
const isSuperRole = computed(
  () => props.roleData?.id === 1 || props.roleData?.is_super === 1,
);

const toTreeData = (menus: MenuInfo[]): any[] =>
  menus.map((menu) => ({
    key: menu.id,
    title: menu.title,
    menuType: menu.type,
    authority: menu.authority ?? [],
    children: toTreeData(menu.children ?? []),
  }));

const treeData = computed(() => toTreeData(menuTree.value));
const allNodeCount = computed(() => {
  const count = (nodes: MenuInfo[]): number =>
    nodes.reduce((total, node) => total + 1 + count(node.children ?? []), 0);
  return count(menuTree.value);
});
const selectedCount = computed(
  () => checkedKeys.value.filter((key) => Number(key) > 0).length,
);

const rules: FormProps['rules'] = {
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  code: [
    { required: true, message: '请输入角色编码', trigger: 'blur' },
    {
      pattern: /^[A-Za-z0-9_]+$/,
      message: '角色编码只能包含字母、数字和下划线',
      trigger: 'blur',
    },
  ],
};

const loadMenuTree = async () => {
  treeLoading.value = true;
  try {
    menuTree.value = await getMenuListApi();
  } catch {
    message.error('加载菜单权限树失败');
  } finally {
    treeLoading.value = false;
  }
};

watch(
  () => props.visible,
  async (visible) => {
    if (!visible) return;
    await loadMenuTree();
    formData.value = props.roleData
      ? { ...props.roleData }
      : createDefaultForm();
    checkedKeys.value = [...(props.roleData?.menu_ids ?? [])];
  },
);

const handleCheck = (checked: Key[] | { checked: Key[] }) => {
  checkedKeys.value = Array.isArray(checked) ? checked : checked.checked;
};

const handleCheckAll = () => {
  const collect = (nodes: MenuInfo[]): number[] =>
    nodes.flatMap((node) => [node.id!, ...collect(node.children ?? [])]);
  checkedKeys.value = collect(menuTree.value);
};

const handleCheckNone = () => {
  checkedKeys.value = [];
};

const handleSubmit = async () => {
  try {
    await formRef.value.validate();
    loading.value = true;
    // 半选父节点只用于界面展示，不写入权限关系，避免下次回显被 Tree 展开为全选。
    const selected = checkedKeys.value.map(Number).filter((id) => id > 0);
    const submitData: RoleInfo = {
      ...formData.value,
      menu_ids: [...new Set(selected)],
    };

    if (props.mode === 'create') {
      await createRoleApi(submitData);
    } else {
      await updateRoleApi(formData.value.id!, submitData);
    }
    message.success(props.mode === 'create' ? '创建成功' : '更新成功');
    emit('success');
    handleClose();
  } catch (error: any) {
    if (!error?.errorFields) message.error(error?.message || '操作失败');
  } finally {
    loading.value = false;
  }
};

const handleClose = () => {
  formRef.value?.resetFields();
  checkedKeys.value = [];
  emit('update:visible', false);
};
</script>

<template>
  <Modal
    :confirm-loading="loading"
    :open="visible"
    :title="modalTitle"
    :width="900"
    @cancel="handleClose"
    @ok="handleSubmit"
  >
    <Form
      ref="formRef"
      :label-col="{ span: 6 }"
      :model="formData"
      :rules="rules"
      :wrapper-col="{ span: 18 }"
    >
      <Row :gutter="24">
        <Col :span="12">
          <FormItem label="角色名称" name="name">
            <Input
              v-model:value="formData.name"
              allow-clear
              placeholder="请输入角色名称"
            />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem label="角色编码" name="code">
            <Input
              v-model:value="formData.code"
              allow-clear
              :disabled="mode === 'edit'"
              placeholder="请输入角色编码"
            />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem label="排序" name="sort">
            <InputNumber
              v-model:value="formData.sort"
              class="w-full"
              :min="0"
            />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem label="状态" name="status">
            <RadioGroup
              v-model:value="formData.status"
              :options="statusOptions"
            />
          </FormItem>
        </Col>
        <Col :span="24">
          <FormItem
            label="角色描述"
            name="description"
            :label-col="{ span: 3 }"
            :wrapper-col="{ span: 21 }"
          >
            <Textarea
              v-model:value="formData.description"
              allow-clear
              :rows="2"
              placeholder="请输入角色描述"
            />
          </FormItem>
        </Col>
        <Col :span="24">
          <FormItem
            label="授权节点"
            name="menu_ids"
            :label-col="{ span: 3 }"
            :wrapper-col="{ span: 21 }"
          >
            <template v-if="isSuperRole">
              <Tag color="blue">超级管理员角色自动拥有全部菜单和按钮权限</Tag>
            </template>
            <template v-else>
              <div class="mb-2 flex items-center gap-3 text-sm">
                <span class="text-gray-500"
                  >已选 {{ selectedCount }} / {{ allNodeCount }}</span
                >
                <a @click="handleCheckAll">全选</a>
                <a @click="handleCheckNone">清空</a>
              </div>
              <Spin :spinning="treeLoading">
                <div
                  class="max-h-96 overflow-auto rounded border border-gray-200 p-3"
                >
                  <Tree
                    checkable
                    :checked-keys="checkedKeys"
                    :default-expand-all="true"
                    :tree-data="treeData"
                    @check="handleCheck"
                  >
                    <template #title="node">
                      <span class="inline-flex items-center gap-2">
                        <span>{{ node.title }}</span>
                        <Tag v-if="node.menuType === 3" color="orange"
                          >按钮</Tag
                        >
                        <span
                          v-if="node.authority?.length"
                          class="text-xs text-gray-400"
                        >
                          {{ node.authority.join(', ') }}
                        </span>
                      </span>
                    </template>
                  </Tree>
                </div>
              </Spin>
            </template>
          </FormItem>
        </Col>
      </Row>
    </Form>
  </Modal>
</template>
