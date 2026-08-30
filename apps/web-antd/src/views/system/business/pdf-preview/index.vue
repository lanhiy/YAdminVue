<script setup lang="ts">
import type { OverlayAttr } from './templates';

import type {
  DocType,
  ProductInfo,
  ProductPdfData,
  ProductPdfType,
} from '#/api';

import { computed, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

import { useResizeObserver, useWindowSize } from '@vueuse/core';
import {
  Button,
  DatePicker,
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
} from 'ant-design-vue';
import QRCode from 'qrcode';

import { getProductPdfDataApi, updateDocApi, updateProductApi } from '#/api';
import { resolveAssetUrl } from '#/utils/asset';

import SignaturePicker from '../product/components/signature-picker.vue';
import { createPdfTemplates } from './templates';

defineOptions({ name: 'SystemBusinessPdfPreview' });

/** 开发时改为 true，显示宽高位置字号等调试属性，左侧预览按容器宽度铺满 */
const SHOW_ATTR_DEBUG = true;

const CANVAS_WIDTH = 2479;
const CANVAS_HEIGHT = 3508;
const PDF_WIDTH = 595.28;
const PDF_HEIGHT = 841.89;
const FIXED_PAGE_FIELDS = new Set(['当前页']);
const isFixedPageField = (name: string) => FIXED_PAGE_FIELDS.has(name);
const PDF_TEMPLATE_BY_TYPE: Record<ProductPdfType, string[]> = {
  'calibration-cert-cnas': ['jzDNS'],
  'calibration-cert-no-cnas': ['jz'],
  'test-report': ['cs'],
  'verification-cert': ['jd'],
};
const PDF_TYPES = new Set<ProductPdfType>([
  'calibration-cert-cnas',
  'calibration-cert-no-cnas',
  'test-report',
  'verification-cert',
]);

const templates = reactive(createPdfTemplates());
templates.forEach((template) => {
  FIXED_PAGE_FIELDS.forEach((field) => {
    if (template.attr[field]) {
      template.attr[field].value = '1';
    }
  });
});
const route = useRoute();
const parseRouteType = (value: unknown) => {
  const type = String(value ?? '');
  return PDF_TYPES.has(type as ProductPdfType)
    ? (type as ProductPdfType)
    : null;
};
const certificateType = ref(parseRouteType(route.query.type));
const selectedKey = ref(
  certificateType.value
    ? PDF_TEMPLATE_BY_TYPE[certificateType.value][0]!
    : templates[0]!.key,
);
const activeField = ref('');
const stageWrapRef = ref<HTMLElement>();
const wrapWidth = ref(480);
const generating = ref(false);
const loadingCertificate = ref(false);
const certificateData = ref<null | ProductPdfData>(null);
const saveStatus = ref<'error' | 'idle' | 'saved' | 'saving'>('idle');
const saving = ref(false);
const dirty = ref(false);

const current = computed(
  () =>
    templates.find((item) => item.key === selectedKey.value) ?? templates[0]!,
);

const attrEntries = computed(() => Object.entries(current.value.attr));

interface DateAttrGroup {
  day: string;
  label: string;
  month: string;
  year: string;
}

const dateGroupFor = (name: string): DateAttrGroup | null => {
  const suffix = name.slice(-1);
  if (!['年', '日', '月'].includes(suffix)) return null;

  const base = name.slice(0, -1);
  const year = `${base}年`;
  const month = `${base}月`;
  const day = `${base}日`;
  const attrs = current.value.attr;
  if (!attrs[year] || !attrs[month] || !attrs[day]) return null;

  return { day, label: base, month, year };
};

const isGroupedDatePart = (name: string) => {
  const group = dateGroupFor(name);
  return group !== null && name !== group.year;
};

const visibleAttrEntries = computed(() =>
  attrEntries.value.filter(([name]) => !isGroupedDatePart(name)),
);

const totalPages = computed(() => {
  const templateValue = current.value.attr['总页']?.value;
  const value = Number(
    templateValue || certificateData.value?.document?.total_pages || 1,
  );
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 1;
});

const displayValue = (name: string, item: OverlayAttr) => {
  if (name === '当前页') return '1';
  if (name === '总页') return String(totalPages.value);
  return item.value;
};

const { height: viewportHeight } = useWindowSize();

const scale = computed(() => {
  const available = Math.max(wrapWidth.value - 16, 120);
  if (SHOW_ATTR_DEBUG) {
    return Math.min(1, available / CANVAS_WIDTH);
  }
  const availableHeight = Math.max(viewportHeight.value - 220, 240);
  return Math.min(1, available / CANVAS_WIDTH, availableHeight / CANVAS_HEIGHT);
});

useResizeObserver(stageWrapRef, (entries) => {
  wrapWidth.value = entries[0]?.contentRect.width ?? 480;
});

const toText = (value: unknown) =>
  value === null || value === undefined ? '' : String(value);

const splitDate = (value: unknown) => {
  const match = toText(value).match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  return match
    ? { day: match[3]!, month: match[2]!, year: match[1]! }
    : { day: '', month: '', year: '' };
};

const setTemplateValue = (
  template: (typeof templates)[number],
  name: string,
  value: unknown,
) => {
  const item = template.attr[name];
  if (item) item.value = toText(value);
};

const setTemplateImage = (
  template: (typeof templates)[number],
  name: string,
  value: unknown,
) => {
  const item = template.attr[name];
  if (item) item.value = toText(value);
};

const clearTemplateValues = (template: (typeof templates)[number]) => {
  Object.entries(template.attr).forEach(([name, item]) => {
    item.value = isFixedPageField(name) ? '1' : '';
  });
};

/** 按证书接口字段把数据写入对应模板；校准证书的两个模板共享数据。 */
const applyCertificateData = async (
  data: ProductPdfData,
  type: ProductPdfType,
) => {
  const documentData = data.document ?? {};
  const product = data.product ?? {};
  const targetKeys = PDF_TEMPLATE_BY_TYPE[type];
  const targetTemplates = templates.filter((template) =>
    targetKeys.includes(template.key),
  );
  const qrCode = data.url
    ? await QRCode.toDataURL(data.url, { margin: 0, width: 196 })
    : '';

  templates.forEach((template) => clearTemplateValues(template));
  targetTemplates.forEach((template) => {
    setTemplateValue(template, '总页', totalPages.value);
    setTemplateImage(template, '二维码', qrCode);
  });

  if (type === 'test-report') {
    const date = splitDate(documentData.test_date);
    targetTemplates.forEach((template) => {
      setTemplateValue(template, '报告编号', documentData.report_no);
      setTemplateValue(template, '委托方', documentData.client_name);
      setTemplateValue(template, '样品名称', product.instrument_name);
      setTemplateValue(template, '制造厂商', product.manufacturer);
      setTemplateValue(template, '型号规格', product.model);
      setTemplateValue(template, '器具编号', product.instrument_no);
      setTemplateImage(template, '批准', documentData.approver_sign_img);
      setTemplateImage(template, '核验', documentData.reviewer_sign_img);
      setTemplateImage(template, '测试', documentData.tester_sign_img);
      setTemplateValue(template, '测试日期年', date.year);
      setTemplateValue(template, '测试日期月', date.month);
      setTemplateValue(template, '测试日期日', date.day);
    });
  }

  if (type === 'verification-cert') {
    const verifyDate = splitDate(documentData.verify_date);
    const validUntil = splitDate(documentData.valid_until);
    targetTemplates.forEach((template) => {
      setTemplateValue(template, '证书编号', documentData.cert_no);
      setTemplateValue(template, '送检单位', documentData.submit_unit);
      setTemplateValue(template, '计量器具名称', product.instrument_name);
      setTemplateValue(template, '型号规格', product.model);
      setTemplateValue(template, '器具编号', product.instrument_no);
      setTemplateValue(template, '制造厂商', product.manufacturer);
      setTemplateValue(template, '检定依据', documentData.basis);
      setTemplateValue(template, '检定结论', documentData.conclusion);
      setTemplateImage(template, '批准', documentData.approver_sign_img);
      setTemplateImage(template, '核验', documentData.reviewer_sign_img);
      setTemplateImage(template, '检定', documentData.verifier_sign_img);
      setTemplateValue(template, '检定日期年', verifyDate.year);
      setTemplateValue(template, '检定日期月', verifyDate.month);
      setTemplateValue(template, '检定日期日', verifyDate.day);
      setTemplateValue(template, '有效期至年', validUntil.year);
      setTemplateValue(template, '有效期至月', validUntil.month);
      setTemplateValue(template, '有效期至日', validUntil.day);
    });
  }

  if (type === 'calibration-cert-cnas' || type === 'calibration-cert-no-cnas') {
    const receiveDate = splitDate(documentData.receive_date);
    const calibrateDate = splitDate(documentData.calibrate_date);
    const issueDate = splitDate(documentData.issue_date);
    targetTemplates.forEach((template) => {
      setTemplateValue(template, '证书编号', documentData.cert_no);
      setTemplateValue(template, '委托方', documentData.client_name);
      setTemplateValue(template, '地址', documentData.address);
      setTemplateValue(template, '接收日期年', receiveDate.year);
      setTemplateValue(template, '接收日期月', receiveDate.month);
      setTemplateValue(template, '接收日期日', receiveDate.day);
      setTemplateValue(template, '校准日期年', calibrateDate.year);
      setTemplateValue(template, '校准日期月', calibrateDate.month);
      setTemplateValue(template, '校准日期日', calibrateDate.day);
      setTemplateValue(template, '签发日期年', issueDate.year);
      setTemplateValue(template, '签发日期月', issueDate.month);
      setTemplateValue(template, '签发日期日', issueDate.day);
      setTemplateImage(template, '批准', documentData.approver_sign_img);
      setTemplateImage(template, '核验', documentData.reviewer_sign_img);
      setTemplateImage(template, '校准', documentData.calibrator_sign_img);
    });
  }
};

const loadCertificateData = async () => {
  const type = parseRouteType(route.query.type);
  certificateType.value = type;
  certificateData.value = null;
  dirty.value = false;
  saveStatus.value = 'idle';
  if (!type) return;
  selectedKey.value = PDF_TEMPLATE_BY_TYPE[type][0]!;
  const certificateId = Number(route.query.certificateId);
  if (!Number.isInteger(certificateId) || certificateId <= 0) {
    message.warning('缺少有效的证书参数，请从产品页的PDF进入');
    return;
  }

  try {
    loadingCertificate.value = true;
    const data = await getProductPdfDataApi(certificateId, type);
    certificateData.value = data;
    await applyCertificateData(data, type);
  } catch (error: any) {
    message.error(error.message || '证书数据加载失败');
  } finally {
    loadingCertificate.value = false;
  }
};

watch(
  () => [route.query.certificateId, route.query.type],
  loadCertificateData,
  { immediate: true },
);

const loadImage = (
  src: string,
  resolveRemoteAsset = true,
): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    if (resolveRemoteAsset && !/^(?:blob:|data:)/.test(src)) {
      image.crossOrigin = 'anonymous';
    }
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', () =>
      reject(new Error(`图片加载失败: ${src}`)),
    );
    image.src = resolveRemoteAsset ? resolveAssetUrl(src) : src;
  });

