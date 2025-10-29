<template>
    <div class="page-content batch-statistics-page">
        <h1>{{ $t('menus.batchStatistics') }}</h1>
        <el-form :inline="true" class="mb-4">
            <el-form-item label="日期范围">
                <!-- 使用自定义组件 -->
                <DateTimeRangePicker v-model="dateRange" />
            </el-form-item>
            <el-form-item>
                <el-button type="primary" @click="loadData">查询</el-button>
            </el-form-item>
        </el-form>
        
        <!-- 表格和其他内容保持不变 -->
        <el-table :data="tableData" style="width: 100%" v-loading="loading" :header-cell-style="{ background: '#f8fafc', fontWeight: 800 }" :cell-style="{ textAlign: 'center' }">
            <el-table-column prop="queueSize" label="队列中" width="90" />
            <el-table-column prop="createSize" label="总数" width="90" />
            <el-table-column prop="callSize" label="批发次数" width="90" />
            <el-table-column prop="sendSize" label="已发送" width="90" />
            <el-table-column label="已发送率" width="90">
                <template #default="scope">{{ percent(scope.row.sendSize, scope.row.createSize) }}</template>
            </el-table-column>
            <el-table-column prop="receiveSize" label="已回复" width="90" />
            <el-table-column label="已回复率" width="90">
                <template #default="scope">{{ percent(scope.row.receiveSize, scope.row.sendSize - scope.row.faileSizeChat) }}</template>
            </el-table-column>
            <el-table-column prop="faileSizeChat" label="失败" width="90" />
            <el-table-column label="失败率" width="90">
                <template #default="scope">{{ percent(scope.row.faileSizeChat, scope.row.sendSize) }}</template>
            </el-table-column>
            <el-table-column prop="days" label="时间" width="150" />
            <el-table-column fixed="right" label="操作" width="110">
                <template #default="scope">
                    <el-button type="danger" size="small" @click="showResult(scope.row)">详情</el-button>
                </template>
            </el-table-column>
        </el-table>
        
        <el-pagination
            class="mt-4"
            background
            layout="prev, pager, next, jumper"
            :total="total"
            :page-size="pageSize"
            :current-page="pageNum"
            @current-change="pageNum = $event; loadData();"
        />
        
        <!-- 批次详情弹窗保持不变 -->
        <el-dialog v-model="resultDialogVisible" title="发送结果" width="600px">
            <div v-if="batchResult">
                <div class="mb-2">
                    <span class="stat-badge">成功 {{ batchResult.successSize }} / {{ batchResult.allSize }}</span>
                </div>
                <div v-if="batchResult.errorList_cost_short">
                    <div class="section-title">余额不足发送失败的号码</div>
                    <pre class="copy-block">{{ batchResult.errorList_cost_short }}</pre>
                </div>
                <div v-if="batchResult.errorList_left_short">
                    <div class="section-title">群发数量不足发送失败的号码，请尽快购买更多卡号</div>
                    <pre class="copy-block">{{ batchResult.errorList_left_short }}</pre>
                </div>
                <div v-if="batchResult.otherError">
                    <div class="section-title">其他错误</div>
                    <pre class="copy-block">{{ batchResult.otherError }}</pre>
                </div>
                <div v-if="batchResult.phoneData">
                    <div class="section-title">提交的号码</div>
                    <pre class="copy-block">{{ asArray(batchResult.phoneData).join('\n') }}</pre>
                </div>
                <div v-if="batchResult.msgData">
                    <div class="section-title">提交的消息</div>
                    <pre class="copy-block">{{ asArray(batchResult.msgData).join('\n') }}</pre>
                </div>
            </div>
            <template #footer>
                <el-button @click="resultDialogVisible = false">关闭</el-button>
            </template>
        </el-dialog>
    </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onBeforeMount } from 'vue';
import { useRouter } from 'vue-router';
import { getBatchStatisticsList, getBatchResult } from '@/api/batch-statistics';
import DateTimeRangePicker from '@/components/DateTimeRangePicker.vue';
import dayjs from 'dayjs';

const router = useRouter();

// 在组件挂载前检查必要的数据
onBeforeMount(() => {
  // 检查是否有必要的权限或数据
  try {
    // 如果有权限检查，在这里处理
    const userInfo = sessionStorage.getItem('userInfo');
    if (!userInfo) {
      // 如果没有用户信息，可能需要重新登录
      console.warn('No user info found, redirecting to login or home');
      // router.push('/'); // 如果需要跳转
    }
  } catch (error) {
    console.error('Error in batch-statistics beforeMount:', error);
  }
});

// 其余代码保持不变...
const tableData = ref<any[]>([]);
const loading = ref(false);
const total = ref(0);
const pageSize = ref(10);
const pageNum = ref(1);

// 使用 Date 数组，默认昨天 00:00 到今天 00:00
const dateRange = ref<[Date, Date]>([
  dayjs().subtract(1, 'day').startOf('day').toDate(),
  dayjs().startOf('day').toDate()
]);

function percent(a: number, b: number) {
    if (!b) return '-';
    return ((a / b) * 100).toFixed(2) + '%';
}

function loadData() {
    // 添加错误处理
    if (!dateRange.value || dateRange.value.length !== 2) {
      console.error('Invalid date range');
      return;
    }
    
    loading.value = true;
    getBatchStatisticsList({
        pageSize: pageSize.value,
        pageNum: pageNum.value,
        startTime: dayjs(dateRange.value[0]).format('YYYY-MM-DD HH:mm:ss'),
        endTime: dayjs(dateRange.value[1]).format('YYYY-MM-DD HH:mm:ss')
    })
    .then((res) => {
        tableData.value = res.data?.data?.data || [];
        total.value = res.data?.data?.count || 0;
    })
    .catch((error) => {
        console.error('Error loading batch statistics:', error);
        // 可以添加错误提示
        ElMessage.error('加载数据失败，请刷新重试');
    })
    .finally(() => (loading.value = false));
}

onMounted(() => {
  // 确保组件挂载后再加载数据
  try {
    loadData();
  } catch (error) {
    console.error('Error in mounted:', error);
  }
});

const resultDialogVisible = ref(false);
const batchResult = ref<any>(null);

function showResult(row: any) {
    if (!row?.id) {
      console.error('Invalid row data');
      return;
    }
    
    getBatchResult(row.id)
      .then((res) => {
        batchResult.value = res.data;
        resultDialogVisible.value = true;
      })
      .catch((error) => {
        console.error('Error loading batch result:', error);
        ElMessage.error('加载详情失败');
      });
}

function asArray(data: any) {
    try {
        return Array.isArray(data) ? data : JSON.parse(data);
    } catch {
        return [String(data)];
    }
}
</script>

<style scoped>
.page-content {
    padding: 24px;
}

.batch-statistics-page {
    background: #fff;
    min-height: 100vh;
    padding: 32px;
}

.stat-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.25rem 0.5rem;
    border-radius: 999px;
    font-weight: 700;
    color: #fff;
    background: linear-gradient(90deg, #ff7a59 0%, #ffb86b 100%);
}

.section-title {
    font-weight: 700;
    color: #334155;
    margin-bottom: 0.25rem;
}

.copy-block {
    white-space: pre-wrap;
    word-break: break-all;
    background: #fff7f3;
    border: 1px solid #ffe1d6;
    border-radius: 10px;
    padding: 0.5rem 0.75rem;
}
</style>