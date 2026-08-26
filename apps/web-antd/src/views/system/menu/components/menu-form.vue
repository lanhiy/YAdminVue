<script setup lang="ts">
import type { FormProps } from 'ant-design-vue';

import type { MenuInfo } from '#/api';

import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import {
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  Modal,
  RadioGroup,
  Select,
  Switch,
  Textarea,
  TreeSelect,
} from 'ant-design-vue';

import { createMenuApi, MenuStatus, MenuType, updateMenuApi } from '#/api';
import { refreshAccess } from '#/utils/refresh-access';

interface Props {
  visible: boolean;
  mode: 'create' | 'edit';
  menuData: MenuInfo | null;
  menuList: MenuInfo[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  success: [];
  'update:visible': [value: boolean];
}>();

const router = useRouter();
const formRef = ref();
const loading = ref(false);
const formData = ref<MenuInfo>({
  parent_id: 0,
  name: '',
  path: '',
  type: MenuType.MENU,
  title: '',
  authority: [],
  status: MenuStatus.ENABLED,
  sort: 0,
} as MenuInfo);

const menuTypeOptions = [
  { label: '目录', value: MenuType.CATALOG },
  { label: '菜单', value: MenuType.MENU },
  { label: '按钮', value: MenuType.BUTTON },
];
const statusOptions = [
  { label: '启用', value: MenuStatus.ENABLED },
  { label: '禁用', value: MenuStatus.DISABLED },
];
const modalTitle = computed(() => (props.mode === 'create' ? '新增节点' : '编辑节点'));
const isButton = computed(() => formData.value.type === MenuType.BUTTON);

const buildMenuTree = (menus: MenuInfo[]): any[] =>
  menus
    .filter((menu) => menu.type !== MenuType.BUTTON && menu.id !== formData.value.id)
    .map((menu) => ({
      label: menu.title,
      value: menu.id,
      children: menu.children?.length ? buildMenuTree(menu.children) : undefined,
    }));
const parentMenuOptions = computed(() => [{ label: '根菜单', value: 0 }, ...buildMenuTree(props.menuList)]);

const rules = computed<FormProps['rules']>(() => ({
  name: [{ required: true, message: '请输入节点名称', trigger: 'blur' }],
  title: [{ required: true, message: '请输入节点标题', trigger: 'blur' }],
  type: [{ required: true, message: '请选择节点类型', trigger: 'change' }],
  path: isButton.value ? [] : [{ required: true, message: '请输入路由路径', trigger: 'blur' }],
  component: isButton.value || formData.value.type === MenuType.CATALOG
    ? []
    : [{ required: true, message: '请输入组件路径', trigger: 'blur' }],
  authority: isButton.value
    ? [{ required: true, type: 'array', min: 1, message: '请输入至少一个权限码', trigger: 'change' }]
    : [],
}));

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return;
    formData.value = props.menuData
      ? { ...props.menuData, authority: [...(props.menuData.authority ?? [])] }
      : {
          parent_id: 0,
          name: '',
          path: '',
          type: MenuType.MENU,
          title: '',
          authority: [],
          status: MenuStatus.ENABLED,
          sort: 0,
        } as MenuInfo;
  },
);

watch(
  () => formData.value.type,
  (type) => {
    if (type === MenuType.BUTTON) {
      formData.value.path = '';
      formData.value.component = '';
      formData.value.redirect = '';
    } else if (!formData.value.component && formData.value.path) {
      formData.value.component = `/views/${formData.value.path.replace(/^\//, '').split('/')[0]}/index`;
    }
  },
);

const handleSubmit = async () => {
  try {
    await formRef.value.validate();
    loading.value = true;
    const submitData = {
      ...formData.value,
      authority: formData.value.authority ?? [],
      query: typeof formData.value.query === 'string'
        ? JSON.parse(formData.value.query as any)
        : formData.value.query,
    };
    if (props.mode === 'create') {
      await createMenuApi(submitData);
    } else {
      await updateMenuApi(formData.value.id!, submitData);
    }
    message.success(props.mode === 'create' ? '创建成功' : '更新成功');
    await refreshAccess(router);
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
  emit('update:visible', false);
};
</script>

<template>
  <Modal
    :confirm-loading="loading"
    :open="visible"
    :title="modalTitle"
    :width="800"
    @cancel="handleClose"
    @ok="handleSubmit"
  >
    <Form
      ref="formRef"
      class="mt-4"
      :label-col="{ span: 6 }"
      :model="formData"
      :rules="rules"
      :wrapper-col="{ span: 16 }"
    >
      <FormItem label="父级节点" name="parent_id">
        <TreeSelect
          v-model:value="formData.parent_id"
          allow-clear
          :tree-data="parentMenuOptions"
          placeholder="请选择父级节点"
          tree-default-expand-all
        />
      </FormItem>
      <FormItem label="节点类型" name="type">
        <RadioGroup v-model:value="formData.type" :options="menuTypeOptions" />
      </FormItem>
      <FormItem label="标题" name="title">
        <Input v-model:value="formData.title" allow-clear placeholder="请输入标题" />
      </FormItem>
      <FormItem label="名称" name="name">
        <Input v-model:value="formData.name" allow-clear placeholder="请输入路由名称或按钮名称" />
      </FormItem>
      <FormItem v-if="!isButton" label="路由路径" name="path">
        <Input v-model:value="formData.path" allow-clear placeholder="请输入路由路径" />
      </FormItem>
      <FormItem v-if="!isButton" label="组件路径" name="component">
        <Input v-model:value="formData.component" allow-clear placeholder="如：/views/system/index" />
      </FormItem>
      <FormItem v-if="isButton" label="权限码" name="authority">
        <Select
          v-model:value="formData.authority"
          mode="tags"
          allow-clear
          placeholder="输入后回车，例如 system:role:edit"
        />
        <template #extra>权限码必须与后端 Permission 注解一致。</template>
      </FormItem>
      <FormItem v-if="!isButton" label="重定向" name="redirect">
        <Input v-model:value="formData.redirect" allow-clear placeholder="请输入重定向路径" />
      </FormItem>
      <FormItem label="图标" name="icon">
        <Input v-model:value="formData.icon" allow-clear placeholder="请输入图标类名" />
      </FormItem>
      <FormItem label="排序" name="sort">
        <InputNumber v-model:value="formData.sort" class="w-full" :min="0" />
      </FormItem>
      <FormItem label="状态" name="status">
        <RadioGroup v-model:value="formData.status" :options="statusOptions" />
      </FormItem>
      <FormItem label="隐藏菜单" name="hide_in_menu">
        <Switch v-model:checked="formData.hide_in_menu" :checked-value="1" :un-checked-value="0" />
      </FormItem>
      <FormItem label="缓存页面" name="keep_alive">
        <Switch v-model:checked="formData.keep_alive" :checked-value="1" :un-checked-value="0" />
      </FormItem>
      <FormItem label="备注" name="remark">
        <Textarea v-model:value="formData.remark" allow-clear :rows="3" placeholder="请输入备注" />
      </FormItem>
    </Form>
  </Modal>
</template>
