<script setup lang="ts">
import type { CertificateInfo } from '#/api';

import { h, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Icon } from '@iconify/vue';
import {
  Button,
  Input,
  message,
  Modal,
  Select,
  Space,
  Switch,
  Table,
} from 'ant-design-vue';

import {
  CertificateStatus,
  changeCertificateStatusApi,
  deleteCertificateApi,
  getCertificateListApi,
} from '#/api';

import CertificateForm from './components/certificate-form.vue';

// 数据状态
const loading = ref(false);
const certificateList = ref<CertificateInfo[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const formModalVisible = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const currentCertificate = ref<CertificateInfo | null>(null);

// 搜索条件
const searchForm = ref({
  cert_no: '',
  unit_name: '',
  instrument_name: '',
  status: undefined as number | undefined,
});

// 下拉选项
const statusOptions = [
  { label: '启用', value: CertificateStatus.ENABLED },
  { label: '禁用', value: CertificateStatus.DISABLED },
];

// 表格列配置
const columns = [
  {
    title: '证书编号',
    dataIndex: 'cert_no',
    width: 130,
  },
  {
    title: '单位名称',
    dataIndex: 'unit_name',
    width: 200,
    ellipsis: true,
  },
  {
    title: '器具名称',
    dataIndex: 'instrument_name',
    width: 180,
    ellipsis: true,
  },
  {
    title: '型号规格',
    dataIndex: 'model',
    width: 120,
  },
  {
    title: '出厂编号',
    dataIndex: 'factory_no',
    width: 120,
  },
  {
    title: '制造厂商',
    dataIndex: 'manufacturer',
    width: 200,
    ellipsis: true,
  },
  {
    title: '校检日期',
    dataIndex: 'check_date',
    width: 120,
  },
  {
    title: '有效期',
    dataIndex: 'valid_until',
    width: 120,
    customRender: ({ record }: { record: CertificateInfo }) => {
      return record.valid_until || '-';
    },
  },
  {
    title: '校检单位',
    dataIndex: 'check_unit',
    width: 180,
    ellipsis: true,
    customRender: ({ record }: { record: CertificateInfo }) => {
      return record.check_unit || '-';
    },
  },
  {
    title: '状态',
    dataIndex: 'status',
    width: 100,
    customRender: ({ record }: { record: CertificateInfo }) => {
      return h(Switch, {
        checked: record.status === CertificateStatus.ENABLED,
        checkedChildren: '启用',
        unCheckedChildren: '禁用',
        onChange: (checked: boolean) => handleStatusChange(record, checked),
      });
    },
  },
  {
    title: '创建人',
    dataIndex: 'created_by_name',
    width: 120,
    customRender: ({ record }: { record: CertificateInfo }) => {
      return record.created_by_name || '-';
    },
  },
  {
    title: '更新人',
    dataIndex: 'updated_by_name',
    width: 120,
    customRender: ({ record }: { record: CertificateInfo }) => {
      return record.updated_by_name || '-';
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
    customRender: ({ record }: { record: CertificateInfo }) => {
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

// 加载证书列表
const loadCertificateList = async () => {
  try {
    loading.value = true;
    const params = {
      page: page.value,
      page_size: pageSize.value,
      ...searchForm.value,
    };
    const data = await getCertificateListApi(params);
    certificateList.value = data.list;
    total.value = data.total;
  } catch {
    message.error('加载证书列表失败');
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  page.value = 1;
  loadCertificateList();
};

// 重置搜索
const handleReset = () => {
  searchForm.value = {
    cert_no: '',
    unit_name: '',
    instrument_name: '',
    status: undefined,
  };
  page.value = 1;
  loadCertificateList();
};

// 新增证书
const handleAdd = () => {
  formMode.value = 'create';
  currentCertificate.value = null;
  formModalVisible.value = true;
};

// 编辑证书
const handleEdit = (record: CertificateInfo) => {
  formMode.value = 'edit';
  currentCertificate.value = { ...record };
  formModalVisible.value = true;
};

// 删除证书
const handleDelete = (record: CertificateInfo) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除证书「${record.cert_no}」吗？`,
    okText: '确定',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        await deleteCertificateApi(record.id!);
        message.success('删除成功');
        await loadCertificateList();
      } catch (error: any) {
        message.error(error.message || '删除失败');
      }
    },
  });
};

// 修改状态
const handleStatusChange = async (
  record: CertificateInfo,
  checked: boolean,
) => {
  try {
    const status = checked
      ? CertificateStatus.ENABLED
      : CertificateStatus.DISABLED;
    await changeCertificateStatusApi(record.id!, status);
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
  loadCertificateList();
};

// 表单提交成功
const handleFormSuccess = () => {
  formModalVisible.value = false;
  loadCertificateList();
};

onMounted(() => {
  loadCertificateList();
});
</script>

<template>
  <Page
    auto-content-height
    description="器具校检证书管理，支持新增、编辑、删除"
    title="证书管理"
  >
    <!-- 新增按钮 -->
    <template #extra>
      <Button type="primary" @click="handleAdd">
        <template #icon>
          <i class="i-ant-design:plus-outlined"></i>
        </template>
        新增证书
      </Button>
    </template>

    <!-- 搜索表单 -->
    <div class="mb-4 rounded bg-white p-4">
      <Space :size="16" wrap>
        <Input
          v-model:value="searchForm.cert_no"
          allow-clear
          placeholder="证书编号"
          style="width: 150px"
          @press-enter="handleSearch"
        />
        <Input
          v-model:value="searchForm.unit_name"
          allow-clear
          placeholder="单位名称"
          style="width: 180px"
          @press-enter="handleSearch"
        />
        <Input
          v-model:value="searchForm.instrument_name"
          allow-clear
          placeholder="器具名称"
          style="width: 180px"
          @press-enter="handleSearch"
        />
        <Select
          v-model:value="searchForm.status"
          allow-clear
          placeholder="状态"
          :options="statusOptions"
          style="width: 120px"
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

    <!-- 表格 -->
    <Table
      :columns="columns"
      :data-source="certificateList"
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
      :scroll="{ x: 1800 }"
      bordered
      row-key="id"
      size="middle"
    />

    <!-- 证书表单弹窗 -->
    <CertificateForm
      v-model:visible="formModalVisible"
      :certificate-data="currentCertificate"
      :mode="formMode"
      @success="handleFormSuccess"
    />
  </Page>
</template>
