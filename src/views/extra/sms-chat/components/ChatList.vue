<template>
  <div class="chat-list">
    <!-- 新增：列表顶部筛选 -->
    <div class="chat-list-header">
      <el-select v-model="localSelectedMyPhone" style="width: 160px" @change="emitChange">
        <el-option :label="$t('smsChat.pureAllPhones')" :value="-1" />
        <el-option v-for="p in myPhoneList" :key="p.value" :label="p.label" :value="p.value" />
      </el-select>
      <el-input
        v-model="localSearchPhone"
        :placeholder="$t('smsChat.purePhoneNumber')"
        clearable
        style="width: 180px"
        @change="emitChange"
      />
    </div>

    <!-- 滚动区：会话卡片 -->
    <div class="list-scroll">
      <el-card
        v-for="chat in list"
        :key="chat.id"
        class="chat-card"
        @click="$emit('select', chat)"
      >
        <div class="chat-card-row">
          <el-tag type="danger">{{ $t('smsChat.pureUnread') }}: {{ chat.unReadSize || 0 }}</el-tag>
          <el-tag type="success">{{ $t('smsChat.pureSent') }}: {{ chat.sendSize || 0 }}</el-tag>
          <el-tag type="info">{{ $t('smsChat.pureReceived') }}: {{ chat.receiveSize || 0 }}</el-tag>
          <el-button v-if="!(chat.sortIndex > 0)" :title="$t('smsChat.purePin')" link @click.stop="$emit('set-sort', { chat, enable: true })">
            <i class="bi bi-pin-angle-fill"></i>
          </el-button>
          <el-button v-else :title="$t('smsChat.pureUnpin')" link @click.stop="$emit('set-sort', { chat, enable: false })">
            <i class="bi bi-pin"></i>
          </el-button>
        </div>
        <div class="chat-card-row" v-if="chat.addressBookName">
          <el-tag type="warning">{{ chat.addressBookName }}</el-tag>
        </div>
        <div class="chat-card-row phone-row">
          <span class="phone-1">+({{ chat.callingCode }}){{ chat.phone }}</span>
          <span class="phone-2">+({{ chat.phoneCallingCode }}){{ chat.cardNo }}</span>
        </div>
      </el-card>
    </div>

    <el-pagination
      class="chat-pagination"
      background
      layout="prev, pager, next"
      :total="total"
      :page-size="pageSize"
      :current-page="pageNum"
      @current-change="$emit('page-change', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  list: any[];
  pageNum: number;
  pageSize: number;
  total: number;
  myPhoneList: Array<{label:string; value:string|number}>;
  selectedMyPhone: number | string;
  searchPhone: string;
}>();
const emit = defineEmits<{
  (e:"select", chat:any): void;
  (e:"set-sort", payload:{chat:any; enable:boolean}): void;
  (e:"page-change", page:number): void;
  (e:"update:selected-my-phone", v:number|string): void;
  (e:"update:search-phone", v:string): void;
  (e:"change"): void; // 通知父级刷新
}>();

const localSelectedMyPhone = computed({
  get: () => props.selectedMyPhone,
  set: (v) => emit("update:selected-my-phone", v)
});
const localSearchPhone = computed({
  get: () => props.searchPhone,
  set: (v) => emit("update:search-phone", v)
});

function emitChange() {
  emit("change");
}
</script>

<style scoped>
.chat-list {
  flex: 0 0 340px;
  width: 340px;
  min-width: 300px;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  height: 100%;            /* 撑满父容器高度 */
  min-height: 0;
}
.chat-list-header {
  display: flex; align-items: center; gap: 10px; margin-bottom: 6px;
}
.list-scroll {
  flex: 1 1 auto; min-height: 0; overflow-y: auto;  /* 列表滚动 */
}
.chat-card { margin-bottom: 10px; cursor: pointer; border-radius: 12px; box-shadow: 0 6px 16px rgba(2,6,23,.06); border: 1px solid #f3f4f6; }
.chat-card-row { display: flex; gap: 8px; align-items: center; margin-bottom: 2px; }
.phone-row { font-family: monospace; color: #334155; font-size: 15px; gap: 8px; }
.chat-pagination { margin-top: 10px; align-self: flex-end; }
</style>