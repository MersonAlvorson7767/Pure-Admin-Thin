<template>
    <div class="page-content sms-chat-page">
        <!-- 顶部工具条 -->
        <Toolbar
            :my-phone-list="myPhoneList"
            v-model:filter-type="filterType"
            v-model:selected-my-phone="selectedMyPhone"
            v-model:search-phone="searchPhone"
            :unread-count="unreadCount"
            @open-batch-send="openBatchSend"
            @change="reloadChats"
        />

        <div class="chat-main">
            <!-- 左侧列表 -->
            <ChatList
                :list="chatList"
                :page-num="pageNum"
                :page-size="pageSize"
                :total="totalChat"
                :my-phone-list="myPhoneList"
                v-model:selected-my-phone="selectedMyPhone"
                v-model:search-phone="searchPhone"
                @change="reloadChats"
                @select="selectChat"
                @set-sort="setSort"
                @page-change="handleChatPageChange"
            />

            <!-- 右侧聊天窗 -->
            <ChatDetail :chat="selectedChat" :messages="messageList" @send-text="sendText" @send-image="sendImage" @delete-chat="confirmDelete" @rename="openRename" />
        </div>

        <!-- 群发短信弹窗 -->
        <BatchSendDialog v-model:visible="batchSendDialogVisible" @sent="onBatchSent" />

        <!-- 重命名 -->
        <el-dialog v-model="renameDialogVisible" :title="t('smsChat.pureRemark')" width="400px">
            <el-input v-model="renameInput" />
            <template #footer>
                <el-button @click="renameDialogVisible = false">{{ t('buttons.pureCancel') }}</el-button>
                <el-button type="primary" @click="doRename">{{ t('buttons.pureConfirm') }}</el-button>
            </template>
        </el-dialog>

        <!-- 通知容器：收到未读消息/模拟数据时弹出 -->
        <NotificationToasts ref="toastsRef" @open-chat="openChatById" />
        <input ref="imageInputRef" type="file" accept="image/jpeg,image/png" style="display: none" @change="onPickImage" />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n';
import Toolbar from './components/Toolbar.vue';
import ChatList from './components/ChatList.vue';
import ChatDetail from './components/ChatDetail.vue';
import BatchSendDialog from './components/BatchSendDialog.vue';
import NotificationToasts from './components/NotificationToasts.vue';
import { apiGetChatList, apiGetMessages, apiSendText, apiSendImage, apiSetSortIndex, apiDeleteChat, apiUpdateName, apiMergeStatus } from '@/api/smsChat';

const { t } = useI18n();

/* 顶部条件 */
const myPhoneList = ref<Array<{ label: string; value: string | number }>>([]); // 可后续补充接口加载
const selectedMyPhone = ref<number | string>(-1);
const filterType = ref<string | number>('5');
const searchPhone = ref('');

/* 列表 */
const chatList = ref<any[]>([]);
const totalChat = ref(0);
const pageNum = ref(1);
const pageSize = ref(50);

/* 右侧 */
const selectedChat = ref<any | null>(null);
const messageList = ref<any[]>([]);
const imageInputRef = ref<HTMLInputElement | null>(null);

/* 未读统计与定时轮询 */
const unreadCount = ref(0);
let statusTimer: any = null;
const toastsRef = ref<InstanceType<typeof NotificationToasts> | null>(null);

/* 重命名 */
const renameDialogVisible = ref(false);
const renameInput = ref('');

/* 群发 */
const batchSendDialogVisible = ref(false);

/* ============ 顶部/列表 ============ */
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

    // 保护：如果当前右侧会话有备注，而新列表该条为空，则用右侧备注回填
    if (selectedChat.value) {
      const it = chatList.value.find((x: any) => x.id === selectedChat.value!.id);
      if (it && (!it.addressBookName || String(it.addressBookName).trim() === '') && selectedChat.value.addressBookName) {
        it.addressBookName = selectedChat.value.addressBookName;
      }
    }

    unreadCount.value = chatList.value.reduce((s: number, c: any) => s + (c.unReadSize || 0), 0);
    if (selectedChat.value && !chatList.value.find((c: any) => c.id === selectedChat.value!.id)) {
      selectedChat.value = null;
      messageList.value = [];
    }
  } else {
    ElMessage.error(res?.data || t('common.pureLoadFailed'));
  }
}

function handleChatPageChange(p: number) {
    pageNum.value = p;
    loadChatList();
}

function selectChat(chat: any) {
    selectedChat.value = chat;
    loadMessages(chat.id);
}

async function setSort(payload: { chat: any; enable: boolean }) {
    const { chat, enable } = payload;
    const res: any = await apiSetSortIndex({ chatId: chat.id, enable });
    if (res?.scode === 0) {
        await loadChatList();
    } else {
        ElMessage.error(res?.data || t('common.pureLoadFailed'));
    }
}

