<template>
  <div class="page-content sms-chat-page">
    <div class="toolbar-section">
      <h1>{{ $t('smsChat.pureTitle') }}</h1>
      <div class="toolbar-actions">
        <el-select v-model="filterType" style="width: 120px" @change="reloadChats">
          <el-option :label="$t('smsChat.pureReply')" value="5" />
          <el-option :label="$t('smsChat.pureNoReply')" value="2" />
        </el-select>
        <el-input v-model="searchPhone" :placeholder="$t('smsChat.purePhoneNumber')" clearable style="width: 180px" @change="reloadChats" />
        <el-select v-model="selectedMyPhone" style="width: 160px" @change="reloadChats">
          <el-option :label="$t('smsChat.pureAllPhones')" :value="-1" />
          <el-option v-for="p in myPhoneList" :key="p.value" :label="p.label" :value="p.value" />
        </el-select>
        <el-button type="primary" @click="openBatchSend">{{ $t('smsChat.pureBatchSend') }}</el-button>
      </div>
      <div class="toolbar-stats">
        {{ $t('smsChat.pureUnread') }}: {{ unreadCount }}
      </div>
    </div>

    <div class="chat-main">
      <div class="chat-list">
        <div class="chat-cards-container">
          <el-card v-for="chat in chatList" :key="chat.id" class="chat-card" :class="{ selected: chat.id === selectedChat?.id }" @click="selectChat(chat)">
            <div class="chat-card-row">
              <el-tag type="danger">{{ $t('smsChat.pureUnread') }}: {{ chat.unReadSize || 0 }}</el-tag>
              <el-tag type="success">{{ $t('smsChat.pureSent') }}: {{ chat.sendSize || 0 }}</el-tag>
              <el-tag type="info">{{ $t('smsChat.pureReceived') }}: {{ chat.receiveSize || 0 }}</el-tag>
              <el-button v-if="!(chat.sortIndex > 0)" :title="$t('smsChat.purePin')" link @click.stop="setSort(chat, true)">
                <i class="bi bi-pin-angle-fill"></i>
              </el-button>
              <el-button v-else :title="$t('smsChat.pureUnpin')" link @click.stop="setSort(chat, false)">
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
          :total="totalChat"
          :page-size="pageSize"
          :current-page="pageNum"
          @current-change="handleChatPageChange"
        />
      </div>

      <div class="chat-detail">
        <el-card v-if="selectedChat" class="chatbox-v2">
          <div class="chatbox-header">
            <div class="chat-meta">
              <div class="chip">
                <span class="chip-label">{{ $t('smsChat.pureRecipientPhone') }}</span>
                <el-input :model-value="'+' + '(' + (selectedChat.callingCode || '') + ')' + (selectedChat.phone || '')" class="chip-input" readonly />
              </div>
              <div class="chip">
                <span class="chip-label">{{ $t('smsChat.pureMyPhone') }}</span>
                <el-input :model-value="selectedChat.selfFullPhoneNo || ('+(' + (selectedChat.phoneCallingCode || '') + ')' + (selectedChat.cardNo || ''))" class="chip-input" readonly />
              </div>
              <el-button type="warning" @click="openRename">{{ $t('smsChat.pureRemark') }}</el-button>
            </div>
            <div class="chat-actions">
              <el-button type="danger" @click="confirmDelete">{{ $t('buttons.pureDelete') }}</el-button>
            </div>
          </div>

          <div class="chatbox-body">
            <div class="message-list" ref="messageListRef">
              <template v-for="msg in messageList" :key="msg.id">
                <div class="message-in" v-if="msg.messageType === 2">
                  <div class="message-meta">
                    <span class="message-time">{{ msg.createTime }}</span>
                  </div>
                  <div class="message-content" v-if="msg.media">
                    <img :src="mediaUrl(msg)" class="message-img" />
                  </div>
                  <div class="message-content" v-else>{{ msg.message }}</div>
                </div>

                <div class="message-out" v-else>
                  <div class="message-meta">
                    <span class="message-time">{{ msg.createTime }}</span>
                    <el-tag :type="msgStatusType(msg)">{{ msgStatusText(msg) }}</el-tag>
                  </div>
                  <div class="message-content" v-if="msg.media">
                    <img :src="mediaUrl(msg)" class="message-img" />
                  </div>
                  <div class="message-content" v-else>{{ msg.message }}</div>
                </div>
              </template>
            </div>
          </div>

          <div class="chatbox-footer">
            <el-input
              v-model="messageInput"
              type="textarea"
              :placeholder="$t('smsChat.pureSendMessage')"
              @keyup.enter.exact.prevent="sendText"
            />
            <div class="footer-actions">
              <el-button type="primary" @click="sendText">{{ $t('smsChat.pureSendMessage') }}</el-button>
              <el-button type="primary" @click="triggerImage">{{ $t('smsChat.pureSendImage') }}</el-button>
            </div>
          </div>
        </el-card>
        <el-empty v-else :description="$t('common.pureNoData')" />
      </div>
    </div>

    <!-- 批量发送 -->
    <el-dialog v-model="batchSendDialogVisible" :title="$t('smsChat.pureBatchSend')" width="720px">
      <el-form label-width="120px">
        <el-form-item :label="$t('smsChat.pureBatchContent')">
          <el-input v-model="batchSendContent" type="textarea" rows="4" />
        </el-form-item>
        <el-form-item :label="$t('smsChat.pureBatchPhones')">
          <el-input v-model="batchSendPhones" type="textarea" rows="8" placeholder="每行一个号码" />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="batchSendEnableSplit">{{ $t('smsChat.pureEnableSplit') }}</el-checkbox>
          <span style="margin-left:12px">{{ $t('smsChat.pureCurrentPhoneCount') }}: {{ phoneCount }}</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchSendDialogVisible=false">{{ $t('buttons.pureCancel') }}</el-button>
        <el-button type="primary" @click="doBatchSend">{{ $t('buttons.pureConfirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- 备注 -->
    <el-dialog v-model="renameDialogVisible" :title="$t('smsChat.pureRemark')" width="400px">
      <el-input v-model="renameInput" />
      <template #footer>
        <el-button @click="renameDialogVisible=false">{{ $t('buttons.pureCancel') }}</el-button>
        <el-button type="primary" @click="doRename">{{ $t('buttons.pureConfirm') }}</el-button>
      </template>
    </el-dialog>

    <input ref="imageInputRef" type="file" accept="image/jpeg,image/png" style="display:none" @change="sendImage" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  apiGetChatList,
  apiGetMessages,
  apiSendText,
  apiSendImage,
  apiSetSortIndex,
  apiDeleteChat,
  apiUpdateName,
  apiBatchSendText,
  apiMergeStatus
} from "@/api/smsChat";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const myPhoneList = ref<Array<{label:string; value:string|number}>>([]);
const selectedMyPhone = ref<number | string>(-1);
const filterType = ref<string | number>("5");
const searchPhone = ref("");

const chatList = ref<any[]>([]);
const totalChat = ref(0);
const pageNum = ref(1);
const pageSize = ref(50);

const selectedChat = ref<any | null>(null);
const messageList = ref<any[]>([]);
const messageInput = ref("");
const messageListRef = ref<HTMLDivElement | null>(null);

const batchSendDialogVisible = ref(false);
const batchSendContent = ref("");
const batchSendPhones = ref("");
const batchSendEnableSplit = ref(true);
const phoneCount = computed(() => (batchSendPhones.value || "").split(/\r?\n/).filter(s => s.trim()).length);

const renameDialogVisible = ref(false);
const renameInput = ref("");

const imageInputRef = ref<HTMLInputElement | null>(null);

const unreadCount = ref(0);
let statusTimer: any = null;

/* 工具 */
function mediaUrl(msg: any) {
  return `/img/${msg.message}`;
}
function msgStatusText(msg: any) {
  if (msg.messageType !== 1) return "";
  if (!msg.smsSend) return "队列中";
  if (msg.sendReport === 0) return "已发送";
  if (msg.sendReport === -1) return "发送失败";
  if (msg.sendReport === 1) return "已送达";
  return "";
}
function msgStatusType(msg: any) {
  const text = msgStatusText(msg);
  if (text === "发送失败") return "danger";
  if (text === "已送达") return "success";
  if (text === "已发送") return "info";
  return "warning";
}

/* 列表 */
async function reloadChats() {
  pageNum.value = 1;
  await loadChatList();
}
async function loadChatList() {
  const res: any = await apiGetChatList({
    phoneId: selectedMyPhone.value,
    pageNum: pageNum.value,
    pageSize: pageSize.value,
    searchPhone: searchPhone.value,
    selectTypes: filterType.value
  });
  if (res?.scode === 0) {
    chatList.value = res.data?.content || [];
    totalChat.value = res.data?.totalElements || 0;
    unreadCount.value = chatList.value.reduce((s: number, c: any) => s + (c.unReadSize || 0), 0);
    if (selectedChat.value && !chatList.value.find((c: any) => c.id === selectedChat.value.id)) {
      selectedChat.value = null;
      messageList.value = [];
    }
  } else {
    ElMessage.error(res?.data || t("common.pureLoadFailed"));
  }
}
function handleChatPageChange(p: number) {
  pageNum.value = p;
  loadChatList();
}

/* 选择会话 & 拉消息 */
async function selectChat(chat: any) {
  selectedChat.value = chat;
  await loadMessages(chat.id);
}
async function loadMessages(chatId: number | string) {
  const res: any = await apiGetMessages(chatId);
  if (res?.scode === 0) {
    messageList.value = (res.data?.list || []).reverse();
    await nextTick();
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight;
    }
  } else {
    ElMessage.error(res?.data || t("common.pureLoadFailed"));
  }
}

/* 发送文字 */
async function sendText() {
  const msg = (messageInput.value || "").trim();
  if (!msg) {
    ElMessage.warning(t("smsChat.pureSendMessageEmpty"));
    return;
  }
  if (!selectedChat.value) return;
  const res: any = await apiSendText({ chatId: selectedChat.value.id, message: msg });
  if (res?.scode === 0) {
    messageInput.value = "";
    await loadMessages(selectedChat.value.id);
    await loadChatList();
  } else {
    ElMessage.error(res?.data || t("common.pureLoadFailed"));
  }
}

/* 发送图片 */
function triggerImage() {
  imageInputRef.value?.click();
}
async function sendImage(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file || !selectedChat.value) return;
  const type = file.name.split(".").pop()?.toLowerCase() || "";
  if (!["png", "jpg", "jpeg"].includes(type)) {
    ElMessage.error("只支持png/jpg/jpeg");
    return;
  }
  const reader = new FileReader();
  reader.onload = async () => {
    const base64Url = String(reader.result || "");
    const base64 = base64Url.includes(",") ? base64Url.split(",")[1] : base64Url;
    const res: any = await apiSendImage({ chatId: selectedChat.value.id, imageBase64: base64, fileType: type });
    if (res?.scode === 0) {
      await loadMessages(selectedChat.value.id);
      await loadChatList();
    } else {
      ElMessage.error(res?.data || t("common.pureLoadFailed"));
    }
  };
  reader.readAsDataURL(file);
  (e.target as HTMLInputElement).value = "";
}

