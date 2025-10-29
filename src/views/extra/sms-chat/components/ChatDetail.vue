<template>
  <div class="chat-detail">
    <el-card v-if="chat" class="chatbox-v2">
      <!-- Header：两端号码 + 备注/删除 -->
      <div class="chatbox-header">
        <div class="chat-meta">
          <div class="chip">
            <span class="chip-label">{{ $t('smsChat.pureRecipientPhone') }}</span>
            <el-input
              :model-value="'+' + '(' + (chat.callingCode || '') + ')' + (chat.phone || '')"
              class="chip-input"
              readonly
            />
          </div>
          <div class="chip">
            <span class="chip-label">{{ $t('smsChat.pureMyPhone') }}</span>
            <el-input
              :model-value="chat.selfFullPhoneNo || ('+(' + (chat.phoneCallingCode || '') + ')' + (chat.cardNo || ''))"
              class="chip-input"
              readonly
            />
          </div>
          <el-button class="btn-brand" @click="$emit('rename')">{{ $t('smsChat.pureRemark') }}</el-button>
        </div>
        <div class="chat-actions">
          <el-button type="danger" @click="$emit('delete-chat')">{{ $t('buttons.pureDelete') }}</el-button>
        </div>
      </div>

      <!-- 主体消息区 -->
      <div class="chatbox-body">
        <div class="message-list" ref="listRef">
          <div
            v-for="msg in messages"
            :key="msg.id"
            :class="['msg', msg.messageType === 2 ? 'in' : 'out']"
          >
            <div class="meta">
              <span class="time">{{ msg.createTime }}</span>
              <el-tag v-if="msg.messageType !== 2 && msgStatusText(msg)" :type="msgStatusType(msg)">
                {{ msgStatusText(msg) }}
              </el-tag>
            </div>
            <div v-if="msg.media" class="bubble image">
              <img :src="mediaUrl(msg)" alt="" />
            </div>
            <div v-else class="bubble text">{{ msg.message }}</div>
          </div>
        </div>
      </div>

      <!-- 底部输入区 -->
      <div class="chatbox-footer">
        <el-input
          v-model="text"
          type="textarea"
          :autosize="{ minRows: 1, maxRows: 6 }"
          :placeholder="$t('smsChat.pureSendMessage')"
          @keyup.enter.exact.prevent="doSend"
        />
        <div class="actions">
          <el-button class="btn-brand" @click="doSend">{{ $t('smsChat.pureSendMessage') }}</el-button>
          <el-button class="btn-brand" @click="openFile">{{ $t('smsChat.pureSendImage') }}</el-button>
          <input ref="fileRef" class="hidden-file" type="file" accept="image/jpeg,image/png" @change="onPick" />
        </div>
      </div>
    </el-card>

    <el-empty v-else :description="$t('common.pureNoData')" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';

const props = defineProps<{ chat: any | null; messages: any[] }>();
const emit = defineEmits<{
  (e: 'send-text', msg: string): void;
  (e: 'send-image', payload: { base64: string; type: string }): void;
  (e: 'delete-chat'): void;
  (e: 'rename'): void;
}>();

const listRef = ref<HTMLDivElement | null>(null);
const fileRef = ref<HTMLInputElement | null>(null);
const text = ref('');

// 消息变更后滚至底部
watch(
  () => props.messages,
  async () => {
    await nextTick();
    if (listRef.value) listRef.value.scrollTop = listRef.value.scrollHeight;
  },
  { deep: true }
);

function doSend() {
  const msg = (text.value || '').trim();
  if (!msg) return;
  emit('send-text', msg);
  text.value = '';
}

function openFile() {
  fileRef.value?.click();
}

function onPick(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const type = file.name.split('.').pop()?.toLowerCase() || '';
  if (!['png', 'jpg', 'jpeg'].includes(type)) return;
  const reader = new FileReader();
  reader.onload = () => {
    const base64Url = String(reader.result || '');
    const base64 = base64Url.includes(',') ? base64Url.split(',')[1] : base64Url;
    emit('send-image', { base64, type });
  };
  reader.readAsDataURL(file);
  (e.target as HTMLInputElement).value = '';
}