const drawImageContain = (
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  item: OverlayAttr,
) => {
  const naturalWidth = image.naturalWidth || image.width;
  const naturalHeight = image.naturalHeight || image.height;
  if (!naturalWidth || !naturalHeight) return;

  const ratio = Math.min(
    item.width / naturalWidth,
    item.height / naturalHeight,
  );
  const width = naturalWidth * ratio;
  const height = naturalHeight * ratio;
  context.drawImage(
    image,
    item.left + (item.width - width) / 2,
    item.top + (item.height - height) / 2,
    width,
    height,
  );
};

/** 将当前模板绘制为固定尺寸的一页证书图片。 */
const renderCertificateImage = async () => {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('当前浏览器不支持证书预览');

  const background = await loadImage(current.value.img, false);
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  context.drawImage(background, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  for (const [, item] of attrEntries.value) {
    if (item.type === 'img') {
      if (!item.value) continue;
      drawImageContain(context, await loadImage(item.value), item);
      continue;
    }

    if (!item.value) continue;
    context.save();
    context.fillStyle = item.color ?? '#000000';
    context.font = `${item.fontSize ?? 48}px ${item.fontFamily ?? 'SimSun, STSong, serif'}`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(
      item.value,
      item.left + item.width / 2,
      item.top + item.height / 2,
      item.width,
    );
    context.restore();
  }

  return canvas.toDataURL('image/jpeg', 0.95);
};

const handlePrint = () => {
  window.print();
};

const dataUrlToBytes = (dataUrl: string) => {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.codePointAt(index) ?? 0;
  }
  return bytes;
};

