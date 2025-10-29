<template>
  <div class="chat-detail">
    <el-card v-if="chat" class="chatbox-v2">
      <div class="chatbox-header">
        <div class="chat-meta">
          <div class="chip">
            <span class="chip-label">{{ $t('smsChat.pureRecipientPhone') }}</span>
            <el-input :model-value="'+' + '(' + (chat.callingCode || '') + ')' + (chat.phone || '')" class="chip-input" readonly />
          </div>
          <div class="chip">
            <span class="chip-label">{{ $t('smsChat.pureMyPhone') }}</span>
            <el-input :model-value="chat.selfFullPhoneNo || ('+(' + (chat.phoneCallingCode || '') + ')' + (chat.cardNo || ''))" class="chip-input" readonly />
          </div>
          <el-button type="warning" @click="$emit('rename')">{{ $t('smsChat.pureRemark') }}</el-button>
        </div>
        <div class="chat-actions">
          <el-button type="danger" @click="$emit('delete-chat')">{{ $t('buttons.pureDelete') }}</el-button>
        </div>
      </div>

      <div class="chatbox-body">
        <div class="message-list" ref="listRef">
          <template v-for="msg in messages" :key="msg.id">
            <div class="message-in" v-if="msg.messageType === 2">
              <div class="message-meta"><span class="message-time">{{ msg.createTime }}</span></div>
              <div class="message-content" v-if="msg.media"><img :src="mediaUrl(msg)" class="message-img" /></div>
              <div class="message-content" v-else>{{ msg.message }}</div>
            </div>
            <div class="message-out" v-else>
              <div class="message-meta">
                <span class="message-time">{{ msg.createTime }}</span>
                <el-tag :type="msgStatusType(msg)">{{ msgStatusText(msg) }}</el-tag>
              </div>
              <div class="message-content" v-if="msg.media"><img :src="mediaUrl(msg)" class="message-img" /></div>
              <div class="message-content" v-else>{{ msg.message }}</div>
            </div>
          </template>
        </div>
      </div>

      <div class="chatbox-footer">
        <el-input v-model="text" type="textarea" :placeholder="$t('smsChat.pureSendMessage')" @keyup.enter.exact.prevent="doSend" />
        <div class="footer-actions">
          <el-button type="primary" @click="doSend">{{ $t('smsChat.pureSendMessage') }}</el-button>
          <el-button type="primary" @click="$refs.file && ($refs.file as HTMLInputElement).click()">{{ $t('smsChat.pureSendImage') }}</el-button>
          <input ref="file" type="file" accept="image/jpeg,image/png" style="display:none" @change="onPick" />
        </div>
      </div>
    </el-card>
    <el-empty v-else :description="$t('common.pureNoData')" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
const props = defineProps<{ chat: any | null; messages: any[] }>();
const emit = defineEmits<{ (e:"send-text", msg:string): void; (e:"send-image", payload:{base64:string; type:string}): void; (e:"delete-chat"): void; (e:"rename"): void; }>();
const listRef = ref<HTMLDivElement | null>(null);
const text = ref("");

watch(() => props.messages, async () => {
  await nextTick();
  if (listRef.value) listRef.value.scrollTop = listRef.value.scrollHeight;
}, { deep: true });

function doSend() {
  const msg = (text.value || "").trim();
  if (!msg) return;
  emit("send-text", msg);
  text.value = "";
}
function onPick(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const type = file.name.split(".").pop()?.toLowerCase() || "";
  if (!["png","jpg","jpeg"].includes(type)) return;
  const reader = new FileReader();
  reader.onload = () => {
    const base64Url = String(reader.result || "");
    const base64 = base64Url.includes(",") ? base64Url.split(",")[1] : base64Url;
    emit("send-image", { base64, type });
  };
  reader.readAsDataURL(file);
  (e.target as HTMLInputElement).value = "";
}
function mediaUrl(msg:any){ return `/img/${msg.message}`; }
function msgStatusText(msg:any){
  if (msg.messageType !== 1) return "";
  if (!msg.smsSend) return "队列中";
  if (msg.sendReport === 0) return "已发送";
  if (msg.sendReport === -1) return "发送失败";
  if (msg.sendReport === 1) return "已送达";
  return "";
}
function msgStatusType(msg:any){
  const text = msgStatusText(msg);
  if (text === "发送失败") return "danger";
  if (text === "已送达") return "success";
  if (text === "已发送") return "info";
  return "warning";
}
</script>

<style scoped>
.chat-detail { flex: 1 1 auto; min-width: 0; display: flex; }
.chatbox-v2 { border-radius: 16px; box-shadow: 0 10px 24px rgba(2,6,23,.06); overflow: hidden; display: flex; flex-direction: column; height: 100%; }
.chatbox-header { background: linear-gradient(180deg,#fff 0%,#fff7f3 100%); border-bottom: 1px solid #f2e8e5; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.chat-meta { display: flex; align-items: center; gap: 12px; }
.chip { display: inline-flex; align-items: center; gap: 8px; padding: 6px 10px; background: #fff; border: 1px solid #ffe1d6; border-radius: 999px; }
.chip-label { color: #8a3b1e; font-weight: 800; white-space: nowrap; }
.chip-input { width: auto !important; min-width: 120px; border: 0 !important; background: transparent !important; box-shadow: none !important; padding: 0 !important; font-weight: 800; color: #8a3b1e; }

/* 改动：去掉 max-height，改为 flex:1 自适应 + 滚动 */
.chatbox-body { background: #fff; flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: 12px 14px; }
.message-list { display: flex; flex-direction: column; gap: 10px; }

.message-in, .message-out { max-width: 92vw; padding: 10px 12px; border-radius: 14px; font-size: 15px; position: relative; box-shadow: 0 2px 8px rgba(2,6,23,.06); }
.message-in { background: #fff; color: #0f172a; border: 1px solid #f2e8e5; align-self: flex-start; }
.message-out { background: linear-gradient(90deg, #ff7a59 0%, #ffb86b 100%); color: #fff; border: 0; align-self: flex-end; }
.message-meta { font-size: 12px; color: #64748b; margin-bottom: 2px; display: flex; align-items: center; gap: 8px; }
.message-img { max-width: 280px; max-height: 260px; border-radius: 12px; object-fit: cover; }

.chatbox-footer { background: #fff; border-top: 1px solid #f2e8e5; padding: 10px 12px; display: flex; flex-direction: column; gap: 8px; }
.footer-actions { display: flex; gap: 8px; margin-top: 8px; }
</style>