<!-- src/views/system/menu/components/menu-form.vue -->
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
  Switch,
  TreeSelect,
  Textarea,
  message
} from 'ant-design-vue';
import {
  createMenuApi,
  updateMenuApi,
  type MenuInfo,
  MenuType,
  MenuStatus,
} from '#/api';

interface Props {
  visible: boolean;
  mode: 'create' | 'edit';
  menuData: MenuInfo | null;
  menuList: MenuInfo[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:visible': [value: boolean];
  success: [];
}>();

const formRef = ref();
const loading = ref(false);
const formData = ref<MenuInfo>({
  parent_id: 0,
  name: '',
  path: '',
  type: MenuType.MENU,
  title: '',
  status: MenuStatus.ENABLED,
  sort: 0,
} as MenuInfo);

// 菜单类型选项
const menuTypeOptions = [
  { label: '目录', value: MenuType.CATALOG },
  { label: '菜单', value: MenuType.MENU },
  { label: '按钮', value: MenuType.BUTTON },
];

// 状态选项
const statusOptions = [
  { label: '启用', value: MenuStatus.ENABLED },
  { label: '禁用', value: MenuStatus.DISABLED },
];

// 表单标题
const modalTitle = computed(() => {
  return props.mode === 'create' ? '新增菜单' : '编辑菜单';
});

// 构建父菜单树形选项
const buildMenuTree = (menus: MenuInfo[]): any[] => {
  return menus
    .filter(menu => menu.type !== MenuType.BUTTON) // 排除按钮类型
    .map(menu => ({
      label: menu.title,
      value: menu.id,
      children: menu.children && menu.children.length > 0
        ? buildMenuTree(menu.children)
        : undefined
    }));
};

// 父菜单选项
const parentMenuOptions = computed(() => {
  return [
    { label: '根菜单', value: 0 },
    ...buildMenuTree(props.menuList),
  ];
});

// 表单规则
const rules = {
  name: [{ required: true, message: '请输入路由名称', trigger: 'blur' }],
  path: [{ required: true, message: '请输入路由路径', trigger: 'blur' }],
  title: [{ required: true, message: '请输入菜单标题', trigger: 'blur' }],
  type: [{ required: true, message: '请选择菜单类型', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
};

// 监听弹窗显示
watch(
  () => props.visible,
  (val) => {
    if (val && props.menuData) {
      formData.value = { ...props.menuData };
    }
  },
);

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value.validate();
    loading.value = true;

    // 处理 authority 和 query 字段
    const submitData = { ...formData.value };
    if (typeof submitData.authority === 'string') {
      submitData.authority = JSON.parse(submitData.authority as any);
    }
    if (typeof submitData.query === 'string') {
      submitData.query = JSON.parse(submitData.query as any);
    }

    if (props.mode === 'create') {
      await createMenuApi(submitData);
      message.success('创建成功');
    } else {
      await updateMenuApi(formData.value.id!, submitData);
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
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 16 }"
      class="mt-4"
    >
      <FormItem label="父级菜单" name="parent_id">
        <TreeSelect
          v-model:value="formData.parent_id"
          :tree-data="parentMenuOptions"
          placeholder="请选择父级菜单"
          tree-default-expand-all
          allow-clear
        />
      </FormItem>

      <FormItem label="菜单类型" name="type">
        <RadioGroup v-model:value="formData.type" :options="menuTypeOptions" />
      </FormItem>

      <FormItem label="菜单标题" name="title">
        <Input
          v-model:value="formData.title"
          placeholder="请输入菜单标题"
          allow-clear
        />
      </FormItem>

      <FormItem label="路由名称" name="name">
        <Input
          v-model:value="formData.name"
          placeholder="请输入路由名称（英文）"
          allow-clear
        />
      </FormItem>

      <FormItem label="路由路径" name="path">
        <Input
          v-model:value="formData.path"
          placeholder="请输入路由路径"
          allow-clear
        />
      </FormItem>

      <FormItem label="组件路径" name="component" v-if="formData.type !== MenuType.BUTTON">
        <Input
          v-model:value="formData.component"
          placeholder="请输入组件路径"
          allow-clear
        />
      </FormItem>

      <FormItem label="重定向" name="redirect">
        <Input
          v-model:value="formData.redirect"
          placeholder="请输入重定向路径"
          allow-clear
        />
      </FormItem>

      <FormItem label="菜单图标" name="icon">
        <Input
          v-model:value="formData.icon"
          placeholder="请输入图标类名"
          allow-clear
        >
          <template #prefix v-if="formData.icon">
            <i :class="formData.icon" />
          </template>
        </Input>
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

      <FormItem label="隐藏菜单" name="hide_in_menu">
        <Switch
          v-model:checked="formData.hide_in_menu"
          :checked-value="1"
          :un-checked-value="0"
        />
      </FormItem>

      <FormItem label="缓存页面" name="keep_alive">
        <Switch
          v-model:checked="formData.keep_alive"
          :checked-value="1"
          :un-checked-value="0"
        />
      </FormItem>

      <FormItem label="外链地址" name="link">
        <Input
          v-model:value="formData.link"
          placeholder="请输入外链地址"
          allow-clear
        />
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
