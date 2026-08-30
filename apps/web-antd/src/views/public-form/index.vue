<script setup lang="ts">
import type { CertificateResult } from '#/api';

import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { getCertificateResultApi } from '#/api';

defineOptions({ name: 'PublicForm' });

const FIELDS: { key: keyof CertificateResult; label: string }[] = [
  { key: 'certificate_no', label: '证书编号' },
  { key: 'unit_name', label: '单位名称' },
  { key: 'instrument_name', label: '器具名称' },
  { key: 'model', label: '型号规格' },
  { key: 'instrument_no', label: '出厂编号' },
  { key: 'manufacturer', label: '制造厂商' },
  { key: 'check_date', label: '校检日期' },
  { key: 'valid_until', label: '有效期' },
  { key: 'check_unit', label: '校检单位' },
];

const route = useRoute();
const loaded = ref(false);
const result = ref<CertificateResult | null>(null);
const queryMessage = ref('');

const token = computed(() => {
  const param = route.params.token;
  const fromPath = Array.isArray(param) ? param[0] : param;
  const fromQuery = route.query.token;
  const query = Array.isArray(fromQuery) ? fromQuery[0] : fromQuery;
  return String(fromPath || query || '').trim();
});

const hasResult = computed(() => {
  if (!result.value) return false;
  return FIELDS.some((field) => String(result.value?.[field.key] ?? '').trim());
});

function displayValue(key: keyof CertificateResult) {
  return String(result.value?.[key] ?? '');
}

async function loadResult() {
  loaded.value = false;
  result.value = null;
  queryMessage.value = '';
  if (!token.value) {
    queryMessage.value = '证书查询链接无效';
    loaded.value = true;
    return;
  }
  try {
    result.value = await getCertificateResultApi(token.value);
  } catch (error: any) {
    result.value = null;
    queryMessage.value = error?.message || '未查询到符合条件的证书';
  } finally {
    loaded.value = true;
  }
}

watch(token, loadResult, { immediate: true });
</script>

<template>
  <div class="cert-query-page">
    <div class="bt">
      <span class="bar-wrap"><span class="bar"></span></span>
      <span class="span1">
        <h4>证书查询结果</h4>
        {{
          loaded
            ? hasResult
              ? '查询结果如下：'
              : queryMessage
            : '正在查询证书...'
        }}
      </span>
    </div>

    <div v-if="loaded && hasResult" class="tab">
      <table cellpadding="0" cellspacing="2">
        <tbody>
          <tr v-for="field in FIELDS" :key="field.key" class="ta">
            <td class="td1">{{ field.label }}</td>
            <td class="td2">{{ displayValue(field.key) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else-if="loaded" class="tab">
      <table cellpadding="0" cellspacing="2">
        <tbody>
          <tr class="ta">
            <td class="td2 empty">
              {{ queryMessage || '未查询到符合条件的证书' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="footer" :class="hasResult ? 'footer-full' : 'footer-null'">
      技术支持：南京明德软件有限公司
    </div>
  </div>
</template>

<style scoped>
.cert-query-page {
  box-sizing: border-box;
  min-height: 100vh;
  padding: 1.2em 0 2em;
  color-scheme: light;
  background: #fff;
  font-family: 'Microsoft YaHei', '微软雅黑', sans-serif;
}

.bt {
  position: relative;
  display: flex;
  width: 95%;
  margin: 0 auto;
}

.bar-wrap {
  flex-shrink: 0;
  padding-top: 0.15em;
}

.bar {
  display: block;
  width: 0.5em;
  height: 2em;
  background: #313131;
  border-radius: 1em;
}

.span1 {
  position: relative;
  top: 0.15em;
  padding-left: 0.5em;
  color: #5d5d5d;
  font-family: 'Microsoft YaHei', '微软雅黑', sans-serif;
}

.span1 h4 {
  margin: 0 0 0.15em;
  color: #000;
  font-size: 1.17em;
  font-weight: 700;
}

.tab {
  position: relative;
  width: 95%;
  margin: 1.5em auto 0;
  word-wrap: break-word;
  word-break: break-all;
}

.tab table {
  width: 100%;
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 2px;
}

.ta {
  width: 100%;
  height: 3.2em;
  color: #fff;
  font-family: 'Microsoft YaHei', '微软雅黑', sans-serif;
  font-size: 1.1em;
  text-align: center;
}

.td1,
.td2 {
  box-sizing: border-box;
  border: none;
  vertical-align: middle;
}

.td1 {
  position: relative;
  width: 30%;
  padding: 0.8em;
  background: #2e45a0;
}

.td2 {
  position: relative;
  width: 70%;
  padding: 0.8em;
  color: #474747;
  background: #f4f4f4;
}

.td2.empty {
  width: 100%;
}

.footer {
  width: 100%;
  padding: 1.5em 0 0.6em;
  color: #333;
  font-size: 0.8em;
  text-align: center;
}

.footer-full {
  position: relative;
}

.footer-null {
  position: fixed;
  bottom: 10px;
  left: 0;
}
</style>
