<template>
    <div class="chat-list">
        <!-- 顶部：下拉搜索 + 号码搜索 -->
        <div class="chat-list-header">
            <!-- 1) 下拉搜索框：输入字符→远程拉候选→选择后以号码查询 -->
           <SearchPhoneSelect
             v-model="dropdownDigits"
             placeholder="搜索对方号码"
             :phone-id="-1"
             :select-types="5"
             :page-size="20"
             @select="onDropdownSelect"
             @change="emitChange"
             @results="useSearchResults"
           />
            <!-- 2) 直接号码搜索：纯输入，回车/变更即查 -->
            <el-input
                v-model="inputDigits"
                :placeholder="$t('smsChat.purePhoneNumber')"
                clearable
                style="width: 150px"
                @keyup.enter="applyInputSearch"
                @change="applyInputSearch"
            />
        </div>

        <!-- 滚动区：会话卡片 -->
        <div class="list-scroll">
            <el-card v-for="chat in displayList" :key="chat.id" :class="['chat-card', selectedId === chat.id ? 'is-selected' : '']" @click="selectCard(chat)">
                <div class="chat-card-row">
                    <el-tag type="danger">{{ $t('smsChat.pureUnread') }}: {{ chat.unReadSize || 0 }}</el-tag>
                    <el-tag type="success">{{ $t('smsChat.pureSent') }}: {{ chat.sendSize || 0 }}</el-tag>
                    <el-tag type="info">{{ $t('smsChat.pureReceived') }}: {{ chat.receiveSize || 0 }}</el-tag>
                    <el-button v-if="!(chat.sortIndex > 0)" :title="$t('smsChat.purePin')" link @click.stop="$emit('set-sort', { chat, enable: true })">
                        <el-icon><Top /></el-icon>
                    </el-button>
                    <el-button v-else :title="$t('smsChat.pureUnpin')" link @click.stop="$emit('set-sort', { chat, enable: false })">
                        <el-icon><Bottom /></el-icon>
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
import { ref,computed } from 'vue';
import { Top, Bottom } from '@element-plus/icons-vue';
import SearchPhoneSelect from './SearchPhoneSelect.vue';

const props = defineProps<{
    list: any[];
    pageNum: number;
    pageSize: number;
    total: number;
    // 父级透传的查询条件（与 dayliModelChats.html 一致）
    myPhoneList?: Array<{ label: string; value: string | number }>;
    selectedMyPhone?: number | string;
    searchPhone?: string;
}>();
const emit = defineEmits<{
    (e: 'select', chat: any): void;
    (e: 'set-sort', payload: { chat: any; enable: boolean }): void;
    (e: 'page-change', page: number): void;
    (e: 'update:selected-my-phone', v: number | string): void;
    (e: 'update:search-phone', v: string): void;
    (e: 'change'): void; // 通知父级刷新
}>();
// 本地覆盖的显示数据（来自下拉搜索的结果）；为空则显示 props.list
const overrideList = ref<any[] | null>(null);
const displayList = computed(() => overrideList.value ?? props.list);

// 下拉/输入双向绑定
const dropdownDigits = ref<string>('');
const inputDigits = ref<string>('');

// 接收下拉组件返回的候选结果，直接覆盖主列表显示
function useSearchResults(list: any[]) {
  overrideList.value = Array.isArray(list) && list.length ? list : null;
}

// 选中卡片 → 高亮 + 透传给父级
const selectedId = ref<number | string | null>(null);
function selectCard(chat: any) {
  selectedId.value = chat?.id ?? null;
  emit('select', chat);
}
const localSelectedMyPhone = computed({
    get: () => props.selectedMyPhone,
    set: (v) => emit('update:selected-my-phone', v)
});
const localSearchPhone = computed({
    get: () => props.searchPhone,
    set: (v) => emit('update:search-phone', v)
});

// 选择下拉项 → 写回父级 searchPhone 并刷新
function onDropdownSelect(p: { value: string; label: string }) {
    const digits = (p?.value || '').replace(/\D/g, '');
    if (!digits) return;
    localSearchPhone.value = digits;
    inputDigits.value = digits; // 同步到输入框显示
}

// 文本框回车/变更 → 清洗为纯数字后写回并刷新
function applyInputSearch() {
    const digits = (inputDigits.value || '').replace(/\D/g, '');
    localSearchPhone.value = digits;
    emitChange();
}

// 通知父级执行实际查询（父级会重置到第 1 页并刷新）
function emitChange() {
    emit('change');
}
</script>

<style scoped>
/* 左侧容器固定高度、边框与卡片背景 */
.chat-list {
    position: relative;
    flex: 0 0 340px;
    width: 340px;
    min-width: 300px;
    max-width: 420px;
    display: grid;
    grid-template-rows: auto 1fr auto;
    height: calc(100vh - 250px); /* 视口内固定高度，可按页面头部高度微调 */
    min-height: 0;

    border: 1px solid #e5e7eb;
    border-radius: 16px;
    background: #fff;
    box-shadow: 0 2px 12px rgba(2, 6, 23, 0.04);
    overflow: hidden;
}

/* 顶部筛选卡片 */
.chat-list-header {
    --brandBorder: #ffe1d6;
    display: flex;
    /* flex-direction: column; */
    gap: 10px;
    margin: 0;
    padding: 10px 10px 6px 10px;
    background: #fff;
    border-bottom: 1px solid #f3f4f6;
}
:deep(.chat-list-header .el-select .el-input__wrapper),
:deep(.chat-list-header .el-input .el-input__wrapper) {
    background: #f7fafc;
    border-color: #eaeaea;
    border-radius: 12px;
    box-shadow: none;
}

/* 列表内部滚动，右侧滚动条常驻 */
.list-scroll {
    flex: 1 1 auto;
    min-height: 0;
    height: 100%;
    overflow-y: auto;
    padding: 10px 10px 72px 10px; /* 底部给分页留出空间 */
    scrollbar-gutter: stable;
}
.list-scroll::-webkit-scrollbar {
    width: 10px;
}
.list-scroll::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 8px;
}
.list-scroll::-webkit-scrollbar-track {
    background: transparent;
}

/* 卡片 */
.chat-card {
    margin-bottom: 12px;
    cursor: pointer;
    border-radius: 14px;
    background: #fff;
    border: 1px solid #f3f4f6;
    box-shadow: 0 6px 16px rgba(2, 6, 23, 0.06);
}
.chat-card-row {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 2px;
    justify-content: space-between;
}
.phone-row {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
    color: #334155;
    font-size: 15px;
    gap: 10px;
    font-weight: 700;
}

/* 分页固定在底部居中 */
.chat-pagination {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    margin: 0 auto;
    display: flex;
    justify-content: center;
    padding: 4px 8px;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: saturate(140%) blur(4px);
    border-radius: 14px;
    width: calc(100% - 16px);
}
/* 选中高亮（淡黄色） */
.chat-card.is-selected {
  background: #fff8e6;
  border-color: #ffe1b3;
}
</style>
