<script setup lang="ts">
import type { SignatureOption } from '#/api';

import { computed, ref } from 'vue';

import { Button, Empty, message, Modal, Spin } from 'ant-design-vue';

import { getEnabledSignaturesApi } from '#/api';
import { resolveAssetUrl } from '#/utils/asset';

interface Props {
  /** 当前选中的签名图片地址 */
  value?: string;
  /** 占位提示 */
  placeholder?: string;
}

const props = withDefaults(defineProps<Props>(), {
  value: '',
  placeholder: '未选择签名',
});

const emit = defineEmits<{
  'update:value': [value: string];
}>();

const pickerVisible = ref(false);
const loading = ref(false);
const signatures = ref<SignatureOption[]>([]);

const previewUrl = computed(() => resolveAssetUrl(props.value));

/** 打开选择器并拉取签名库 */
const handleOpen = async () => {
  pickerVisible.value = true;

  if (signatures.value.length > 0) {
    return;
  }

  try {
    loading.value = true;
    signatures.value = await getEnabledSignaturesApi();
  } catch (error: any) {
    message.error(error.message || '加载签名库失败');
  } finally {
    loading.value = false;
  }
};

/** 选中一条签名，只取图片地址 */
const handlePick = (item: SignatureOption) => {
  emit('update:value', item.image_url);
  pickerVisible.value = false;
};

/** 清空当前签名 */
const handleClear = () => {
  emit('update:value', '');
};
</script>

<template>
  <div class="flex items-center gap-3">
    <!-- 当前签名预览 -->
    <div
      class="flex h-16 w-32 shrink-0 items-center justify-center overflow-hidden rounded border border-dashed border-gray-300 bg-gray-50"
    >
      <img
        v-if="previewUrl"
        :src="previewUrl"
        alt="签名"
        class="h-full w-full object-contain"
      />
      <span v-else class="text-xs text-gray-400">{{ placeholder }}</span>
    </div>

    <div class="flex flex-col gap-1">
      <Button size="small" type="link" @click="handleOpen">
        {{ value ? '更换签名' : '从签名库选择' }}
      </Button>
      <Button v-if="value" danger size="small" type="link" @click="handleClear">
        清除
      </Button>
    </div>

    <!-- 签名库选择弹窗 -->
    <Modal
      :footer="null"
      :open="pickerVisible"
      title="选择签名"
      :width="720"
      @cancel="pickerVisible = false"
    >
      <Spin :spinning="loading">
        <Empty
          v-if="!loading && signatures.length === 0"
          description="签名库为空，请先到「签名管理」新增签名"
        />
        <div v-else class="grid max-h-96 grid-cols-3 gap-3 overflow-y-auto p-1">
          <div
            v-for="item in signatures"
            :key="item.id"
            class="cursor-pointer rounded border p-2 transition-colors hover:border-blue-500"
            :class="
              item.image_url === value ? 'border-blue-500' : 'border-gray-200'
            "
            @click="handlePick(item)"
          >
            <div
              class="flex h-20 items-center justify-center overflow-hidden bg-gray-50"
            >
              <img
                :src="resolveAssetUrl(item.image_url)"
                :alt="item.name"
                class="h-full w-full object-contain"
              />
            </div>
            <div class="mt-1 truncate text-center text-sm">{{ item.name }}</div>
          </div>
        </div>
      </Spin>
    </Modal>
  </div>
</template>