/* 置顶/取消置顶 */
async function setSort(chat: any, enable: boolean) {
  const res: any = await apiSetSortIndex({ chatId: chat.id, enable });
  if (res?.scode === 0) {
    await loadChatList();
  } else {
    ElMessage.error(res?.data || t("common.pureLoadFailed"));
  }
}

/* 删除会话 */
function confirmDelete() {
  if (!selectedChat.value) return;
  ElMessageBox.confirm(t("smsChat.pureDeleteConfirm"), t("buttons.pureDelete"), { type: "warning" })
    .then(async () => {
      const res: any = await apiDeleteChat(selectedChat.value.id);
      if (res?.scode === 0) {
        selectedChat.value = null;
        messageList.value = [];
        await loadChatList();
        ElMessage.success(t("common.pureSuccess"));
      } else {
        ElMessage.error(res?.data || t("common.pureLoadFailed"));
      }
    })
    .catch(() => {});
}

/* 备注 */
function openRename() {
  if (!selectedChat.value) return;
  renameInput.value = selectedChat.value.addressBookName || "";
  renameDialogVisible.value = true;
}
async function doRename() {
  const name = (renameInput.value || "").trim();
  if (!name) {
    ElMessage.warning(t("smsChat.pureRemarkEmpty"));
    return;
  }
  if (!selectedChat.value) return;
  const res: any = await apiUpdateName({ chatId: selectedChat.value.id, name });
  if (res?.scode === 0) {
    selectedChat.value.addressBookName = name;
    await loadChatList();
    renameDialogVisible.value = false;
    ElMessage.success(t("common.pureSuccess"));
  } else {
    ElMessage.error(res?.data || t("common.pureLoadFailed"));
  }
}