/* ============ 右侧聊天窗 ============ */
async function loadMessages(chatId: number | string) {
    const res: any = await apiGetMessages(chatId);
    if (res?.scode === 0) {
        messageList.value = (res.data?.list || []).reverse();
        await nextTick();
        // ChatDetail 内部会自动滚动到底部
    } else {
        ElMessage.error(res?.data || t('common.pureLoadFailed'));
    }
}

async function sendText(msg: string) {
    if (!selectedChat.value) return;
    const res: any = await apiSendText({ chatId: selectedChat.value.id, message: msg });
    if (res?.scode === 0) {
        await loadMessages(selectedChat.value.id);
        await loadChatList();
    } else {
        ElMessage.error(res?.data || t('common.pureLoadFailed'));
    }
}

function onPickImage(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file || !selectedChat.value) return;
    const type = file.name.split('.').pop()?.toLowerCase() || '';
    if (!['png', 'jpg', 'jpeg'].includes(type)) {
        ElMessage.error('只支持png/jpg/jpeg');
        return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
        const base64Url = String(reader.result || '');
        const base64 = base64Url.includes(',') ? base64Url.split(',')[1] : base64Url;
        await sendImage({ base64, type });
    };
    reader.readAsDataURL(file);
    (e.target as HTMLInputElement).value = '';
}

async function sendImage(payload: { base64: string; type: string }) {
    if (!selectedChat.value) return;
    const res: any = await apiSendImage({
        chatId: selectedChat.value.id,
        imageBase64: payload.base64,
        fileType: payload.type
    });
    if (res?.scode === 0) {
        await loadMessages(selectedChat.value.id);
        await loadChatList();
    } else {
        ElMessage.error(res?.data || t('common.pureLoadFailed'));
    }
}

function openBatchSend() {
    batchSendDialogVisible.value = true;
}
function onBatchSent() {
    // 发送完成后刷新一次列表
    loadChatList();
}

/* 删除会话 */
function confirmDelete() {
    if (!selectedChat.value) return;
    ElMessageBox.confirm(t('smsChat.pureDeleteConfirm'), t('buttons.pureDelete'), { type: 'warning' })
        .then(async () => {
            const res: any = await apiDeleteChat(selectedChat.value!.id);
            if (res?.scode === 0) {
                selectedChat.value = null;
                messageList.value = [];
                await loadChatList();
                ElMessage.success(t('common.pureSuccess'));
            } else {
                ElMessage.error(res?.data || t('common.pureLoadFailed'));
            }
        })
        .catch(() => {});
}

/* 备注 */
function openRename() {
    if (!selectedChat.value) return;
    renameInput.value = selectedChat.value.addressBookName || '';
    renameDialogVisible.value = true;
}
// 仅替换这个函数
async function doRename() {
  const name = (renameInput.value || '').trim();
  if (!name || !selectedChat.value) {
    ElMessage.warning(t('smsChat.pureRemarkEmpty'));
    return;
  }
  const res: any = await apiUpdateName({ chatId: selectedChat.value.id, name });
  if (res?.scode === 0) {
    // 乐观更新：右侧 + 左侧列表同时改
    selectedChat.value.addressBookName = name;
    const it = chatList.value.find((x: any) => x.id === selectedChat.value!.id);
    if (it) it.addressBookName = name;

    renameDialogVisible.value = false;
    ElMessage.success(t('common.pureSuccess'));

    // 可选：稍后再做一次静默刷新，避免立即把备注又“刷新没了”
    setTimeout(() => {
      // 静默刷新列表，且保留当前会话备注为优先值（见 loadChatList 里保护）
      loadChatList();
    }, 300);
  } else {
    ElMessage.error(res?.data || t('common.pureLoadFailed'));
  }
}

/* ============ 定时轮询 + 通知 ============ */
function collectMessageIdsNeedingStatus(): string {
    return messageList.value
        .filter((m: any) => m.messageType === 1 && (!m.smsSend || m.sendReport === 0))
        .map((m: any) => m.id)
        .join(',');
}
function collectChatIdsOnList(): string {
    return chatList.value.map((c: any) => c.id).join(',');
}
function currentChatUnreadParam(): [string | number, string | number] | ['', ''] {
    if (!selectedChat.value || messageList.value.length === 0) return ['', ''];
    const maxId = Math.max(...messageList.value.map((m: any) => m.id || 0));
    return [selectedChat.value.id, maxId];
}