const encodeText = (value: string) => new TextEncoder().encode(value);

/** 把单页 JPEG 快照封装为标准 A4 PDF，避免依赖额外 PDF 库。 */
const createPdfBlob = (jpegDataUrl: string) => {
  const jpegBytes = dataUrlToBytes(jpegDataUrl);
  const chunks: Uint8Array[] = [];
  const objectOffsets: number[] = [0];
  let byteLength = 0;

  const append = (chunk: Uint8Array) => {
    chunks.push(chunk);
    byteLength += chunk.length;
  };
  const appendText = (value: string) => append(encodeText(value));
  const appendObject = (number: number, body: string | Uint8Array) => {
    objectOffsets[number] = byteLength;
    appendText(`${number} 0 obj\n`);
    append(typeof body === 'string' ? encodeText(body) : body);
    appendText('\nendobj\n');
  };

  append(
    new Uint8Array([
      37, 80, 68, 70, 45, 49, 46, 52, 10, 37, 255, 255, 255, 255, 255, 10,
    ]),
  );
  appendObject(1, '<< /Type /Catalog /Pages 2 0 R >>');
  appendObject(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  appendObject(
    3,
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PDF_WIDTH} ${PDF_HEIGHT}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`,
  );
  objectOffsets[4] = byteLength;
  appendText('4 0 obj\n');
  appendText(
    `<< /Type /XObject /Subtype /Image /Width ${CANVAS_WIDTH} /Height ${CANVAS_HEIGHT} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`,
  );
  append(jpegBytes);
  appendText('\nendstream\nendobj\n');
  const pageContent = `q\n${PDF_WIDTH} 0 0 ${PDF_HEIGHT} 0 0 cm\n/Im0 Do\nQ\n`;
  appendObject(
    5,
    `<< /Length ${encodeText(pageContent).length} >>\nstream\n${pageContent}endstream`,
  );

  const xrefOffset = byteLength;
  appendText('xref\n0 6\n0000000000 65535 f \n');
  for (let number = 1; number <= 5; number += 1) {
    appendText(`${String(objectOffsets[number]).padStart(10, '0')} 00000 n \n`);
  }
  appendText(
    `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`,
  );

  return new Blob(chunks as unknown as BlobPart[], { type: 'application/pdf' });
};

const handleDownloadPdf = async () => {
  try {
    generating.value = true;
    const imageUrl = await renderCertificateImage();
    const url = URL.createObjectURL(createPdfBlob(imageUrl));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${current.value.title}-第1页.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
    message.success('PDF文件已下载');
  } catch (error: any) {
    message.error(error.message || 'PDF文件下载失败');
  } finally {
    generating.value = false;
  }
};

const currentDocType = computed<DocType | null>(() => {
  if (certificateType.value === 'test-report') return 'test-report';
  if (certificateType.value === 'verification-cert') return 'verification-cert';
  if (
    certificateType.value === 'calibration-cert-cnas' ||
    certificateType.value === 'calibration-cert-no-cnas'
  ) {
    return 'calibration-cert';
  }
  return null;
});

const readAttribute = (name: string) => current.value.attr[name]?.value ?? '';

const dateGroupValue = (yearName: string): string | undefined => {
  const group = dateGroupFor(yearName);
  if (!group) return readAttribute(yearName);

  const year = readAttribute(group.year);
  const month = readAttribute(group.month);
  const day = readAttribute(group.day);
  if (!year || !month || !day) return undefined;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

const updateStringValue = (item: OverlayAttr, value: unknown) => {
  item.value = toText(value);
  markDirty();
};

const updateImageValue = (item: OverlayAttr, value: unknown) => {
  item.value = toText(value);
  markDirty();
};

const updateDateGroup = (yearName: string, value: unknown) => {
  const group = dateGroupFor(yearName);
  if (!group) return;

  const text = toText(value).trim();
  if (!text) {
    current.value.attr[group.year]!.value = '';
    current.value.attr[group.month]!.value = '';
    current.value.attr[group.day]!.value = '';
    markDirty();
    return;
  }

  const parts = text
    .replaceAll(/[年月日]/g, '-')
    .replaceAll('/', '-')
    .split('-')
    .map((part) => part.trim())
    .filter(Boolean);
  const attrs = current.value.attr;
  if (parts[0]) attrs[group.year]!.value = parts[0];
  if (parts[1]) attrs[group.month]!.value = parts[1];
  if (parts[2]) attrs[group.day]!.value = parts[2];
  markDirty();
};

const updateAttributeValue = (
  name: string,
  item: OverlayAttr,
  value: unknown,
) => {
  if (dateGroupFor(name)) {
    updateDateGroup(name, value);
    return;
  }
  updateStringValue(item, value);
};

const formatDate = (
  yearName: string,
  monthName: string,
  dayName: string,
  fallback: unknown,
) => {
  const year = readAttribute(yearName);
  const month = readAttribute(monthName);
  const day = readAttribute(dayName);
  if (!year || !month || !day) return toText(fallback);
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

const buildCertificatePayload = () => {
  const data = certificateData.value;
  const type = currentDocType.value;
  if (!data || !type) return null;

  const documentData = data.document;
  const base = {
    id: Number(documentData.id),
    remark: toText(documentData.remark),
    total_pages: totalPages.value,
  };

  if (type === 'test-report') {
    return {
      ...base,
      approver_sign_img: readAttribute('批准'),
      client_name: readAttribute('委托方'),
      report_no: readAttribute('报告编号'),
      test_date: formatDate(
        '测试日期年',
        '测试日期月',
        '测试日期日',
        documentData.test_date,
      ),
      tester_sign_img: readAttribute('测试'),
      reviewer_sign_img: readAttribute('核验'),
    };
  }

  if (type === 'verification-cert') {
    return {
      ...base,
      approver_sign_img: readAttribute('批准'),
      basis: readAttribute('检定依据'),
      cert_no: readAttribute('证书编号'),
      conclusion: readAttribute('检定结论'),
      reviewer_sign_img: readAttribute('核验'),
      submit_unit: readAttribute('送检单位'),
      valid_until: formatDate(
        '有效期至年',
        '有效期至月',
        '有效期至日',
        documentData.valid_until,
      ),
      verifier_sign_img: readAttribute('检定'),
      verify_date: formatDate(
        '检定日期年',
        '检定日期月',
        '检定日期日',
        documentData.verify_date,
      ),
    };
  }

  return {
    ...base,
    address: readAttribute('地址'),
    approver_sign_img: readAttribute('批准'),
    calibrate_date: formatDate(
      '校准日期年',
      '校准日期月',
      '校准日期日',
      documentData.calibrate_date,
    ),
    calibrator_sign_img: readAttribute('校准'),
    cert_no: readAttribute('证书编号'),
    client_name: readAttribute('委托方'),
    issue_date: formatDate(
      '签发日期年',
      '签发日期月',
      '签发日期日',
      documentData.issue_date,
    ),
    receive_date: formatDate(
      '接收日期年',
      '接收日期月',
      '接收日期日',
      documentData.receive_date,
    ),
    reviewer_sign_img: readAttribute('核验'),
  };
};

const buildProductPayload = (): null | ProductInfo => {
  const product = certificateData.value?.product;
  if (!product?.id) return null;

  const instrumentName =
    readAttribute('样品名称') || readAttribute('计量器具名称');
  return {
    id: product.id,
    instrument_name: instrumentName || product.instrument_name,
    instrument_no: readAttribute('器具编号') || product.instrument_no,
    manufacturer: readAttribute('制造厂商') || product.manufacturer,
    model: readAttribute('型号规格') || product.model,
    remark: product.remark,
    sort: product.sort,
  };
};

const persistEdits = async () => {
  const data = certificateData.value;
  const type = currentDocType.value;
  const certificatePayload = buildCertificatePayload();
  if (!data || !type || !certificatePayload?.id) return;

  saving.value = true;
  saveStatus.value = 'saving';
  try {
    const [savedDocument, savedProduct] = await Promise.all([
      updateDocApi<Record<string, unknown>>(
        type,
        certificatePayload.id,
        certificatePayload,
      ),
      (() => {
        const productPayload = buildProductPayload();
        return productPayload
          ? updateProductApi(productPayload.id!, productPayload)
          : null;
      })(),
    ]);
    data.document = { ...data.document, ...savedDocument };
    if (savedProduct) data.product = { ...data.product, ...savedProduct };
    dirty.value = false;
    saveStatus.value = 'saved';
    message.success('证书属性保存成功');
  } catch (error) {
    console.error('保存证书属性失败', error);
    saveStatus.value = 'error';
    message.error('证书属性保存失败，请检查内容后重试');
  } finally {
    saving.value = false;
  }
};

const markDirty = () => {
  if (!certificateData.value || !currentDocType.value) return;
  dirty.value = true;
  saveStatus.value = 'idle';
};

const saveStatusText = computed(() => {
  if (saveStatus.value === 'saving') return '保存中...';
  if (saveStatus.value === 'saved') return '已保存';
  if (saveStatus.value === 'error') return '保存失败';
  if (dirty.value) return '有未保存修改';
  return '';
});

const overlayStyle = (item: OverlayAttr) => ({
  color: item.color ?? '#000000',
  fontFamily: item.fontFamily ?? 'SimSun, STSong, serif',
  fontSize: `${item.fontSize ?? 48}px`,
  height: `${item.height}px`,
  left: `${item.left}px`,
  lineHeight: 1,
  textAlign: 'center' as const,
  top: `${item.top}px`,
  width: `${item.width}px`,
});
</script>

<template>
  <Page
    auto-content-height
    content-class="p-4"
    description="可预览PDF文件并进行修改"
    title="PDF预览"
  >
    <template #extra>
      <div class="flex flex-wrap gap-2">
        <Button
          class="!border-[#1677ff] !bg-[#1677ff] !text-white hover:!border-[#4096ff] hover:!bg-[#4096ff]"
          :loading="loadingCertificate"
          @click="handlePrint"
        >
          打印
        </Button>
        <Button
          class="!border-[#16a34a] !bg-[#16a34a] !text-white hover:!border-[#22c55e] hover:!bg-[#22c55e]"
          :loading="generating"
          @click="handleDownloadPdf"
        >
          下载PDF文件
        </Button>
      </div>
    </template>
    <div class="flex flex-col gap-3">
      <div class="flex flex-col items-stretch gap-3 xl:flex-row xl:items-start">
        <div ref="stageWrapRef" class="min-w-0 flex-1 rounded bg-[#d9d9d9] p-2">
          <div
            class="relative mx-auto"
            :style="{
              width: `${CANVAS_WIDTH * scale}px`,
              height: `${CANVAS_HEIGHT * scale}px`,
            }"
          >
            <div
              class="pdf-print-area absolute left-0 top-0 bg-white shadow"
              :style="{
                width: `${CANVAS_WIDTH}px`,
                height: `${CANVAS_HEIGHT}px`,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
              }"
            >
              <img
                :alt="current.title"
                class="pointer-events-none block h-full w-full"
                :src="current.img"
              />
              <div
                v-for="[name, item] in attrEntries"
                :key="name"
                class="pdf-overlay absolute box-border flex items-center justify-center overflow-hidden leading-none"
                :class="
                  activeField === name
                    ? 'outline outline-2 outline-blue-500'
                    : item.value
                      ? ''
                      : 'outline-dashed outline-1 outline-blue-400/40'
                "
                :style="overlayStyle(item)"
                @click="activeField = name"
              >
                <img
                  v-if="item.type === 'img' && item.value"
                  :alt="name"
                  class="h-full w-full object-contain"
                  :src="resolveAssetUrl(item.value)"
                />
                <span
                  v-else-if="item.type === 'string'"
                  class="block w-full text-center"
                >
                  {{ displayValue(name, item) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-card w-full shrink-0 rounded p-4 xl:w-[460px]">
          <div class="mb-3 flex items-center justify-between gap-3">
            <div class="text-base font-medium">{{ current.title }} 属性</div>
            <div class="flex items-center gap-2">
              <span
                v-if="saveStatusText"
                class="text-xs"
                :class="
                  saveStatus === 'error'
                    ? 'text-red-500'
                    : 'text-muted-foreground'
                "
              >
                {{ saveStatusText }}
              </span>
              <Button
                v-if="certificateData"
                class="!border-[#f97316] !bg-[#f97316] !text-white hover:!border-[#fb923c] hover:!bg-[#fb923c]"
                size="small"
                type="primary"
                :loading="saving"
                @click="persistEdits"
              >
                保存
              </Button>
            </div>
          </div>
          <Form
            :colon="false"
            :label-col="{ style: { width: '8.5em' } }"
            :wrapper-col="{ style: { flex: '1 1 0', minWidth: 0 } }"
            label-align="right"
          >
            <FormItem
              v-for="[name, item] in visibleAttrEntries"
              :id="`field-${name}`"
              :key="name"
              class="mb-3"
              :label="dateGroupFor(name)?.label ?? name"
            >
              <div class="flex flex-col gap-2" @focusin="activeField = name">
                <InputNumber
                  v-if="name === '总页'"
                  :value="Number(item.value) || 1"
                  class="w-full"
                  :min="1"
                  placeholder="请输入总页数"
                  @update:value="updateStringValue(item, $event)"
                />
                <DatePicker
                  v-else-if="dateGroupFor(name)"
                  :value="dateGroupValue(name)"
                  class="w-full"
                  :disabled="isFixedPageField(name)"
                  :placeholder="`请选择${dateGroupFor(name)?.label ?? name}`"
                  value-format="YYYY-MM-DD"
                  @update:value="updateDateGroup(name, $event)"
                />
                <Input
                  v-else-if="item.type === 'string'"
                  :value="item.value"
                  :disabled="isFixedPageField(name)"
                  :placeholder="`请输入${name}`"
                  :style="{ textAlign: 'center' }"
                  @update:value="updateAttributeValue(name, item, $event)"
                  @focus="activeField = name"
                />
                <div v-else class="flex items-center gap-2">
                  <template v-if="name === '二维码'">
                    <img
                      v-if="item.value"
                      :alt="name"
                      class="h-10 max-w-[140px] object-contain"
                      :src="resolveAssetUrl(item.value)"
                    />
                  </template>
                  <template v-else>
                    <SignaturePicker
                      :value="item.value"
                      @update:value="updateImageValue(item, $event)"
                    />
                  </template>
                </div>
                <template v-if="SHOW_ATTR_DEBUG">
                  <div class="grid grid-cols-4 gap-1">
                    <InputNumber
                      v-model:value="item.width"
                      class="w-full"
                      :min="1"
                      placeholder="宽"
                      size="small"
                    />
                    <InputNumber
                      v-model:value="item.height"
                      class="w-full"
                      :min="1"
                      placeholder="高"
                      size="small"
                    />
                    <InputNumber
                      v-model:value="item.top"
                      class="w-full"
                      :min="0"
                      placeholder="上"
                      size="small"
                    />
                    <InputNumber
                      v-model:value="item.left"
                      class="w-full"
                      :min="0"
                      placeholder="左"
                      size="small"
                    />
                  </div>
                  <div
                    class="text-muted-foreground grid grid-cols-4 text-center text-[10px]"
                  >
                    <span>宽</span>
                    <span>高</span>
                    <span>上</span>
                    <span>左</span>
                  </div>
                  <template v-if="item.type === 'string'">
                    <div class="grid grid-cols-[72px_72px_1fr] gap-1">
                      <InputNumber
                        v-model:value="item.fontSize"
                        class="w-full"
                        :min="12"
                        placeholder="字号"
                        size="small"
                      />
                      <Input
                        v-model:value="item.color"
                        size="small"
                        :style="{ textAlign: 'center' }"
                      />
                      <Input
                        v-model:value="item.fontFamily"
                        placeholder="字体"
                        size="small"
                      />
                    </div>
                    <div
                      class="text-muted-foreground grid grid-cols-[72px_72px_1fr] text-center text-[10px]"
                    >
                      <span>字号</span>
                      <span>颜色</span>
                      <span>字体</span>
                    </div>
                  </template>
                </template>
              </div>
            </FormItem>
          </Form>
        </div>
      </div>
    </div>
  </Page>
</template>

<style>
@page {
  size: A4 portrait;
  margin: 0;
}

@media print {
  html,
  body {
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
  }

  body * {
    visibility: hidden !important;
  }

  .pdf-print-area,
  .pdf-print-area * {
    visibility: visible !important;
  }

  .pdf-print-area {
    position: fixed !important;
    left: 0 !important;
    top: 0 !important;
    width: 2479px !important;
    height: 3508px !important;
    transform: scale(0.32016) !important;
    transform-origin: top left !important;
    box-shadow: none !important;
    background: #fff !important;
  }

  .pdf-overlay {
    outline: none !important;
  }
}
</style>
