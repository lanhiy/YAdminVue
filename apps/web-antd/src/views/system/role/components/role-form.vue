<!-- src/views/system/role/components/role-form.vue -->
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
  Tree,
  Textarea,
  message,
} from 'ant-design-vue';
import {
  createRoleApi,
  updateRoleApi,
  type RoleInfo,
  RoleStatus,
} from '#/api';
import { getMenuListApi, type MenuInfo, MenuType } from '#/api';

interface Props {
  visible: boolean;
  mode: 'create' | 'edit';
  roleData: RoleInfo | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:visible': [value: boolean];
  success: [];
}>();

const formRef = ref();
const loading = ref(false);
const menuTreeData = ref<any[]>([]);
const checkedKeys = ref<number[]>([]);
const halfCheckedKeys = ref<number[]>([]);

const formData = ref<RoleInfo>({
  name: '',
  code: '',
  description: '',
  sort: 0,
  status: RoleStatus.ENABLED,
  menu_ids: [],
} as RoleInfo);

// 状态选项
const statusOptions = [
  { label: '启用', value: RoleStatus.ENABLED },
  { label: '禁用', value: RoleStatus.DISABLED },
];

// 表单标题
const modalTitle = computed(() => {
  return props.mode === 'create' ? '新增角色' : '编辑角色';
});

// 构建菜单树
const buildMenuTree = (menus: MenuInfo[]): any[] => {
  return menus.map((menu) => ({
    title: menu.title,
    key: menu.id,
    children: menu.children && menu.children.length > 0 ? buildMenuTree(menu.children) : undefined,
  }));
};

// 获取所有菜单ID（包括父节点）
const getAllMenuIds = (menus: MenuInfo[]): number[] => {
  const ids: number[] = [];
  const traverse = (items: MenuInfo[]) => {
    items.forEach((item) => {
      ids.push(item.id!);
      if (item.children && item.children.length > 0) {
        traverse(item.children);
      }
    });
  };
  traverse(menus);
  return ids;
};

// 获取叶子节点ID
const getLeafMenuIds = (menus: MenuInfo[], selectedIds: number[]): number[] => {
  const leafIds: number[] = [];
  const traverse = (items: MenuInfo[]) => {
    items.forEach((item) => {
      if (selectedIds.includes(item.id!)) {
        if (!item.children || item.children.length === 0) {
          leafIds.push(item.id!);
        } else {
          traverse(item.children);
        }
      }
    });
  };
  traverse(menus);
  return leafIds;
};

// 加载菜单列表
const loadMenuList = async () => {
  try {
    const data = await getMenuListApi();
    menuTreeData.value = buildMenuTree(data);

    // 如果是编辑模式，设置已选中的菜单
    if (props.mode === 'edit' && props.roleData?.menu_ids) {
      checkedKeys.value = getLeafMenuIds(data, props.roleData.menu_ids);
    }
  } catch (error) {
    message.error('加载菜单列表失败');
  }
};

// 表单规则
const rules = {
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  code: [
    { required: true, message: '请输入角色编码', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '角色编码只能包含字母、数字和下划线', trigger: 'blur' },
  ],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
};

// 监听弹窗显示
watch(
  () => props.visible,
  async (val) => {
    if (val) {
      await loadMenuList();
      if (props.roleData) {
        formData.value = { ...props.roleData };
      } else {
        formData.value = {
          name: '',
          code: '',
          description: '',
          sort: 0,
          status: RoleStatus.ENABLED,
          menu_ids: [],
        } as RoleInfo;
        checkedKeys.value = [];
      }
    }
  },
);

// 树选择变化
const handleTreeCheck = (checked: number[], e: any) => {
  checkedKeys.value = checked;
  halfCheckedKeys.value = e.halfCheckedKeys || [];
};

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value.validate();
    loading.value = true;

    // 合并选中的节点和半选中的节点
    const allSelectedIds = [...checkedKeys.value, ...halfCheckedKeys.value];
    const submitData = {
      ...formData.value,
      menu_ids: allSelectedIds,
    };

    if (props.mode === 'create') {
      await createRoleApi(submitData);
      message.success('创建成功');
    } else {
      await updateRoleApi(formData.value.id!, submitData);
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
  checkedKeys.value = [];
  halfCheckedKeys.value = [];
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
      :label-col="{ span: 5 }"
      :wrapper-col="{ span: 17 }"
      class="mt-4"
    >
      <FormItem label="角色名称" name="name">
        <Input
          v-model:value="formData.name"
          placeholder="请输入角色名称"
          allow-clear
        />
      </FormItem>

      <FormItem label="角色编码" name="code">
        <Input
          v-model:value="formData.code"
          placeholder="请输入角色编码（如：admin、editor）"
          allow-clear
          :disabled="mode === 'edit'"
        />
      </FormItem>

      <FormItem label="角色描述" name="description">
        <Textarea
          v-model:value="formData.description"
          placeholder="请输入角色描述"
          :rows="3"
          allow-clear
        />
      </FormItem>

      <FormItem label="菜单权限" name="menu_ids">
        <Tree
          v-model:checkedKeys="checkedKeys"
          checkable
          :tree-data="menuTreeData"
          :field-names="{ title: 'title', key: 'key', children: 'children' }"
          :default-expand-all="true"
          @check="handleTreeCheck"
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