function mediaUrl(msg: any) {
  // 与原版一致：后端返回 message 为文件名
  return `/img/${msg.message}`;
}
function msgStatusText(msg: any) {
  if (msg.messageType !== 1) return '';
  if (!msg.smsSend) return '队列中';
  if (msg.sendReport === 0) return '已发送';
  if (msg.sendReport === -1) return '发送失败';
  if (msg.sendReport === 1) return '已送达';
  return '';
}
function msgStatusType(msg: any) {
  const s = msgStatusText(msg);
  if (s === '发送失败') return 'danger';
  if (s === '已送达') return 'success';
  if (s === '已发送') return 'info';
  return 'warning';
}
</script>

<style scoped>
/* 品牌变量，与 dayliModelChats.html 对齐 */
:root {
  --brand1: #ff7a59;
  --brand2: #ffb86b;
  --muted: #64748b;
  --line: #f2e8e5;
}

/* 容器填满右侧区域 */
.chat-detail {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
}
.chatbox-v2 {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 16px;
  box-shadow: 0 10px 24px rgba(2, 6, 23, 0.06);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Header 渐变 + 胶囊号码 */
.chatbox-header {
  background: linear-gradient(180deg, #ffffff 0%, #fff7f3 100%);
  border-bottom: 1px solid var(--line);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.chat-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;
}
.chat-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: #fff;
  border: 1px solid #ffe1d6;
  border-radius: 999px;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.65) inset;
}
.chip-label {
  color: #8a3b1e;
  font-weight: 800;
  letter-spacing: 0.2px;
  white-space: nowrap;
}
.chip-input {
  width: auto !important;
  min-width: 200px;
  border: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  padding: 0 !important;
  font-weight: 800;
  color: #8a3b1e;
}

/* 主体消息区（纯白底，内部滚动） */
.chatbox-body {
  background: #fff;
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
}
.message-list {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 一条消息 */
.msg {
  max-width: min(92vw, 1200px);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.msg .meta {
  font-size: 12px;
  color: var(--muted);
  display: flex;
  align-items: center;
  gap: 8px;
}
.msg.in {
  align-self: flex-start;
}
.msg.out {
  align-self: flex-end;
}

/* 气泡：入站白底左侧渐变条；出站品牌渐变 */
.bubble {
  padding: 10px 12px;
  border-radius: 14px;
  font-size: 15px;
  word-break: break-word;
  box-shadow: 0 2px 8px rgba(2, 6, 23, 0.06);
}
.msg.in .bubble {
  position: relative;
  background: #fff;
  color: #0f172a;
  border: 1px solid var(--line);
}
.msg.in .bubble::before {
  content: '';
  position: absolute;
  left: -6px;
  top: 8px;
  bottom: 8px;
  width: 6px;
  border-radius: 6px 0 0 6px;
  background: linear-gradient(180deg, var(--brand1), var(--brand2));
  opacity: 0.95;
}
.msg.out .bubble {
  background: linear-gradient(90deg, var(--brand1) 0%, var(--brand2) 100%);
  color: #fff;
  border: 0;
  box-shadow: 0 6px 14px rgba(255, 122, 89, 0.22);
}

/* 图片气泡 */
.bubble.image {
  padding: 6px;
  background: transparent;
  border: 0;
  box-shadow: none;
}
.bubble.image img {
  max-width: 280px;
  max-height: 260px;
  width: auto;
  height: auto;
  border-radius: 12px;
  object-fit: cover;
  box-shadow: 0 6px 18px rgba(2, 6, 23, 0.12);
}

/* 底部输入区：贴底 + 按钮右对齐 */
.chatbox-footer {
  background: #fff;
  border-top: 1px solid var(--line);
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: auto; /* 让输入区贴底 */
}
:deep(.el-textarea__inner) {
  border-radius: 12px;
}
.actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}
.hidden-file {
  display: none;
}

/* 渐变品牌按钮（保持语义用 el-button，同时统一外观） */
.btn-brand {
  border: none !important;
  border-radius: 10px !important;
  font-weight: 800 !important;
  color: #fff !important;
  background: linear-gradient(90deg, var(--brand1) 0%, var(--brand2) 100%) !important;
  box-shadow: 0 6px 14px rgba(255, 122, 89, 0.22) !important;
}
.btn-brand:hover {
  filter: brightness(1.05);
}

/* Element Plus Tag 颜色微调，让状态更清晰 */
:deep(.el-tag.el-tag--danger) {
  background: #fee2e2;
  color: #991b1b;
  border-color: #fecaca;
}
:deep(.el-tag.el-tag--success) {
  background: #dcfce7;
  color: #065f46;
  border-color: #bbf7d0;
}
:deep(.el-tag.el-tag--info) {
  background: #eef2ff;
  color: #3730a3;
  border-color: #c7d2fe;
}
:deep(.el-tag.el-tag--warning) {
  background: #fff7ed;
  color: #9a3412;
  border-color: #fed7aa;
}

/* 窄屏优化 */
@media (max-width: 992px) {
  .chip-input {
    min-width: 160px;
  }
  .bubble.image img {
    max-width: 70vw;
    max-height: 60vh;
  }
  .chatbox-header {
    flex-wrap: wrap;
    gap: 10px;
  }
}
/* =========== 强制覆盖，保证主体占满 + 底部整体贴底 =========== */
/* 保证容器高度可用（如果父容器高度未撑开，仍需外部保证） */
.chat-detail { display: flex !important; flex: 1 1 auto !important; min-width: 0 !important; height: 100% !important; }

/* 卡片：列方向，撑满高度 */
.chatbox-v2 {
  display: flex !important;
  flex-direction: column !important;
  height: 100% !important;
  min-height: 0 !important;
}

/* 主体区：一定占剩余空间并可纵向滚动（右侧显示滚动条） */
.chatbox-body {
  flex: 1 1 auto !important;
  min-height: 0 !important;               /* 重要：避免子元素撑破布局 */
  overflow-y: auto !important;
  overflow-x: hidden !important;
  -webkit-overflow-scrolling: touch !important;
  scrollbar-width: thin !important;
  scrollbar-color: #cbd5e1 transparent !important;
}
.chatbox-body::-webkit-scrollbar { width: 10px; }
.chatbox-body::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 8px; }