/* 批量发送 */
function openBatchSend() {
  batchSendContent.value = "";
  batchSendPhones.value = "";
  batchSendEnableSplit.value = true;
  batchSendDialogVisible.value = true;
}
async function doBatchSend() {
  const content = (batchSendContent.value || "").trim();
  const phones = (batchSendPhones.value || "").trim();
  if (!content || !phones) {
    ElMessage.warning(t("smsChat.pureBatchSendEmpty"));
    return;
  }
  const res: any = await apiBatchSendText({
    batchPhone: phones,
    batchContent: content,
    enableSplit: batchSendEnableSplit.value,
    templateId: undefined
  });
  if (res?.scode === 0 || res?.data === 1000) {
    ElMessage.success(t("common.pureSuccess"));
    batchSendDialogVisible.value = false;
  } else {
    ElMessage.error(res?.data || t("common.pureLoadFailed"));
  }
}

/* 合并状态轮询（老版每5秒） */
function collectMessageIdsNeedingStatus(): string {
  const ids = messageList.value
    .filter((m: any) => m.messageType === 1 && (!m.smsSend || m.sendReport === 0))
    .map((m: any) => m.id);
  return ids.join(",");
}
function collectChatIdsOnList(): string {
  return chatList.value.map((c: any) => c.id).join(",");
}
function currentChatUnreadParam(): [string | number, string | number] | ["",""] {
  if (!selectedChat.value || messageList.value.length === 0) return ["",""];
  const maxId = Math.max(...messageList.value.map((m:any)=>m.id || 0));
  return [selectedChat.value.id, maxId];
}
async function tickStatus() {
  const [cid, lastId] = currentChatUnreadParam();
  const res: any = await apiMergeStatus({
    listMessageStatusAllId: collectMessageIdsNeedingStatus(),
    listAllStatusAllId: collectChatIdsOnList(),
    unReadMessageChatId: cid || undefined,
    unReadMessageLastId: lastId || undefined
  });
  if (res?.data) {
    const statusList = res.data.listAllStatusResponse?.status || [];
    statusList.forEach((c: any) => {
      const it = chatList.value.find((x: any) => x.id === c.id);
      if (it) {
        it.unReadSize = c.unReadSize;
        it.sendSize = c.sendSize;
        it.receiveSize = c.receiveSize;
        it.addressBookName = c.addressBookName;
        it.sortIndex = c.sortIndex;
      }
    });
    const unreadChats = res.data.listAllStatusResponse?.unReadChats || [];
    unreadChats.forEach((uc: any) => {
      if (!chatList.value.find((x:any)=>x.id===uc.id)) chatList.value.unshift(uc);
    });
    const msgStatusList = res.data.listMessageStatusResponse || [];
    msgStatusList.forEach((s: any) => {
      const m = messageList.value.find((x:any)=>x.id===s.id);
      if (m) {
        m.messageType = 1;
        m.smsSend = s.smsSend ?? m.smsSend;
        m.sendReport = s.sendReport ?? m.sendReport;
      }
    });
    const newMsgs = (res.data.unReadMessageResponse || []).reverse();
    if (selectedChat.value) {
      newMsgs.forEach((nm:any) => {
        if (nm.chatId === selectedChat.value.id && !messageList.value.find((x:any)=>x.id===nm.id)) {
          messageList.value.push(nm);
        }
      });
    }
    unreadCount.value = chatList.value.reduce((s: number, c: any) => s + (c.unReadSize || 0), 0);
  }
}

