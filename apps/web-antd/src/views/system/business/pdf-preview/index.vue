<script setup lang="ts">
import type { OverlayAttr } from './templates';

import { computed, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { useResizeObserver } from '@vueuse/core';
import {
  Button,
  Form,
  FormItem,
  Input,
  InputNumber,
  Upload,
} from 'ant-design-vue';

import { createPdfTemplates } from './templates';

defineOptions({ name: 'SystemBusinessPdfPreview' });

/** 开发时改为 true，显示宽高位置字号等调试属性 */
const SHOW_ATTR_DEBUG = false;

const CANVAS_WIDTH = 2479;
const CANVAS_HEIGHT = 3508;

const templates = reactive(createPdfTemplates());
const selectedKey = ref(templates[0]!.key);
const activeField = ref('');
const stageWrapRef = ref<HTMLElement>();
const wrapWidth = ref(480);

const current = computed(
  () => templates.find((item) => item.key === selectedKey.value) ?? templates[0]!,
);

const attrEntries = computed(() => Object.entries(current.value.attr));

const scale = computed(() => {
  const available = Math.max(wrapWidth.value - 16, 120);
  return Math.min(1, available / CANVAS_WIDTH);
});

useResizeObserver(stageWrapRef, (entries) => {
  wrapWidth.value = entries[0]?.contentRect.width ?? 480;
});

const handleSelect = (key: string) => {
  selectedKey.value = key;
  activeField.value = '';
};

const handleImgUpload = (file: File, item: OverlayAttr) => {
  const reader = new FileReader();
  reader.addEventListener('load', () => {
    item.value = String(reader.result ?? '');
  });
  reader.readAsDataURL(file);
  return false;
};

const handlePrint = () => {
  window.print();
};

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
    title="PDF预览页面"
  >
    <template #extra>
      <Button type="primary" @click="handlePrint">打印</Button>
    </template>
    <div class="flex flex-col gap-3">
      <div class="bg-card flex gap-3 overflow-x-auto rounded p-3">
        <button
          v-for="item in templates"
          :key="item.key"
          class="w-28 shrink-0 cursor-pointer rounded border-2 bg-white p-1 text-left transition"
          :class="
            selectedKey === item.key
              ? 'border-primary shadow-sm'
              : 'border-transparent hover:border-gray-300'
          "
          type="button"
          @click="handleSelect(item.key)"
        >
          <img
            :alt="item.title"
            class="h-36 w-full object-contain object-top"
            :src="item.img"
          />
          <div
            class="mt-1 truncate text-center text-xs"
            :class="selectedKey === item.key ? 'text-primary font-medium' : 'text-muted-foreground'"
          >
            {{ item.title }}
          </div>
        </button>
      </div>

      <div class="flex items-start gap-3">
        <div
          ref="stageWrapRef"
          class="min-w-0 flex-1 rounded bg-[#d9d9d9] p-2"
        >
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
                  :src="item.value"
                />
                <span
                  v-else-if="item.type === 'string'"
                  class="block w-full text-center"
                >
                  {{ item.value }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-card w-[460px] shrink-0 rounded p-4">
          <div class="mb-3 text-base font-medium">{{ current.title }} 属性</div>
          <Form
            :colon="false"
            :label-col="{ style: { width: '8.5em' } }"
            :wrapper-col="{ style: { flex: '1 1 0', minWidth: 0 } }"
            label-align="right"
          >
            <FormItem
              v-for="[name, item] in attrEntries"
              :id="`field-${name}`"
              :key="name"
              class="mb-3"
              :label="name"
            >
              <div class="flex flex-col gap-2" @focusin="activeField = name">
                <Input
                  v-if="item.type === 'string'"
                  v-model:value="item.value"
                  :placeholder="`请输入${name}`"
                  :style="{ textAlign: 'center' }"
                  @focus="activeField = name"
                />
                <div v-else class="flex items-center gap-2">
                  <Upload
                    accept="image/*"
                    :before-upload="(file) => handleImgUpload(file, item)"
                    :show-upload-list="false"
                  >
                    <Button size="small">选择图片</Button>
                  </Upload>
                  <template v-if="SHOW_ATTR_DEBUG">
                    <Button
                      v-if="item.value"
                      size="small"
                      @click="item.value = ''"
                    >
                      清除
                    </Button>
                    <img
                      v-if="item.value"
                      :alt="name"
                      class="h-8 max-w-[120px] object-contain"
                      :src="item.value"
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
                  <div class="text-muted-foreground grid grid-cols-4 text-center text-[10px]">
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
                    <div class="text-muted-foreground grid grid-cols-[72px_72px_1fr] text-center text-[10px]">
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