/* 底部区：取消所有 sticky/grid/position 导致的不贴底行为，变成单一盒子 */
.chatbox-v2 > .chatbox-footer,
.chatbox-footer {
  position: static !important;
  bottom: auto !important;
  margin-top: auto !important;    /* 关键：让 footer 被推到底部 */
  display: block !important;
  padding: 12px !important;
  background: transparent !important; /* 背景由内部 .composer 决定 */
  border: 0 !important;
  box-shadow: none !important;
}

/* composer：整个输入区的外框（灰边框），把输入框和按钮包成一个整体 */
.composer {
  width: 100% !important;
  box-sizing: border-box !important;
  display: flex !important;
  gap: 12px !important;
  align-items: flex-end !important;
  border: 1px solid #e6eef5 !important;   /* 淡灰边框（不抢眼）*/
  border-radius: 12px !important;
  padding: 10px !important;
  background: #fff !important;
}

/* 确保内部 textarea 看起来没有自己的边框（只显示外层 .composer 的边框） */
:deep(.composer .el-textarea__inner) {
  border: 0 !important;
  box-shadow: none !important;
  padding: 10px !important;
  border-radius: 8px !important;
  min-height: 40px !important;
}

/* 按钮区：始终右对齐，且在同一盒子内 */
.composer-actions,
.footer-actions {
  display: flex !important;
  gap: 10px !important;
  margin-left: auto !important;   /* 关键：把按钮推到右侧 */
  align-items: center !important;
  justify-content: flex-end !important;
}

/* 如果页面上有遗留的 grid/sticky 规则，强制覆盖它们 */
.chatbox-footer[style], .chatbox-v2 .chatbox-footer {
  position: static !important;
  grid-template-columns: none !important;
  display: block !important;
}

/* 按钮视觉不变但小修饰，和外框视觉一致 */
:deep(.chatbox-v2 .el-button--primary),
.btn-brand {
  border: none !important;
  border-radius: 10px !important;
  box-shadow: 0 6px 14px rgba(255,122,89,.18) !important;
}

/* 小屏：按钮换行到下方但仍在外框内 */
@media (max-width: 640px) {
  .composer { flex-direction: column !important; align-items: stretch !important; }
  .composer-actions { margin-left: 0 !important; justify-content: flex-end !important; width: 100%; gap: 8px; }
  :deep(.composer .el-textarea__inner) { width: 100% !important; }
}
</style>