/* 初始化 */
onMounted(async () => {
  await loadChatList();
  statusTimer = setInterval(tickStatus, 5000);
});
onBeforeUnmount(() => {
  if (statusTimer) clearInterval(statusTimer);
});
</script>

<style scoped>
.page-content { padding: 24px; }
.sms-chat-page { 
  background: #fff; 
  height: calc(100vh - 48px); /* 减去 padding */
  padding: 32px;
  display: flex;
  flex-direction: column;
}

/* 工具条修复：标题不换行，不被压缩；actions 可折行 */
.toolbar-section {
  display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;
  flex-shrink: 0; /* 防止工具栏被压缩 */
}
.toolbar-section h1 {
  margin: 0;
  white-space: nowrap;               /* 防止逐字换行 */
  writing-mode: horizontal-tb !important; /* 强制横排，避免外部样式影响 */
  text-orientation: mixed;
  flex: 0 0 auto;                   /* 不收缩 */
}
.toolbar-actions { display: flex; align-items: center; gap: 10px; flex: 1 1 auto; min-width: 260px; }

/* 聊天主区域：占据剩余高度 */
.chat-main { 
  display: flex; 
  gap: 18px; 
  align-items: stretch;
  flex: 1 1 auto;
  min-height: 0; /* 允许内部滚动 */
}

