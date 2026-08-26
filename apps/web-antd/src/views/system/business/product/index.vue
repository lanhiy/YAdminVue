<script setup lang="ts">
import type { TableColumnsType } from 'ant-design-vue';

import type { ProductInfo } from '#/api';

import { h, onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { Page } from '@vben/common-ui';

import { Icon } from '@iconify/vue';
import {
  Badge,
  Button,
  Dropdown,
  Input,
  Menu,
  MenuItem,
  message,
  Modal,
  Select,
  Space,
  Switch,
  Table,
} from 'ant-design-vue';

import {
  changeProductStatusApi,
  deleteProductApi,
  getProductListApi,
  ProductStatus,
} from '#/api';

import CalibrationCertForm from './components/calibration-cert-form.vue';
import ProductForm from './components/product-form.vue';
import TestReportForm from './components/test-report-form.vue';
import VerificationCertForm from './components/verification-cert-form.vue';

const { hasAccessByCodes } = useAccess();

const loading = ref(false);
const productList = ref<ProductInfo[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);

const formModalVisible = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const currentProduct = ref<null | ProductInfo>(null);

/** 三张子表的弹窗，各自独立 */
const testReportVisible = ref(false);
const verificationCertVisible = ref(false);
const calibrationCertVisible = ref(false);
/** 当前操作的产品，三张子表弹窗共用 */
const docProduct = ref<null | ProductInfo>(null);

const searchForm = ref({
  instrument_name: '',
  instrument_no: '',
  model: '',
  manufacturer: '',
  unit_name: '',
  status: undefined as number | undefined,
});

const statusOptions = [
  { label: '启用', value: ProductStatus.ENABLED },
  { label: '禁用', value: ProductStatus.DISABLED },
];

/** 打开某张子表的弹窗 */
const handleOpenDoc = (
  record: ProductInfo,
  type: 'calibration-cert' | 'test-report' | 'verification-cert',
) => {
  docProduct.value = { ...record };

  switch (type) {
    case 'calibration-cert': {
      calibrationCertVisible.value = true;
      break;
    }
    case 'test-report': {
      testReportVisible.value = true;
      break;
    }
    case 'verification-cert': {
      verificationCertVisible.value = true;
      break;
    }
  }
};

/**
 * 三张子表合并到一个「报告/证书」按钮里，点开后单选进入对应表单。
 * 每项后面带状态点：绿色=已录入，灰色=未录入。
 */
const buildDocMenu = (record: ProductInfo) => {
  const items: {
    codes: string[];
    key: 'calibration-cert' | 'test-report' | 'verification-cert';
    label: string;
    recorded?: boolean;
  }[] = [
    {
      key: 'test-report' as const,
      label: '测试报告',
      recorded: record.has_test_report,
      codes: ['system:testReport:show'],
    },
    {
      key: 'verification-cert' as const,
      label: '检定证书',
      recorded: record.has_verification_cert,
      codes: ['system:verificationCert:show'],
    },
    {
      key: 'calibration-cert' as const,
      label: '校准证书',
      recorded: record.has_calibration_cert,
      codes: ['system:calibrationCert:show'],
    },
  ].filter((item) => hasAccessByCodes(item.codes));

  // 三项都没权限时不渲染这个按钮
  if (items.length === 0) {
    return null;
  }

  return h(
    Menu,
    {},
    {
      default: () =>
        items.map((item) =>
          h(
            MenuItem,
            {
              key: item.key,
              onClick: () => handleOpenDoc(record, item.key),
            },
            {
              default: () =>
                h('div', { class: 'flex items-center justify-between gap-4' }, [
                  h('span', item.label),
                  h(Badge, {
                    status: item.recorded ? 'success' : 'default',
                    text: item.recorded ? '已录入' : '未录入',
                  }),
                ]),
            },
          ),
        ),
    },
  );
};

const columns: TableColumnsType = [
  {
    title: '器具名称',
    dataIndex: 'instrument_name',
    width: 180,
    ellipsis: true,
  },
  {
    title: '器具编号',
    dataIndex: 'instrument_no',
    width: 140,
  },
  {
    title: '型号',
    dataIndex: 'model',
    width: 130,
    customRender: ({ record }: { record: ProductInfo }) => record.model || '-',
  },
  {
    title: '制造厂商',
    dataIndex: 'manufacturer',
    width: 180,
    ellipsis: true,
    customRender: ({ record }: { record: ProductInfo }) =>
      record.manufacturer || '-',
  },
  {
    title: '单位名称',
    dataIndex: 'unit_name',
    width: 200,
    ellipsis: true,
    customRender: ({ record }: { record: ProductInfo }) =>
      record.unit_name || '-',
  },
  {
    title: '报告/证书',
    key: 'docs',
    width: 190,
    customRender: ({ record }: { record: ProductInfo }) => {
      const marks = [
        { label: '测试报告', recorded: record.has_test_report },
        { label: '检定证书', recorded: record.has_verification_cert },
        { label: '校准证书', recorded: record.has_calibration_cert },
      ];

      return h(
        'div',
        { class: 'flex flex-col gap-0.5' },
        marks.map((mark) =>
          h(Badge, {
            status: mark.recorded ? 'success' : 'default',
            text: mark.label,
          }),
        ),
      );
    },
  },
  {
    title: '状态',
    dataIndex: 'status',
    width: 100,
    customRender: ({ record }: { record: ProductInfo }) => {
      return h(Switch, {
        checked: record.status === ProductStatus.ENABLED,
        checkedChildren: '启用',
        disabled: !hasAccessByCodes(['system:product:status']),
        unCheckedChildren: '禁用',
        onChange: (checked: unknown) =>
          handleStatusChange(record, checked === true),
      });
    },
  },
  {
    title: '创建人',
    dataIndex: 'created_by_name',
    width: 110,
    customRender: ({ record }: { record: ProductInfo }) =>
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
    width: 260,
    fixed: 'right',
    customRender: ({ record }: { record: ProductInfo }) => {
      const actions = [];

      // 三张子表合并成一个下拉按钮
      const docMenu = buildDocMenu(record);

      if (docMenu) {
        actions.push(
          h(
            Dropdown,
            { trigger: ['click'] },
            {
              default: () =>
                h(
                  Button,
                  { type: 'link', size: 'small' },
                  {
                    default: () => '报告/证书',
                    icon: () =>
                      h(Icon, {
                        icon: 'mdi:file-document-multiple',
                        width: 16,
                      }),
                  },
                ),
              overlay: () => docMenu,
            },
          ),
        );
      }

      if (hasAccessByCodes(['system:product:edit'])) {
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

      if (hasAccessByCodes(['system:product:delete'])) {
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

      return h('div', { class: 'flex items-center gap-1' }, actions);
    },
  },
];

const loadProductList = async () => {
  try {
    loading.value = true;
    const data = await getProductListApi({
      page: page.value,
      page_size: pageSize.value,
      ...searchForm.value,
    });
    productList.value = data.list;
    total.value = data.total;
  } catch {
    message.error('加载产品列表失败');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  page.value = 1;
  loadProductList();
};

const handleReset = () => {
  searchForm.value = {
    instrument_name: '',
    instrument_no: '',
    model: '',
    manufacturer: '',
    unit_name: '',
    status: undefined,
  };
  page.value = 1;
  loadProductList();
};

const handleAdd = () => {
  formMode.value = 'create';
  currentProduct.value = null;
  formModalVisible.value = true;
};

const handleEdit = (record: ProductInfo) => {
  formMode.value = 'edit';
  currentProduct.value = { ...record };
  formModalVisible.value = true;
};

const handleDelete = (record: ProductInfo) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除产品「${record.instrument_name}」吗？该产品下的测试报告、检定证书、校准证书会一并删除。`,
    okText: '确定',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        await deleteProductApi(record.id!);
        message.success('删除成功');
        await loadProductList();
      } catch (error: any) {
        message.error(error.message || '删除失败');
      }
    },
  });
};

const handleStatusChange = async (record: ProductInfo, checked: boolean) => {
  try {
    const status = checked ? ProductStatus.ENABLED : ProductStatus.DISABLED;
    await changeProductStatusApi(record.id!, status);
    message.success('状态修改成功');
    record.status = status;
  } catch (error: any) {
    message.error(error.message || '状态修改失败');
  }
};

const handlePageChange = (newPage: number, newPageSize: number) => {
  page.value = newPage;
  pageSize.value = newPageSize;
  loadProductList();
};

const handleFormSuccess = () => {
  formModalVisible.value = false;
  loadProductList();
};

/** 子表保存成功后要刷新列表，录入标记会跟着变 */
const handleDocSuccess = () => {
  loadProductList();
};

onMounted(() => {
  loadProductList();
});
</script>

<template>
  <Page
    auto-content-height
    description="器具台账，每个产品可维护测试报告、检定证书、校准证书各一份"
    title="产品管理"
  >
    <template #extra>
      <Button
        v-if="hasAccessByCodes(['system:product:add'])"
        type="primary"
        @click="handleAdd"
      >
        <template #icon>
          <i class="i-ant-design:plus-outlined"></i>
        </template>
        新增产品
      </Button>
    </template>

    <!-- 搜索表单 -->
    <div class="mb-4 rounded bg-white p-4">
      <Space :size="16" wrap>
        <Input
          v-model:value="searchForm.instrument_name"
          allow-clear
          placeholder="器具名称"
          style="width: 160px"
          @press-enter="handleSearch"
        />
        <Input
          v-model:value="searchForm.instrument_no"
          allow-clear
          placeholder="器具编号"
          style="width: 150px"
          @press-enter="handleSearch"
        />
        <Input
          v-model:value="searchForm.model"
          allow-clear
          placeholder="型号"
          style="width: 130px"
          @press-enter="handleSearch"
        />
        <Input
          v-model:value="searchForm.manufacturer"
          allow-clear
          placeholder="制造厂商"
          style="width: 160px"
          @press-enter="handleSearch"
        />
        <Input
          v-model:value="searchForm.unit_name"
          allow-clear
          placeholder="单位名称"
          style="width: 180px"
          @press-enter="handleSearch"
        />
        <Select
          v-model:value="searchForm.status"
          allow-clear
          :options="statusOptions"
          placeholder="状态"
          style="width: 110px"
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
      bordered
      :columns="columns"
      :data-source="productList"
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
      :scroll="{ x: 1700 }"
      size="middle"
    />

    <!-- 产品表单 -->
    <ProductForm
      v-model:visible="formModalVisible"
      :mode="formMode"
      :product-data="currentProduct"
      @success="handleFormSuccess"
    />

    <!-- 测试报告表单 -->
    <TestReportForm
      v-model:visible="testReportVisible"
      :product="docProduct"
      @success="handleDocSuccess"
    />

    <!-- 检定证书表单 -->
    <VerificationCertForm
      v-model:visible="verificationCertVisible"
      :product="docProduct"
      @success="handleDocSuccess"
    />

    <!-- 校准证书表单 -->
    <CalibrationCertForm
      v-model:visible="calibrationCertVisible"
      :product="docProduct"
      @success="handleDocSuccess"
    />
  </Page>
</template>
