<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';

import { Button, Empty, message, Modal } from 'ant-design-vue';
import QRCode from 'qrcode';

interface Props {
  visible: boolean;
  /** 二维码内容（证书查询地址） */
  url?: string;
  /** 证书编号，用于下载文件命名 */
  certNo?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:visible': [value: boolean];
}>();

const canvasRef = ref<HTMLCanvasElement>();
const hasUrl = ref(false);

// 渲染二维码到 canvas
const renderQrCode = async () => {
  hasUrl.value = !!props.url;
  if (!props.url) {
    return;
  }
  await nextTick();
  if (!canvasRef.value) {
    return;
  }
  try {
    await QRCode.toCanvas(canvasRef.value, props.url, {
      width: 240,
      margin: 2,
      errorCorrectionLevel: 'M',
    });
  } catch {
    message.error('二维码生成失败');
  }
};

watch(
  () => props.visible,
  (val) => {
    if (val) {
      renderQrCode();
    }
  },
);

// 下载二维码图片
const handleDownload = () => {
  if (!canvasRef.value || !props.url) {
    return;
  }
  const link = document.createElement('a');
  link.download = `证书二维码_${props.certNo || 'certificate'}.png`;
  link.href = canvasRef.value.toDataURL('image/png');
  link.click();
};

const handleClose = () => {
  emit('update:visible', false);
};
</script>

<template>
  <Modal
    :footer="null"
    :open="visible"
    :width="360"
    title="证书二维码"
    @cancel="handleClose"
  >
    <div class="flex flex-col items-center gap-4 py-4">
      <template v-if="hasUrl">
        <canvas ref="canvasRef"></canvas>
        <div
          class="max-w-full break-all px-4 text-center text-xs text-gray-500"
        >
          {{ url }}
        </div>
        <Button type="primary" @click="handleDownload">
          <template #icon>
            <i class="i-ant-design:download-outlined"></i>
          </template>
          下载二维码
        </Button>
      </template>
      <Empty
        v-else
        description="未配置证书查询URL，请先在「系统配置 - 业务配置」中设置"
      />
    </div>
  </Modal>
</template>