/* 左侧列表：固定宽度，填充高度，分页固定在底部 */
.chat-list { 
  flex: 0 0 340px; 
  width: 340px; 
  min-width: 300px; 
  max-width: 420px; 
  display: flex; 
  flex-direction: column;
  height: 100%; /* 填充父容器高度 */
  overflow: hidden; /* 防止溢出 */
}

/* 聊天卡片容器：可滚动区域 */
.chat-cards-container {
  flex: 1 1 auto;
  overflow-y: auto;
  min-height: 0;
  padding-bottom: 10px;
}

.chat-card { 
  margin-bottom: 10px; 
  cursor: pointer; 
  border-radius: 12px; 
  box-shadow: 0 6px 16px rgba(2,6,23,.06); 
  border: 1px solid #f3f4f6; 
}
.chat-card.selected { border: 2px solid #ff7a59; background: #fff7f3; }
.chat-card-row { display: flex; gap: 8px; align-items: center; margin-bottom: 2px; }
.phone-row { font-family: monospace; color: #334155; font-size: 15px; gap: 8px; }

/* 分页固定在底部 */
.chat-pagination { 
  margin-top: 10px; 
  align-self: center;
  flex-shrink: 0; /* 防止分页被压缩 */
}

/* 右侧自适应 */
.chat-detail { flex: 1 1 auto; min-width: 0; height: 100%; }

/* 消息区样式（原样保留） */
.chatbox-v2 { 
  border-radius: 16px; 
  box-shadow: 0 10px 24px rgba(2,6,23,.06); 
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.chatbox-header { 
  background: linear-gradient(180deg,#fff 0%,#fff7f3 100%); 
  border-bottom: 1px solid #f2e8e5; 
  padding: 12px 16px; 
  display: flex; 
  align-items: center; 
  justify-content: space-between; 
  gap: 12px;
  flex-shrink: 0;
}
.chat-meta { display: flex; align-items: center; gap: 12px; }
.chip { display: inline-flex; align-items: center; gap: 8px; padding: 6px 10px; background: #fff; border: 1px solid #ffe1d6; border-radius: 999px; }
.chip-label { color: #8a3b1e; font-weight: 800; white-space: nowrap; }
.chip-input { width: auto !important; min-width: 120px; border: 0 !important; background: transparent !important; box-shadow: none !important; padding: 0 !important; font-weight: 800; color: #8a3b1e; }
.chatbox-body { 
  background: #fff; 
  flex: 1 1 auto;
  overflow-y: auto; 
  padding: 12px 14px;
  min-height: 0;
}
.message-list { display: flex; flex-direction: column; gap: 10px; }
.message-in, .message-out { max-width: 92vw; padding: 10px 12px; border-radius: 14px; font-size: 15px; position: relative; box-shadow: 0 2px 8px rgba(2,6,23,.06); }
.message-in { background: #fff; color: #0f172a; border: 1px solid #f2e8e5; align-self: flex-start; }
.message-out { background: linear-gradient(90deg, #ff7a59 0%, #ffb86b 100%); color: #fff; border: 0; align-self: flex-end; }
.message-meta { font-size: 12px; color: #64748b; margin-bottom: 2px; display: flex; align-items: center; gap: 8px; }
.message-img { max-width: 280px; max-height: 260px; border-radius: 12px; object-fit: cover; }
.chatbox-footer { 
  background: #fff; 
  border-top: 1px solid #f2e8e5; 
  padding: 10px 12px; 
  display: flex; 
  flex-direction: column; 
  gap: 8px;
  flex-shrink: 0;
}
.footer-actions { display: flex; gap: 8px; margin-top: 8px; }
</style>