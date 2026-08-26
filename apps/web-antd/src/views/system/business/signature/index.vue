<script setup lang="ts">
import type { TableColumnsType } from 'ant-design-vue';

import type { SignatureInfo } from '#/api';

import { h, onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { Page } from '@vben/common-ui';

import { Icon } from '@iconify/vue';
import {
  Button,
  Input,
  message,
  Modal,
  Space,
  Table,
} from 'ant-design-vue';

import {
  deleteSignatureApi,
  getSignatureListApi,
} from '#/api';

import SignatureForm from './components/signature-form.vue';

const { hasAccessByCodes } = useAccess();

const loading = ref(false);
const signatureList = ref<SignatureInfo[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const formModalVisible = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const currentSignature = ref<null | SignatureInfo>(null);

const searchForm = ref({
  name: '',
});

const columns: TableColumnsType = [
  {
    title: '签名人姓名',
    dataIndex: 'name',
    width: 160,
  },
  {
    title: '签名图片',
    dataIndex: 'image_base64',
    width: 200,
    customRender: ({ record }: { record: SignatureInfo }) => {
      const url = record.image_base64;

      if (!url) {
        return '-';
      }

      return h(
        'div',
        {
          class: 'flex h-16 w-40 items-center justify-center overflow-hidden rounded border border-gray-200',
          style: {
            backgroundColor: '#fff',
            backgroundImage:
              'linear-gradient(45deg, #eef0f2 25%, transparent 25%), linear-gradient(-45deg, #eef0f2 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #eef0f2 75%), linear-gradient(-45deg, transparent 75%, #eef0f2 75%)',
            backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
            backgroundSize: '16px 16px',
          },
        },
        [
          h('img', {
            src: url,
            alt: record.name,
            class: 'h-full w-full object-contain',
          }),
        ],
      );
    },
  },
  {
    title: '排序',
    dataIndex: 'sort',
    width: 80,
  },
  {
    title: '备注',
    dataIndex: 'remark',
    width: 200,
    ellipsis: true,
    customRender: ({ record }: { record: SignatureInfo }) =>
      record.remark || '-',
  },
  {
    title: '创建人',
    dataIndex: 'created_by_name',
    width: 120,
    customRender: ({ record }: { record: SignatureInfo }) =>
      record.created_by_name || '-',
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    width: 180,
  },
  {
    title: '操作',
    key: 'action',
    width: 160,
    fixed: 'right',
    customRender: ({ record }: { record: SignatureInfo }) => {
      const actions = [];

      if (hasAccessByCodes(['system:signature:edit'])) {
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

      if (hasAccessByCodes(['system:signature:delete'])) {
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

      return h('div', { class: 'flex items-center gap-2' }, actions);
    },
  },
];

const loadSignatureList = async () => {
  try {
    loading.value = true;
    const data = await getSignatureListApi({
      page: page.value,
      page_size: pageSize.value,
      ...searchForm.value,
    });
    signatureList.value = data.list;
    total.value = data.total;
  } catch {
    message.error('加载签名列表失败');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  page.value = 1;
  loadSignatureList();
};

const handleReset = () => {
  searchForm.value = { name: '' };
  page.value = 1;
  loadSignatureList();
};

const handleAdd = () => {
  formMode.value = 'create';
  currentSignature.value = null;
  formModalVisible.value = true;
};

const handleEdit = (record: SignatureInfo) => {
  formMode.value = 'edit';
  currentSignature.value = { ...record };
  formModalVisible.value = true;
};

const handleDelete = (record: SignatureInfo) => {
  Modal.confirm({
    class: 'business-confirm-modal',
    title: '确认删除',
    content: `确定要删除「${record.name}」的签名吗？已签发的报告和证书不受影响。`,
    centered: true,
    icon: () => h(Icon, { icon: 'mdi:alert-circle-outline', width: 24 }),
    okText: '确定',
    okType: 'danger',
    cancelText: '取消',
    type: 'warning',
    width: 520,
    async onOk() {
      try {
        await deleteSignatureApi(record.id!);
        message.success('删除成功');
        await loadSignatureList();
      } catch (error: any) {
        message.error(error.message || '删除失败');
      }
    },
  });
};

const handlePageChange = (newPage: number, newPageSize: number) => {
  page.value = newPage;
  pageSize.value = newPageSize;
  loadSignatureList();
};

const handleFormSuccess = () => {
  formModalVisible.value = false;
  loadSignatureList();
};

onMounted(() => {
  loadSignatureList();
});
</script>

<template>
  <Page
    auto-content-height
    description="预存签名图片库，供测试报告、检定证书、校准证书选用"
    title="签名管理"
  >
    <template #extra>
      <Button
        v-if="hasAccessByCodes(['system:signature:add'])"
        type="primary"
        @click="handleAdd"
      >
        <template #icon>
          <i class="i-ant-design:plus-outlined"></i>
        </template>
        新增签名
      </Button>
    </template>

    <div class="bg-card mb-2 rounded p-3">
      <Space :size="8" wrap>
        <Input
          v-model:value="searchForm.name"
          allow-clear
          placeholder="签名人姓名"
          style="width: 180px"
          @press-enter="handleSearch"
        />
        <Button type="primary" @click="handleSearch">
          <template #icon>
            <i class="i-ant-design:search-outlined"></i>
          </template>
          搜索
        </Button>
        <Button @click="handleReset">
          <template #icon>
            <i class="i-ant-design:reload-outlined"></i>
          </template>
          重置
        </Button>
      </Space>
    </div>

    <Table
      bordered
      :columns="columns"
      :data-source="signatureList"
      :loading="loading"
      :pagination="{
        current: page,
        pageSize,
        total,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (t: number) => `共 ${t} 条`,
        onChange: handlePageChange,
      }"
      row-key="id"
      :scroll="{ x: 1100 }"
      size="small"
      sticky
    />

    <SignatureForm
      v-model:visible="formModalVisible"
      :mode="formMode"
      :signature-data="currentSignature"
      @success="handleFormSuccess"
    />
  </Page>
</template>
