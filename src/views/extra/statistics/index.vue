<template>
    <div class="page-content statistics-page">
        <h1>{{ $t('menus.statistics') }}</h1>

        <div class="toolbar-section mb-4">
            <el-button type="primary" @click="loadData">{{ $t('buttons.pureRefresh') }}</el-button>
        </div>

        <el-table
            v-if="!isDestroyed"
            :data="tableData"
            style="width: 100%"
            v-loading="loading"
            :header-cell-style="{ background: '#f8fafc', fontWeight: 800 }"
            :cell-style="getCellStyle"
            class="statistics-table"
        >
            <el-table-column 
                prop="days" 
                :label="$t('statistics.pureDate')" 
                width="150" 
                align="left" 
            />
            <el-table-column 
                prop="queueSize" 
                :label="$t('statistics.pureQueueSize')" 
                width="100" 
                align="center" 
            />
            <el-table-column 
                prop="sendSize" 
                :label="$t('statistics.pureSendWindow')" 
                width="120" 
                align="center" 
            />
            <el-table-column 
                prop="callSize" 
                :label="$t('statistics.pureCallSize')" 
                width="100" 
                align="center" 
            />
            <el-table-column 
                prop="receiveSize" 
                :label="$t('statistics.pureReceiveSize')" 
                width="120" 
                align="center" 
            />
            <el-table-column 
                :label="$t('statistics.pureReceiveRate')" 
                width="100" 
                align="center"
            >
                <template #default="scope">
                    {{ percent(scope.row.receiveSize, scope.row.sendSize - scope.row.faileSizeChat) }}
                </template>
            </el-table-column>
            <el-table-column 
                prop="faileSizeChat" 
                :label="$t('statistics.pureFailureSize')" 
                width="100" 
                align="center" 
            />
            <el-table-column 
                :label="$t('statistics.pureFailureRate')" 
                width="100" 
                align="center"
            >
                <template #default="scope">
                    {{ percent(scope.row.faileSizeChat, scope.row.sendSize) }}
                </template>
            </el-table-column>
        </el-table>

        <el-pagination
            v-if="!isDestroyed"
            class="mt-4"
            background
            layout="prev, pager, next, jumper"
            :total="total"
            :page-size="pageSize"
            :current-page="pageNum"
            @current-change="handlePageChange"
        />
    </div>
</template>

<script setup lang="ts">
// 脚本部分保持不变
import { useI18n } from 'vue-i18n';
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { getStatisticsList } from '@/api/statistics';
import { ElMessage } from 'element-plus';

const { t } = useI18n();

defineOptions({
    name: 'Statistics'
});

const tableData = ref<any[]>([]);
const loading = ref(false);
const total = ref(0);
const pageSize = ref(100);
const pageNum = ref(1);
const isDestroyed = ref(false);

function percent(a: number, b: number) {
    if (!b || b === 0) return '-';
    return ((a / b) * 100).toFixed(2) + '%';
}

function getCellStyle({ column }: any) {
    if (column.property === 'days') {
        return { textAlign: 'left' };
    }
    return { textAlign: 'center' };
}

async function loadData() {
    if (isDestroyed.value) return;
    
    loading.value = true;
    
    try {
        const res = await getStatisticsList({
            pageSize: pageSize.value,
            pageNum: pageNum.value
        });
        
        if (isDestroyed.value) return;
        
        if (res.scode === 0) {
            tableData.value = res.data?.content || [];
            total.value = res.data?.totalElements || 0;
        } else {
            ElMessage.error(res.message || t('common.pureLoadFailed'));
        }
    } catch (error) {
        if (isDestroyed.value) return;
        console.error('Error loading statistics:', error);
        ElMessage.error(t('common.pureLoadFailed'));
    } finally {
        if (!isDestroyed.value) {
            loading.value = false;
        }
    }
}

function handlePageChange(page: number) {
    if (isDestroyed.value) return;
    pageNum.value = page;
    loadData();
}

onMounted(async () => {
    await nextTick();
    try {
        await loadData();
    } catch (error) {
        console.error('Error in mounted:', error);
    }
});

onBeforeUnmount(() => {
    isDestroyed.value = true;
    loading.value = false;
});
</script>

<style scoped>
.page-content {
    padding: 24px;
}

.statistics-page {
    background: #fff;
    min-height: 100vh;
    padding: 32px;
}

.toolbar-section {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

/* 表格样式 */
.statistics-table {
    position: relative;
}

:deep(.el-table) {
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(2, 6, 23, 0.06);
}

:deep(.el-table__header-wrapper) {
    background: #f8fafc;
}

:deep(.el-table__header th) {
    color: #334155 !important;
    font-weight: 800 !important;
    letter-spacing: 0.3px;
    border: none !important;
}

/* 修复对齐问题 - 确保表头和内容对齐 */
:deep(.el-table__header th .cell) {
    padding-left: 16px;
    padding-right: 16px;
}

:deep(.el-table__body td .cell) {
    padding-left: 16px;
    padding-right: 16px;
}


:deep(.el-table__body-wrapper) {
    scrollbar-width: thin;
    scrollbar-color: #d1d5db #f3f4f6;
}

:deep(.el-table__body-wrapper::-webkit-scrollbar) {
    width: 8px;
    height: 8px;
}

:deep(.el-table__body-wrapper::-webkit-scrollbar-track) {
    background: #f3f4f6;
    border-radius: 4px;
}

:deep(.el-table__body-wrapper::-webkit-scrollbar-thumb) {
    background: #d1d5db;
    border-radius: 4px;
}

:deep(.el-table__row) {
    transition: all 0.3s;
    position: relative;
}

:deep(.el-table__row:hover) {
    background-color: #f8fafc !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}




/* 分页器样式 */
:deep(.el-pagination) {
    justify-content: center;
    margin-top: 20px;
}

:deep(.el-pagination.is-background .el-pager li:not(.is-disabled).is-active) {
    background: linear-gradient(90deg, #ff7a59 0%, #ffb86b 100%);
    color: #fff;
}

/* 按钮样式 */
:deep(.el-button--primary) {
    background: linear-gradient(90deg, #ff7a59 0%, #ffb86b 100%);
    border: none;
    box-shadow: 0 8px 18px rgba(255, 122, 89, 0.25);
}

:deep(.el-button--primary:hover) {
    filter: brightness(1.05);
    box-shadow: 0 10px 22px rgba(255, 122, 89, 0.32);
}
</style>