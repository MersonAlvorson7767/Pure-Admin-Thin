<template>
  <el-popover
    v-model:visible="visible"
    placement="bottom-start"
    :width="650"
    trigger="click"
    popper-class="datetime-range-popper"
    :persistent="false"
  >
    <template #reference>
      <div class="datetime-trigger">
        <span>{{ displayText }}</span>
      </div>
    </template>
    
    <div class="datetime-panel" @click.stop>
      <div class="panel-container">
        <!-- 左侧快捷选项 -->
       <!-- <div class="shortcuts-sidebar">
          <div class="shortcut-item" @click="setYesterday">昨天</div>
          <div class="shortcut-item" @click="setLastWeek">最近7天</div>
          <div class="shortcut-item" @click="setLastMonth">最近30天</div>
        </div>
 -->
        <!-- 右侧主体 -->
        <div class="main-content">
          <!-- 双日历 -->
          <div class="calendars-row">
            <div class="calendar-wrapper">
              <div class="calendar-header">
                {{ dayjs(tempStart.date).format('M月 YYYY') }}
              </div>
              <div class="calendar-grid">
                <div class="calendar-weekdays">
                  <div class="weekday">日</div>
                  <div class="weekday">一</div>
                  <div class="weekday">二</div>
                  <div class="weekday">三</div>
                  <div class="weekday">四</div>
                  <div class="weekday">五</div>
                  <div class="weekday">六</div>
                </div>
                <div class="calendar-days">
                  <div
                    v-for="day in getMonthDays(tempStart.date)"
                    :key="day.dateStr"
                    class="calendar-day"
                    :class="{
                      'is-other-month': day.isOtherMonth,
                      'is-selected': isStartDate(day.date),
                      'is-in-range': isInRange(day.date),
                      'is-end': isEndDate(day.date)
                    }"
                    @click="!day.isOtherMonth && selectStartDate(day.date)"
                  >
                    {{ day.date.getDate() }}
                  </div>
                </div>
              </div>
            </div>

            <div class="calendar-wrapper">
              <div class="calendar-header">
                {{ dayjs(tempEnd.date).format('M月 YYYY') }}
              </div>
              <div class="calendar-grid">
                <div class="calendar-weekdays">
                  <div class="weekday">日</div>
                  <div class="weekday">一</div>
                  <div class="weekday">二</div>
                  <div class="weekday">三</div>
                  <div class="weekday">四</div>
                  <div class="weekday">五</div>
                  <div class="weekday">六</div>
                </div>
                <div class="calendar-days">
                  <div
                    v-for="day in getMonthDays(tempEnd.date)"
                    :key="day.dateStr"
                    class="calendar-day"
                    :class="{
                      'is-other-month': day.isOtherMonth,
                      'is-selected': isEndDate(day.date),
                      'is-in-range': isInRange(day.date),
                      'is-start': isStartDate(day.date)
                    }"
                    @click="!day.isOtherMonth && selectEndDate(day.date)"
                  >
                    {{ day.date.getDate() }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 时间选择器 - 使用简单的下拉实现 -->
          <div class="time-row">
            <div class="time-group">
              <label>开始时间</label>
              <div class="time-selects">
                <div class="custom-select" @click.stop>
                  <input 
                    v-model="tempStart.hour" 
                    class="time-input" 
                    readonly
                    @click="toggleDropdown('startHour')"
                  />
                  <div v-if="dropdowns.startHour" class="dropdown-list" @click.stop>
                    <div 
                      v-for="h in 24" 
                      :key="h-1"
                      class="dropdown-item"
                      @click="selectTime('startHour', String(h-1).padStart(2, '0'))"
                    >
                      {{ String(h-1).padStart(2, '0') }}
                    </div>
                  </div>
                </div>
                <span class="time-sep">:</span>
                <div class="custom-select" @click.stop>
                  <input 
                    v-model="tempStart.minute" 
                    class="time-input" 
                    readonly
                    @click="toggleDropdown('startMinute')"
                  />
                  <div v-if="dropdowns.startMinute" class="dropdown-list" @click.stop>
                    <div 
                      v-for="m in 60" 
                      :key="m-1"
                      class="dropdown-item"
                      @click="selectTime('startMinute', String(m-1).padStart(2, '0'))"
                    >
                      {{ String(m-1).padStart(2, '0') }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="time-group">
              <label>结束时间</label>
              <div class="time-selects">
                <div class="custom-select" @click.stop>
                  <input 
                    v-model="tempEnd.hour" 
                    class="time-input" 
                    readonly
                    @click="toggleDropdown('endHour')"
                  />
                  <div v-if="dropdowns.endHour" class="dropdown-list" @click.stop>
                    <div 
                      v-for="h in 24" 
                      :key="h-1"
                      class="dropdown-item"
                      @click="selectTime('endHour', String(h-1).padStart(2, '0'))"
                    >
                      {{ String(h-1).padStart(2, '0') }}
                    </div>
                  </div>
                </div>
                <span class="time-sep">:</span>
                <div class="custom-select" @click.stop>
                  <input 
                    v-model="tempEnd.minute" 
                    class="time-input" 
                    readonly
                    @click="toggleDropdown('endMinute')"
                  />
                  <div v-if="dropdowns.endMinute" class="dropdown-list" @click.stop>
                    <div 
                      v-for="m in 60" 
                      :key="m-1"
                      class="dropdown-item"
                      @click="selectTime('endMinute', String(m-1).padStart(2, '0'))"
                    >
                      {{ String(m-1).padStart(2, '0') }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 底部显示和按钮 -->
          <div class="panel-footer">
            <div class="selected-range">
              {{ rangeDisplayText }}
            </div>
            <div class="footer-buttons">
              <el-button @click="handleCancel">取消</el-button>
              <el-button type="primary" @click="handleConfirm">确定</el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue';
import dayjs from 'dayjs';
import { ElMessage } from 'element-plus';

interface Props {
  modelValue: [Date, Date] | null;
  format?: string;
}

const props = withDefaults(defineProps<Props>(), {
  format: 'MM-DD HH:mm'
});

const emit = defineEmits<{
  'update:modelValue': [value: [Date, Date]];
}>();

const visible = ref(false);

// 下拉框状态
const dropdowns = reactive({
  startHour: false,
  startMinute: false,
  endHour: false,
  endMinute: false
});

// 临时选择值
const tempStart = ref({
  date: new Date(),
  hour: '00',
  minute: '00'
});

const tempEnd = ref({
  date: new Date(),
  hour: '00',
  minute: '00'
});

// 切换下拉框
function toggleDropdown(type: string) {
  // 关闭其他下拉框
  Object.keys(dropdowns).forEach(key => {
    if (key !== type) {
      dropdowns[key as keyof typeof dropdowns] = false;
    }
  });
  dropdowns[type as keyof typeof dropdowns] = !dropdowns[type as keyof typeof dropdowns];
}

// 选择时间
function selectTime(type: string, value: string) {
  if (type === 'startHour') {
    tempStart.value.hour = value;
  } else if (type === 'startMinute') {
    tempStart.value.minute = value;
  } else if (type === 'endHour') {
    tempEnd.value.hour = value;
  } else if (type === 'endMinute') {
    tempEnd.value.minute = value;
  }
  dropdowns[type as keyof typeof dropdowns] = false;
}

// 显示文本
const displayText = computed(() => {
  if (!props.modelValue || !Array.isArray(props.modelValue)) {
    return '请选择日期时间范围';
  }
  
  const [start, end] = props.modelValue;
  return `${dayjs(start).format(props.format)} - ${dayjs(end).format(props.format)}`;
});

// 底部范围显示
const rangeDisplayText = computed(() => {
  if (!tempStart.value.date || !tempEnd.value.date) {
    return '请选择日期范围';
  }
  
  const start = dayjs(tempStart.value.date)
    .hour(parseInt(tempStart.value.hour))
    .minute(parseInt(tempStart.value.minute));
  
  const end = dayjs(tempEnd.value.date)
    .hour(parseInt(tempEnd.value.hour))
    .minute(parseInt(tempEnd.value.minute));
    
  return `${start.format('MM-DD HH:mm')} - ${end.format('MM-DD HH:mm')}`;
});

// 监听值变化
watch(() => props.modelValue, (val) => {
  if (val && Array.isArray(val)) {
    const [start, end] = val;
    
    tempStart.value = {
      date: new Date(start),
      hour: dayjs(start).format('HH'),
      minute: dayjs(start).format('mm')
    };
    
    tempEnd.value = {
      date: new Date(end),
      hour: dayjs(end).format('HH'),
      minute: dayjs(end).format('mm')
    };
  }
}, { immediate: true });

// 获取月份的所有天数
function getMonthDays(date: Date) {
  const firstDay = dayjs(date).startOf('month');
  const lastDay = dayjs(date).endOf('month');
  const startWeek = firstDay.day();
  const days = [];

  // 添加上个月的日期
  for (let i = startWeek - 1; i >= 0; i--) {
    const d = firstDay.subtract(i + 1, 'day');
    days.push({
      date: d.toDate(),
      dateStr: d.format('YYYY-MM-DD'),
      isOtherMonth: true
    });
  }

  // 添加本月日期
  for (let i = 1; i <= lastDay.date(); i++) {
    const d = dayjs(date).date(i);
    days.push({
      date: d.toDate(),
      dateStr: d.format('YYYY-MM-DD'),
      isOtherMonth: false
    });
  }

  // 补充到42个
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    const d = lastDay.add(i, 'day');
    days.push({
      date: d.toDate(),
      dateStr: d.format('YYYY-MM-DD'),
      isOtherMonth: true
    });
  }

  return days;
}

// 日期选择
function selectStartDate(date: Date) {
  tempStart.value.date = new Date(date);
}

function selectEndDate(date: Date) {
  tempEnd.value.date = new Date(date);
}

// 日期样式判断
function isStartDate(date: Date) {
  return dayjs(date).format('YYYY-MM-DD') === dayjs(tempStart.value.date).format('YYYY-MM-DD');
}

function isEndDate(date: Date) {
  return dayjs(date).format('YYYY-MM-DD') === dayjs(tempEnd.value.date).format('YYYY-MM-DD');
}

function isInRange(date: Date) {
  const d = dayjs(date);
  const start = dayjs(tempStart.value.date);
  const end = dayjs(tempEnd.value.date);
  return d.isAfter(start, 'day') && d.isBefore(end, 'day');
}

// 确认选择
function handleConfirm() {
  if (!tempStart.value.date || !tempEnd.value.date) {
    ElMessage.warning('请选择完整的日期时间');
    return;
  }
  
  const startDate = dayjs(tempStart.value.date)
    .hour(parseInt(tempStart.value.hour))
    .minute(parseInt(tempStart.value.minute))
    .second(0)
    .toDate();
    
  const endDate = dayjs(tempEnd.value.date)
    .hour(parseInt(tempEnd.value.hour))
    .minute(parseInt(tempEnd.value.minute))
    .second(0)
    .toDate();
  
  if (startDate > endDate) {
    emit('update:modelValue', [endDate, startDate]);
  } else {
    emit('update:modelValue', [startDate, endDate]);
  }
  
  visible.value = false;
}

// 取消
function handleCancel() {
  visible.value = false;
}

// 快捷选项
function setYesterday() {
  const start = dayjs().subtract(1, 'day').startOf('day');
  const end = dayjs().subtract(1, 'day').endOf('day');
  
  tempStart.value = {
    date: start.toDate(),
    hour: '00',
    minute: '00'
  };
  
  tempEnd.value = {
    date: end.toDate(),
    hour: '23',
    minute: '59'
  };
}

function setLastWeek() {
  const start = dayjs().subtract(7, 'day').startOf('day');
  const end = dayjs().startOf('day');
  
  tempStart.value = {
    date: start.toDate(),
    hour: '00',
    minute: '00'
  };
  
  tempEnd.value = {
    date: end.toDate(),
    hour: '00',
    minute: '00'
  };
}

function setLastMonth() {
  const start = dayjs().subtract(30, 'day').startOf('day');
  const end = dayjs().startOf('day');
  
  tempStart.value = {
    date: start.toDate(),
    hour: '00',
    minute: '00'
  };
  
  tempEnd.value = {
    date: end.toDate(),
    hour: '00',
    minute: '00'
  };
}
</script>

<style scoped>
.datetime-trigger {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  min-width: 280px;
  transition: all 0.3s;
  font-size: 14px;
  color: #606266;
}

.datetime-trigger:hover {
  border-color: var(--el-color-primary);
}

.panel-container {
  display: flex;
  height: 420px;
}

.shortcuts-sidebar {
  width: 120px;
  border-right: 1px solid #ebeef5;
  padding: 12px 0;
}

.shortcut-item {
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  color: #606266;
  transition: all 0.2s;
}

.shortcut-item:hover {
  background: var(--el-fill-color-light);
  color: var(--el-color-primary);
}

.main-content {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
}

.calendars-row {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
}

.calendar-wrapper {
  flex: 1;
}

.calendar-header {
  text-align: center;
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 12px;
  color: #303133;
}

.calendar-grid {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 8px;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 8px;
}

.weekday {
  text-align: center;
  font-size: 12px;
  color: #909399;
  padding: 4px;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.calendar-day {
  width: 28px;
  height: 28px;
  line-height: 28px;
  text-align: center;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  font-size: 14px;
}

.calendar-day.is-other-month {
  color: #c0c4cc;
  cursor: default;
}

.calendar-day:not(.is-other-month):not(.is-selected):not(.is-in-range):hover {
  background: var(--el-fill-color-light);
}

.calendar-day.is-selected {
  background: var(--el-color-primary);
  color: white;
}

.calendar-day.is-selected:hover {
  background: var(--el-color-primary);
  opacity: 0.9;
}

.calendar-day.is-in-range {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.calendar-day.is-in-range:hover {
  background: var(--el-color-primary-light-8);
}

.time-row {
  display: flex;
  gap: 40px;
  padding: 16px 0;
  border-top: 1px solid #ebeef5;
  justify-content: center;
}

.time-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.time-group label {
  font-size: 14px;
  color: #606266;
}

.time-selects {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 自定义下拉框 */
.custom-select {
  position: relative;
  width: 70px;
}

.time-input {
  width: 100%;
  height: 32px;
  line-height: 32px;
  padding: 0 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  text-align: center;
  font-size: 14px;
  outline: none;
}

.time-input:hover {
  border-color: var(--el-color-primary);
}

.dropdown-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 200px;
  overflow-y: auto;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  z-index: 2000;
  margin-top: 4px;
}

.dropdown-item {
  padding: 8px;
  text-align: center;
  cursor: pointer;
  font-size: 14px;
}

.dropdown-item:hover {
  background: var(--el-fill-color-light);
  color: var(--el-color-primary);
}

.time-sep {
  font-weight: bold;
  color: #909399;
}

.panel-footer {
  margin-top: auto;
  padding: 16px 0;
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.selected-range {
  font-size: 14px;
  color: #606266;
}

.footer-buttons {
  display: flex;
  gap: 12px;
}
</style>

<style>
.datetime-range-popper {
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  padding: 0;
}
</style>