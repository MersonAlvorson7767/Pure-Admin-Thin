<template>
    <el-select
        v-model="innerValue"
        class="search-phone-select"
        filterable
        remote
        clearable
        :placeholder="placeholder"
        :remote-method="onRemote"
        :loading="loading"
        @change="onChange"
        @clear="onClear"
        style="width: 150px"
    >
        <el-option v-for="opt in options" :key="opt.value" :label="opt.label" :value="opt.value">
            <div class="opt-line">
                <span class="opt-main">{{ opt.label }}</span>
                <span v-if="opt.note" class="opt-note">{{ opt.note }}</span>
            </div>
        </el-option>
    </el-select>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { apiGetChatList } from '@/api/smsChat';

interface Option {
    value: string; // 纯数字串：callingCode+phone（用于真正查询）
    label: string; // 展示：+(code)phone
    note?: string; // 备注名
}

const props = defineProps<{
    modelValue?: string; // 选中后实际写回的纯数字串
    placeholder?: string;
    // 用于筛选建议列表的附加条件（与 dayliModelChats.html 一致）
    phoneId?: number | string; // -1 表示全部号码
    selectTypes?: number | string; // 2 无回复 / 5 有回复，默认 5
    pageSize?: number; // 每次拉取多少条建议
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', v: string): void;
    (e: 'select', payload: { value: string; label: string; raw: any }): void;
    (e: 'change'): void; // 供父级刷新
    (e: 'results', list: any[]): void; // 把候选直接给父组件去渲染
}>();

const innerValue = ref<string>(props.modelValue || '');
const loading = ref(false);
const options = ref<Option[]>([]);

watch(
    () => props.modelValue,
    (v) => {
        if (v !== innerValue.value) innerValue.value = v || '';
    }
);

async function onRemote(query: string) {
    const q = (query || '').replace(/\D/g, ''); // 只保留数字，避免 like 干扰
    if (!q) {
        options.value = [];
        return;
    }
    loading.value = true;
    try {
        // 调 dayliModel 风格接口：用 searchPhone 模糊拿候选
        const res: any = await apiGetChatList({
            phoneId: props.phoneId ?? -1,
            pageNum: 1,
            pageSize: props.pageSize ?? 20,
            searchPhone: q,
            selectTypes: props.selectTypes ?? 5
        });
        const list = res?.data?.content || [];
        emit('results', list); // 把候选交给父组件主列表
        options.value = []; // 下拉里不显示任何项
        options.value = list.map((c: any) => {
            const label = `+(${c.callingCode || ''})${c.phone || ''}`;
            const value = String(c.callingCode || '') + String(c.phone || '');
            return { value, label, note: c.addressBookName || '' };
        });
    } catch (e: any) {
        ElMessage.error(e?.message || '搜索失败');
    } finally {
        loading.value = false;
    }
}

function onChange(v: string) {
    // v 已是纯数字串（callingCode+phone）
    emit('update:modelValue', v || '');
    const hit = options.value.find((o) => o.value === v);
    emit('select', { value: v || '', label: hit?.label || '', raw: hit });
    emit('change'); // 通知父级刷新列表
}

function onClear() {
    options.value = [];
    emit('results', []);
    //emit('update:modelValue', '');
    // 清空不主动刷新，避免误触；如需刷新可以取消注释
    // emit('change');
}
</script>

<style scoped>
.search-phone-select :deep(.el-input__wrapper) {
    border-radius: 10px;
}
.opt-line {
    display: flex;
    align-items: center;
    gap: 6px;
}
.opt-main {
    font-weight: 700;
}
.opt-note {
    color: #64748b;
    font-size: 12px;
}
</style>