// 仅替换这个函数
async function tickStatus() {
  const [cid, lastId] = currentChatUnreadParam();
  const res: any = await apiMergeStatus({
    listMessageStatusAllId: collectMessageIdsNeedingStatus(),
    listAllStatusAllId: collectChatIdsOnList(),
    unReadMessageChatId: cid || undefined,
    unReadMessageLastId: lastId || undefined
  });
  if (res?.data) {
    // 1) 列表概要：仅当服务端给了值时才覆盖本地（防止把备注覆盖成空）
    (res.data.listAllStatusResponse?.status || []).forEach((c: any) => {
      const it = chatList.value.find((x: any) => x.id === c.id);
      if (!it) return;
      if (c.unReadSize != null) it.unReadSize = c.unReadSize;
      if (c.sendSize != null) it.sendSize = c.sendSize;
      if (c.receiveSize != null) it.receiveSize = c.receiveSize;
      if (c.sortIndex != null) it.sortIndex = c.sortIndex;

      // 关键：只有在服务端明确给出备注（非 undefined/非空串）时才覆盖
      if (c.addressBookName !== undefined && c.addressBookName !== null && String(c.addressBookName).trim() !== '') {
        it.addressBookName = c.addressBookName;
        // 同步右侧当前会话
        if (selectedChat.value && selectedChat.value.id === it.id) {
          selectedChat.value.addressBookName = c.addressBookName;
        }
      }
    });

    // 2) 新的未读会话插入列表
    (res.data.listAllStatusResponse?.unReadChats || []).forEach((uc: any) => {
      if (!chatList.value.find((x: any) => x.id === uc.id)) chatList.value.unshift(uc);
    });

    // 3) 右侧消息状态
    (res.data.listMessageStatusResponse || []).forEach((s: any) => {
      const m = messageList.value.find((x: any) => x.id === s.id);
      if (!m) return;
      if (s.smsSend != null) m.smsSend = s.smsSend;
      if (s.sendReport != null) m.sendReport = s.sendReport;
      m.messageType = 1;
    });

    // 4) 注入新消息 + 通知（原逻辑不变）
    const newMsgs = (res.data.unReadMessageResponse || []).reverse();
    newMsgs.forEach((nm: any) => {
      toastsRef.value?.notify({
        chatId: nm.chatId,
        title: `+(${nm.callingCode || ''})${nm.phone || ''}`,
        content: nm.media ? '[图片]' : nm.message
      });
      if (selectedChat.value && nm.chatId === selectedChat.value.id && !messageList.value.find((x: any) => x.id === nm.id)) {
        messageList.value.push(nm);
      }
    });

    unreadCount.value = chatList.value.reduce((s: number, c: any) => s + (c.unReadSize || 0), 0);
  }
}

function openChatById(id: number) {
    const it = chatList.value.find((x: any) => x.id === id);
    if (it) {
        selectChat(it);
    } else {
        // 不在当前页，先刷新列表，再尝试打开
        loadChatList().then(() => {
            const again = chatList.value.find((x: any) => x.id === id);
            if (again) selectChat(again);
        });
    }
}

// 模拟数据（默认关闭，调试时可打开）
const MOCK_ENABLE = false;
let mockTimer: any = null;
function randomDigits(n: number) {
    return Array.from({ length: n })
        .map(() => Math.floor(Math.random() * 10))
        .join('');
}
function startMock() {
    if (!MOCK_ENABLE) return;
    mockTimer = setInterval(() => {
        const mockId = 800000000 + Math.floor(Math.random() * 10000);
        const phone = randomDigits(10);
        // 左侧插入一个“伪会话卡片”
        chatList.value.unshift({
            id: mockId,
            callingCode: '1',
            phone,
            phoneCallingCode: '1',
            cardNo: '0000000000',
            sendSize: 0,
            receiveSize: 0,
            unReadSize: 1,
            sortIndex: 0
        });
        unreadCount.value += 1;
        // 弹通知
        toastsRef.value?.notify({
            chatId: mockId,
            title: `+(1)${phone}`,
            content: '【模拟】新消息'
        });
    }, 10000);
}

/* 生命周期 */
onMounted(async () => {
    await loadChatList();
    statusTimer = setInterval(tickStatus, 20000);
    startMock();
});
onBeforeUnmount(() => {
    if (statusTimer) clearInterval(statusTimer);
    if (mockTimer) clearInterval(mockTimer);
});
</script>

<style scoped>
/* 页面主题浅背景 + 顶部与两侧留白 */
.page-content {
    padding: 16px 20px;
}

/* 主题浅色背景（与现有品牌色一致：橙系浅底） */
.sms-chat-page {
    --brand1: #ff7a59;
    --brand2: #ffb86b;
    background: #f7fafc; /* 页面基底 */
    min-height: 100vh-270px;
    padding: 20px;
    display: flex;
    flex-direction: column;
}

/* 中间区域左右加更明显的间距，并与主题色区分 */
.chat-main {
    display: flex;
    align-items: stretch;
    flex: 1 1 auto;
    min-height: 0;
    gap: 24px; /* 左右整体间距加大 */
    padding: 8px; /* 与页面背景拉开一点 */
    border-radius: 16px;
    background: linear-gradient(180deg, #fff 0%, #f8fafc 100%);
    box-shadow: 0 6px 18px rgba(2, 6, 23, 0.04) inset;
    height: calc(100vh - 270px); /* 视口内固定高度，可按页面头部高度微调 */
}

/* 右侧聊天区域外观沿用子组件，只在父容器里稍作留白（不改功能） */
:deep(.chat-detail) {
    background: transparent;
}
</style>
