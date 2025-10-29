<template>
  <div class="page-content unsent-yesterday-page">
    <h1>{{ $t('menus.unsentYesterday') }}</h1>
    <div class="toolbar-section mb-4" style="display: flex; align-items: center; justify-content: space-between;">
      <h2 class="unsent-count">
        {{ $t('unsentYesterday.pureTitle') }}: {{ count }}
      </h2>
      <el-button type="primary" @click="downloadUnsent">{{ $t('buttons.pureRefresh') }}</el-button>
    </div>
    <el-card class="mt-4">
      <div v-if="loading">{{ $t('common.pureLoadingData') }}</div>
      <div v-else-if="unsentList">
        <pre style="white-space: pre-wrap; word-break: break-all;">{{ unsentList }}</pre>
      </div>
      <div v-else style="color:#aaa;">{{ $t('common.pureNoData') }}</div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const count = ref(0);
const unsentList = ref('');
const loading = ref(false);

// 请求昨日未发送数量
async function fetchUnsentCount() {
  try {
    const res = await fetch('/statistics/unsend', { method: 'POST' });
    const data = await res.json();
    if (data.scode === 0) {
      count.value = data.data;
    } else {
      ElMessage.error(t('common.pureLoadFailed'));
    }
  } catch (error) {
    ElMessage.error(t('common.pureLoadFailed'));
  }
}

// 下载未发送列表
async function downloadUnsent() {
  loading.value = true;
  unsentList.value = '';
  try {
    const res = await fetch('/statistics/downUnsend', { method: 'POST' });
    const data = await res.json();
    if (data.scode === 0) {
      unsentList.value = data.data;
    } else {
      ElMessage.error(t('common.pureLoadFailed'));
    }
  } catch (error) {
    ElMessage.error(t('common.pureLoadFailed'));
  } finally {
    loading.value = false;
  }
}

onMounted(fetchUnsentCount);
</script>

<style scoped>
.page-content {
  padding: 24px;
}
.unsent-yesterday-page {
  background: #fff;
  min-height: 100vh;
  padding: 32px;
}
.toolbar-section {
  margin-bottom: 16px;
}
.unsent-count {
  font-size: 20px;
  font-weight: bold;
  color: #475569;
}
.el-card {
  margin-top: 16px;
  border-radius: 12px;
  background: #fafcff;
  box-shadow: 0 8px 24px rgba(2, 6, 23, 0.06);
  min-height: 180px;
}
</style>