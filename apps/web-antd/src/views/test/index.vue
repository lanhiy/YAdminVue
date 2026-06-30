<script setup lang="ts">
import { computed } from 'vue';

import { Page } from '@vben/common-ui';

const weekdays = [
  '星期日',
  '星期一',
  '星期二',
  '星期三',
  '星期四',
  '星期五',
  '星期六',
];

const todayWeekday = computed(() => weekdays[new Date().getDay()]);
</script>

<template>
  <Page title="测试菜单">
    <div class="flex min-h-[200px] items-center justify-center text-2xl">
      今天是{{ todayWeekday }}
    </div>
  </Page>
</template>
