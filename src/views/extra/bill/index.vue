<template>
  <div class="page-content bill-page">
    <h1>账单</h1>
    <el-form :inline="true" class="mb-4">
      <el-form-item label="日期范围">
        <DateTimeRangePicker v-model="dateRange" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="loadData">查询</el-button>
      </el-form-item>
    </el-form>
    
    <el-table 
      v-if="!isDestroyed"
      :data="tableData" 
      style="width: 100%" 
      v-loading="loading" 
      :header-cell-style="{ background: '#f8fafc', fontWeight: 800 }" 
      :cell-style="{ textAlign: 'center' }"
      height="600"
    >
      <el-table-column prop="opDayliModelCount" label="次数" width="120" />
      <el-table-column prop="afterDayliModelCount" label="剩余金额" width="150" />
      <el-table-column prop="opDesc" label="说明" min-width="300" />
      <el-table-column prop="createTime" label="时间" width="200">
        <template #default="scope">
          <span style="text-align: left; display: block;">{{ scope.row.createTime }}</span>
        </template>
      </el-table-column>
    </el-table>
    
    <el-pagination
      v-if="!isDestroyed"
      class="mt-4"
      background
      layout="prev, pager, next, jumper, sizes, total"
      :total="total"
      :page-size="pageSize"
      :page-sizes="[10, 50, 100]"
      :current-page="pageNum"
      @current-change="handlePageChange"
      @size-change="handleSizeChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { getBillList } from '@/api/bill';
import DateTimeRangePicker from '@/components/DateTimeRangePicker.vue';
import dayjs from 'dayjs';
import { ElMessage } from 'element-plus';

// 定义页面元信息
defineOptions({
  name: "Bill"
});

const tableData = ref<any[]>([]);
const loading = ref(false);
const total = ref(0);
const pageSize = ref(10);
const pageNum = ref(1);
const isDestroyed = ref(false);

// 使用 Date 数组，默认昨天 00:00 到今天 00:00
const dateRange = ref<[Date, Date]>([
  dayjs().subtract(1, 'day').startOf('day').toDate(),
  dayjs().startOf('day').toDate()
]);

async function loadData() {
  // 检查组件是否已销毁
  if (isDestroyed.value) return;
  
  // 添加错误处理
  if (!dateRange.value || dateRange.value.length !== 2) {
    console.error('Invalid date range');
    return;
  }
  
  loading.value = true;
  
  try {
    const res = await getBillList({
      pageSize: pageSize.value,
      pageNum: pageNum.value,
      startTime: dayjs(dateRange.value[0]).format('YYYY-MM-DD HH:mm:ss'),
      endTime: dayjs(dateRange.value[1]).format('YYYY-MM-DD HH:mm:ss')
    });
    
    // 再次检查组件是否已销毁
    if (isDestroyed.value) return;
    
    if (res.data) {
      tableData.value = res.data.content || [];
      total.value = res.data.totalElements || 0;
    }
  } catch (error) {
    if (isDestroyed.value) return;
    console.error('Error loading bill data:', error);
    ElMessage.error('加载账单失败，请刷新重试');
  } finally {
    if (!isDestroyed.value) {
      loading.value = false;
    }
  }
}

// 分页处理
function handlePageChange(page: number) {
  if (isDestroyed.value) return;
  pageNum.value = page;
  loadData();
}

function handleSizeChange(size: number) {
  if (isDestroyed.value) return;
  pageSize.value = size;
  pageNum.value = 1;
  loadData();
}

onMounted(async () => {
  // 使用 nextTick 确保 DOM 已渲染
  await nextTick();
  
  try {
    await loadData();
  } catch (error) {
    console.error('Error in mounted:', error);
  }
});

// 组件销毁前清理
onBeforeUnmount(() => {
  isDestroyed.value = true;
  // 清理任何可能的定时器或异步操作
  loading.value = false;
});
</script>

<style scoped>
.page-content {
  padding: 24px;
}

.bill-page {
  background: #fff;
  min-height: 100vh;
  padding: 32px;
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
  letter-spacing: .3px;
  border: none !important;
  text-align: center;
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

:deep(.el-table__body-wrapper::-webkit-scrollbar-thumb:hover) {
  background: #9ca3af;
}

:deep(.el-table__row) {
  transition: all 0.3s;
}

:deep(.el-table__row:hover) {
  background-color: #f8fafc !important;
}

:deep(.el-table__empty-block) {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.el-pagination) {
  justify-content: center;
  margin-top: 20px;
}

:deep(.el-pagination.is-background .el-pager li:not(.is-disabled).is-active) {
  background: linear-gradient(90deg, #ff7a59 0%, #ffb86b 100%);
  color: #fff;
}

:deep(.el-pagination.is-background .el-pager li:hover) {
  color: #ff7a59;
}

:deep(.el-button--primary) {
  background: linear-gradient(90deg, #ff7a59 0%, #ffb86b 100%);
  border: none;
  box-shadow: 0 8px 18px rgba(255, 122, 89, 0.25);
}

:deep(.el-button--primary:hover) {
  filter: brightness(1.05);
  box-shadow: 0 10px 22px rgba(255, 122, 89, 0.32);
}

:deep(.el-loading-mask) {
  background-color: rgba(255, 255, 255, 0.9);
}
</style>