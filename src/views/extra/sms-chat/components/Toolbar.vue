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
  display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;
}
.toolbar-section h1 { margin: 0; white-space: nowrap; flex: 0 0 auto; }
.toolbar-actions { display: flex; align-items: center; gap: 10px; flex: 1 1 auto; min-width: 260px; }
.toolbar-stats { white-space: nowrap; }
</style>