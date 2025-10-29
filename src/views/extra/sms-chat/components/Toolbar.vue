<template>
  <div class="toolbar-section">
    <h1>{{ $t('smsChat.pureTitle') }}</h1>
    <div class="toolbar-actions">
      <el-select v-model="innerFilterType" style="width: 120px" @change="emitChange">
        <el-option :label="$t('smsChat.pureReply')" value="5" />
        <el-option :label="$t('smsChat.pureNoReply')" value="2" />
      </el-select>
      <el-button type="primary" @click="$emit('open-batch-send')">{{ $t('smsChat.pureBatchSend') }}</el-button>
    </div>
    <div class="toolbar-stats">
      {{ $t('smsChat.pureUnread') }}: {{ unreadCount }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  myPhoneList?: Array<{label:string; value:string|number}>; // 可留可删，不再使用
  unreadCount: number;
  filterType?: string | number;
}>();
const emit = defineEmits<{
  (e:"change"): void;
  (e:"open-batch-send"): void;
  (e:"update:filter-type", v: string|number): void;
}>();

const innerFilterType = computed({
  get: () => props.filterType ?? "5",
  set: (v) => emit("update:filter-type", v)
});

function emitChange() { emit("change"); }
</script>

<style scoped>
.toolbar-section {
  --brand1:#ff7a59; --brand2:#ffb86b;
  display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;

  /* 美化条 */
  background: linear-gradient(180deg,#fff 0%, #fff7f3 100%);
  border: 1px solid #ffe1d6;
  border-radius: 14px;
  padding: 10px 12px;
  box-shadow: 0 6px 14px rgba(255,122,89,.06);
}
.toolbar-section h1 { margin: 0; white-space: nowrap; flex: 0 0 auto; font-weight: 900; letter-spacing:.2px; }
.toolbar-actions { display: flex; align-items: center; gap: 10px; flex: 1 1 auto; min-width: 260px; }
.toolbar-stats { white-space: nowrap; font-weight: 700; color:#334155; }

/* 选择器外观（Element Plus 内部类用 :deep） */
:deep(.el-select .el-input__wrapper) {
  background:#fff; border-color:#ffd5c3; box-shadow:none;
  border-radius: 10px;
}
/* 渐变主按钮 */
:deep(.el-button.el-button--primary){
  border:none; font-weight:800; border-radius:10px;
  background: linear-gradient(90deg,var(--brand1) 0%,var(--brand2) 100%);
  box-shadow: 0 6px 14px rgba(255,122,89,.22);
}
:deep(.el-button.el-button--primary:hover){ filter:brightness(1.05); }
</style>