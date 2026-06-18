<template>
  <div class="schedule-page">
    <el-card class="header-card" shadow="never">
      <div class="schedule-header">
        <div class="header-left">
          <el-button-group>
            <el-button :type="viewMode === 'calendar' ? 'primary' : ''" @click="viewMode = 'calendar'">
              <el-icon><Calendar /></el-icon>
              日历视图
            </el-button>
            <el-button :type="viewMode === 'list' ? 'primary' : ''" @click="viewMode = 'list'">
              <el-icon><List /></el-icon>
              列表视图
            </el-button>
          </el-button-group>
        </div>
        <div class="header-center">
          <el-button circle @click="prevMonth">
            <el-icon><ArrowLeft /></el-icon>
          </el-button>
          <span class="month-title">{{ currentMonthTitle }}</span>
          <el-button circle @click="nextMonth">
            <el-icon><ArrowRight /></el-icon>
          </el-button>
          <el-button type="primary" style="margin-left: 16px" @click="goToday">今天</el-button>
        </div>
        <div class="header-right">
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增排班
          </el-button>
        </div>
      </div>
    </el-card>

    <el-card v-if="viewMode === 'calendar'" class="calendar-filter-card" shadow="never">
      <el-form :inline="true" :model="searchForm" class="search-form calendar-filter">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="标题/患者/医生"
            clearable
            style="width: 180px"
            @keyup.enter="loadMonthData"
          />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="searchForm.type" placeholder="全部" clearable style="width: 120px" @change="loadMonthData">
            <el-option label="随访" value="followup" />
            <el-option label="门诊" value="clinic" />
            <el-option label="会议" value="meeting" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="科室">
          <el-select v-model="searchForm.department" placeholder="全部科室" clearable filterable style="width: 140px" @change="loadMonthData">
            <el-option
              v-for="d in departmentList"
              :key="d"
              :label="d"
              :value="d"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px" @change="loadMonthData">
            <el-option label="已排" value="scheduled" />
            <el-option label="进行中" value="ongoing" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadMonthData">
            <el-icon><Search /></el-icon>
            筛选
          </el-button>
          <el-button @click="handleCalendarReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-if="viewMode === 'calendar'" class="calendar-card" shadow="never">
      <div class="calendar-container">
        <div class="calendar-header">
          <div
            v-for="day in weekDays"
            :key="day"
            class="calendar-header-cell"
          >
            {{ day }}
          </div>
        </div>
        <div class="calendar-body">
          <div
            v-for="(week, weekIndex) in calendarDays"
            :key="weekIndex"
            class="calendar-week"
          >
            <div
              v-for="(day, dayIndex) in week"
              :key="dayIndex"
              :class="[
                'calendar-day',
                { 'other-month': !day.currentMonth },
                { 'today': day.isToday }
              ]"
              @click="handleDayClick(day)"
            >
              <div class="day-header">
                <span class="day-number">{{ day.day }}</span>
              </div>
              <div class="day-events">
                <div
                  v-for="event in day.events"
                  :key="event.id"
                  :class="['event-item', `event-${event.type}`]"
                  @click.stop="handleView(event)"
                >
                  <span class="event-time">{{ event.start_time }}</span>
                  <span class="event-title">{{ event.title }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <el-card v-else class="list-card" shadow="never">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="标题/患者/医生"
            clearable
            style="width: 180px"
            @keyup.enter="loadList"
          />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="searchForm.type" placeholder="全部" clearable style="width: 120px">
            <el-option label="随访" value="followup" />
            <el-option label="门诊" value="clinic" />
            <el-option label="会议" value="meeting" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="科室">
          <el-select v-model="searchForm.department" placeholder="全部科室" clearable filterable style="width: 140px">
            <el-option
              v-for="d in departmentList"
              :key="d"
              :label="d"
              :value="d"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="已排" value="scheduled" />
            <el-option label="进行中" value="ongoing" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadList">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>

      <el-table :data="listData" v-loading="loading" border stripe style="width: 100%; margin-top: 16px">
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="title" label="标题" show-overflow-tooltip />
        <el-table-column prop="date" label="日期" width="110" />
        <el-table-column prop="start_time" label="开始" width="80" />
        <el-table-column prop="end_time" label="结束" width="80" />
        <el-table-column prop="type" label="类型" width="80" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="getTypeTagType(row.type)">
              {{ getTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="patient_name" label="患者" width="90" />
        <el-table-column prop="doctor" label="医生" width="90" />
        <el-table-column prop="department" label="科室" width="100" />
        <el-table-column prop="room" label="诊室" width="80" />
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">查看</el-button>
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="640px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="90px"
      >
        <el-form-item label="标题" prop="title">
          <el-input v-model="formData.title" placeholder="请输入排班标题" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="日期" prop="date">
              <el-date-picker
                v-model="formData.date"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="选择日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="类型" prop="type">
              <el-select v-model="formData.type" style="width: 100%" @change="handleTypeChange">
                <el-option label="随访" value="followup" />
                <el-option label="门诊" value="clinic" />
                <el-option label="会议" value="meeting" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开始时间" prop="start_time">
              <el-time-picker
                v-model="formData.start_time"
                format="HH:mm"
                value-format="HH:mm"
                placeholder="开始时间"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束时间" prop="end_time">
              <el-time-picker
                v-model="formData.end_time"
                format="HH:mm"
                value-format="HH:mm"
                placeholder="结束时间"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item v-if="formData.type === 'followup'" label="选择患者">
          <el-select
            v-model="formData.patient_id"
            placeholder="请选择患者"
            filterable
            style="width: 100%"
            @change="handlePatientChange"
          >
            <el-option
              v-for="p in patientList"
              :key="p.id"
              :label="`${p.name} - ${p.diagnosis}`"
              :value="p.id"
            />
          </el-select>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="科室">
              <el-select
                v-model="formData.department"
                placeholder="请选择或输入科室"
                filterable
                allow-create
                default-first-option
                clearable
                style="width: 100%"
                @change="handleDepartmentChange"
              >
                <el-option
                  v-for="d in departmentList"
                  :key="d"
                  :label="d"
                  :value="d"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="医生">
              <el-select
                v-model="formData.doctor"
                placeholder="请选择或输入医生"
                filterable
                allow-create
                default-first-option
                clearable
                style="width: 100%"
              >
                <el-option
                  v-for="doc in doctorList"
                  :key="doc"
                  :label="doc"
                  :value="doc"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-alert
          v-if="conflictWarn.length > 0"
          :title="`检测到 ${conflictWarn.length} 个潜在冲突`"
          type="warning"
          :closable="false"
          show-icon
          style="margin-bottom: 18px"
        >
          <div slot="default">
            <div
              v-for="(c, idx) in conflictWarn"
              :key="idx"
              style="font-size: 13px; line-height: 1.8"
            >
              ・{{ c.message }}
            </div>
          </div>
        </el-alert>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="诊室">
              <el-input v-model="formData.room" placeholder="请输入诊室" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="formData.status" style="width: 100%">
                <el-option label="已排" value="scheduled" />
                <el-option label="进行中" value="ongoing" />
                <el-option label="已完成" value="completed" />
                <el-option label="已取消" value="cancelled" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="描述">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="排班详情" width="560px" destroy-on-close>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="标题" :span="2">{{ detailData.title }}</el-descriptions-item>
        <el-descriptions-item label="日期">{{ detailData.date }}</el-descriptions-item>
        <el-descriptions-item label="类型">
          <el-tag size="small" :type="getTypeTagType(detailData.type)">
            {{ getTypeText(detailData.type) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="时间">
          {{ detailData.start_time || '-' }} - {{ detailData.end_time || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(detailData.status)">{{ getStatusText(detailData.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item v-if="detailData.patient_name" label="患者">{{ detailData.patient_name }}</el-descriptions-item>
        <el-descriptions-item v-if="detailData.doctor" label="医生">{{ detailData.doctor }}</el-descriptions-item>
        <el-descriptions-item v-if="detailData.department" label="科室">{{ detailData.department }}</el-descriptions-item>
        <el-descriptions-item v-if="detailData.room" label="诊室">{{ detailData.room }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">
          <div style="line-height: 1.6">{{ detailData.description || '暂无' }}</div>
        </el-descriptions-item>
      </el-descriptions>
      <div style="margin-top: 20px; text-align: right">
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleEditFromDetail">编辑</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import dayjs from 'dayjs';
import {
  getScheduleList,
  getMonthSchedule,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getScheduleDepartments,
  getScheduleDoctors,
  checkScheduleConflict
} from '@/api/schedules';
import { getAllPatients } from '@/api/patients';

const viewMode = ref('calendar');
const loading = ref(false);
const submitLoading = ref(false);
const currentDate = ref(dayjs());
const scheduleList = ref([]);
const listData = ref([]);
const patientList = ref([]);
const departmentList = ref([]);
const doctorList = ref([]);
const conflictWarn = ref([]);
let conflictTimer = null;

const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

const searchForm = reactive({
  keyword: '',
  type: '',
  status: '',
  department: ''
});

const currentMonthTitle = computed(() => {
  return currentDate.value.format('YYYY年M月');
});

const calendarDays = computed(() => {
  const year = currentDate.value.year();
  const month = currentDate.value.month();
  const firstDay = dayjs(new Date(year, month, 1));
  const startDay = firstDay.subtract(firstDay.day(), 'day');
  
  const keyword = searchForm.keyword?.trim().toLowerCase();
  
  const weeks = [];
  let current = startDay;
  
  for (let i = 0; i < 6; i++) {
    const week = [];
    for (let j = 0; j < 7; j++) {
      const dayDate = current;
      const dateStr = dayDate.format('YYYY-MM-DD');
      let events = scheduleList.value.filter(s => s.date === dateStr);
      
      if (keyword) {
        events = events.filter(s => 
          (s.title && s.title.toLowerCase().includes(keyword)) ||
          (s.patient_name && s.patient_name.toLowerCase().includes(keyword)) ||
          (s.doctor && s.doctor.toLowerCase().includes(keyword))
        );
      }
      
      week.push({
        day: dayDate.date(),
        date: dateStr,
        currentMonth: dayDate.month() === month,
        isToday: dayDate.isSame(dayjs(), 'day'),
        events: events.slice(0, 3)
      });
      current = current.add(1, 'day');
    }
    weeks.push(week);
  }
  
  return weeks;
});

const dialogVisible = ref(false);
const dialogType = ref('add');
const dialogTitle = ref('新增排班');
const formRef = ref(null);
const currentId = ref(null);

const formData = reactive({
  title: '',
  date: '',
  start_time: '',
  end_time: '',
  type: 'followup',
  patient_id: null,
  patient_name: '',
  doctor: '',
  department: '',
  room: '',
  status: 'scheduled',
  description: ''
});

const formRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  date: [{ required: true, message: '请选择日期', trigger: 'change' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }]
};

const detailVisible = ref(false);
const detailData = ref({});

const getTypeText = (type) => {
  const map = {
    followup: '随访',
    clinic: '门诊',
    meeting: '会议',
    other: '其他'
  };
  return map[type] || type;
};

const getTypeTagType = (type) => {
  const map = {
    followup: 'primary',
    clinic: 'success',
    meeting: 'warning',
    other: 'info'
  };
  return map[type] || 'info';
};

const getStatusType = (status) => {
  const map = {
    scheduled: 'primary',
    ongoing: 'warning',
    completed: 'success',
    cancelled: 'info'
  };
  return map[status] || 'info';
};

const getStatusText = (status) => {
  const map = {
    scheduled: '已排',
    ongoing: '进行中',
    completed: '已完成',
    cancelled: '已取消'
  };
  return map[status] || status;
};

const loadMonthData = async () => {
  loading.value = true;
  try {
    const year = currentDate.value.year();
    const month = currentDate.value.month() + 1;
    const res = await getMonthSchedule(year, month, {
      department: searchForm.department,
      type: searchForm.type,
      status: searchForm.status
    });
    scheduleList.value = res.data;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const handleCalendarReset = () => {
  searchForm.keyword = '';
  searchForm.type = '';
  searchForm.status = '';
  searchForm.department = '';
  loadMonthData();
};

const loadList = async () => {
  loading.value = true;
  try {
    const res = await getScheduleList({
      keyword: searchForm.keyword,
      type: searchForm.type,
      status: searchForm.status,
      department: searchForm.department
    });
    listData.value = res.data;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const loadPatients = async () => {
  try {
    const res = await getAllPatients();
    patientList.value = res.data;
  } catch (e) {
    console.error(e);
  }
};

const loadDepartments = async () => {
  try {
    const res = await getScheduleDepartments();
    departmentList.value = res.data || [];
  } catch (e) {
    console.error(e);
  }
};

const loadDoctors = async (department = '') => {
  try {
    const res = await getScheduleDoctors(department);
    doctorList.value = res.data || [];
  } catch (e) {
    console.error(e);
  }
};

const runConflictCheck = async () => {
  if (!formData.date || !formData.start_time) {
    conflictWarn.value = [];
    return;
  }
  try {
    const res = await checkScheduleConflict({
      date: formData.date,
      start_time: formData.start_time,
      end_time: formData.end_time,
      doctor: formData.doctor,
      room: formData.room,
      patient_id: formData.patient_id,
      exclude_id: dialogType.value === 'edit' ? currentId.value : null
    });
    conflictWarn.value = res.data?.conflicts || [];
  } catch (e) {
    conflictWarn.value = [];
  }
};

const scheduleConflictCheck = () => {
  if (conflictTimer) clearTimeout(conflictTimer);
  conflictTimer = setTimeout(runConflictCheck, 300);
};

watch(
  () => [formData.date, formData.start_time, formData.end_time, formData.doctor, formData.room, formData.patient_id],
  () => {
    if (dialogVisible.value) scheduleConflictCheck();
  }
);

const prevMonth = () => {
  currentDate.value = currentDate.value.subtract(1, 'month');
  loadMonthData();
};

const nextMonth = () => {
  currentDate.value = currentDate.value.add(1, 'month');
  loadMonthData();
};

const goToday = () => {
  currentDate.value = dayjs();
  loadMonthData();
};

const handleDayClick = (day) => {
  formData.date = day.date;
  handleAdd();
};

const handleReset = () => {
  searchForm.keyword = '';
  searchForm.type = '';
  searchForm.status = '';
  searchForm.department = '';
  loadList();
};

const resetForm = () => {
  formData.title = '';
  formData.date = '';
  formData.start_time = '';
  formData.end_time = '';
  formData.type = 'followup';
  formData.patient_id = null;
  formData.patient_name = '';
  formData.doctor = '';
  formData.department = '';
  formData.room = '';
  formData.status = 'scheduled';
  formData.description = '';
  formRef.value?.clearValidate();
};

const handleAdd = async () => {
  dialogType.value = 'add';
  dialogTitle.value = '新增排班';
  conflictWarn.value = [];
  if (!formData.date) {
    formData.date = dayjs().format('YYYY-MM-DD');
  }
  if (departmentList.value.length === 0) await loadDepartments();
  if (doctorList.value.length === 0) await loadDoctors();
  dialogVisible.value = true;
};

const handleEdit = async (row) => {
  dialogType.value = 'edit';
  dialogTitle.value = '编辑排班';
  conflictWarn.value = [];
  currentId.value = row.id;
  Object.assign(formData, row);
  if (departmentList.value.length === 0) await loadDepartments();
  await loadDoctors();
  dialogVisible.value = true;
  scheduleConflictCheck();
};

const handleView = (row) => {
  detailData.value = row;
  detailVisible.value = true;
};

const handleEditFromDetail = () => {
  detailVisible.value = false;
  handleEdit(detailData.value);
};

const handleTypeChange = (type) => {
  if (type !== 'followup') {
    formData.patient_id = null;
    formData.patient_name = '';
  }
};

const handlePatientChange = (patientId) => {
  const patient = patientList.value.find(p => p.id === patientId);
  if (patient) {
    formData.patient_name = patient.name;
    if (!formData.title) {
      formData.title = `${patient.name}-随访`;
    }
    if (!formData.department && patient.department) {
      formData.department = patient.department;
      loadDoctors(patient.department);
    }
    if (!formData.doctor && patient.doctor) {
      formData.doctor = patient.doctor;
    }
  }
};

const handleDepartmentChange = (department) => {
  loadDoctors(department || '');
  if (formData.doctor && doctorList.value.length > 0 && !doctorList.value.includes(formData.doctor)) {
    formData.doctor = '';
  }
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true;
      try {
        if (dialogType.value === 'add') {
          await createSchedule(formData);
          ElMessage.success('新增成功');
        } else {
          await updateSchedule(currentId.value, formData);
          ElMessage.success('更新成功');
        }
        dialogVisible.value = false;
        if (viewMode.value === 'calendar') {
          loadMonthData();
        } else {
          loadList();
        }
      } catch (e) {
        const resp = e?.response?.data || e?.data || {};
        if (resp.code === -1 && resp.data?.conflicts?.length) {
          conflictWarn.value = resp.data.conflicts;
          const msgs = resp.data.conflicts.map(c => `・${c.message}`).join('\n');
          ElMessage.error({
            message: `${resp.message}\n${msgs}`,
            duration: 5000,
            showClose: true
          });
        } else if (resp.message) {
          ElMessage.error(resp.message);
        } else {
          ElMessage.error(dialogType.value === 'add' ? '新增失败' : '更新失败');
        }
      } finally {
        submitLoading.value = false;
      }
    }
  });
};

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除"${row.title}"这个排班吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteSchedule(row.id);
      ElMessage.success('删除成功');
      if (viewMode.value === 'calendar') {
        loadMonthData();
      } else {
        loadList();
      }
    } catch (e) {
      console.error(e);
    }
  }).catch(() => {});
};

onMounted(() => {
  loadMonthData();
  loadList();
  loadPatients();
  loadDepartments();
  loadDoctors();
});
</script>

<style scoped>
.schedule-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.header-card {
  border-radius: 8px;
}

.schedule-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-center {
  display: flex;
  align-items: center;
  gap: 10px;
}

.month-title {
  font-size: 18px;
  font-weight: 600;
  min-width: 120px;
  text-align: center;
}

.calendar-card {
  border-radius: 8px;
}

.calendar-container {
  border: 1px solid #ebeef5;
  border-radius: 6px;
  overflow: hidden;
}

.calendar-header {
  display: flex;
  background-color: #f5f7fa;
}

.calendar-header-cell {
  flex: 1;
  padding: 12px;
  text-align: center;
  font-weight: 500;
  color: #606266;
  border-right: 1px solid #ebeef5;
}

.calendar-header-cell:last-child {
  border-right: none;
}

.calendar-body {
  background-color: white;
}

.calendar-week {
  display: flex;
  border-bottom: 1px solid #ebeef5;
}

.calendar-week:last-child {
  border-bottom: none;
}

.calendar-day {
  flex: 1;
  min-height: 100px;
  padding: 8px;
  border-right: 1px solid #ebeef5;
  cursor: pointer;
  transition: background-color 0.2s;
}

.calendar-day:hover {
  background-color: #f5f7fa;
}

.calendar-day:last-child {
  border-right: none;
}

.calendar-day.other-month {
  background-color: #fafafa;
  color: #c0c4cc;
}

.calendar-day.other-month:hover {
  background-color: #f5f7fa;
}

.calendar-day.today .day-number {
  background-color: #409EFF;
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.day-header {
  margin-bottom: 6px;
}

.day-number {
  font-size: 14px;
  font-weight: 500;
}

.day-events {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.event-item {
  font-size: 12px;
  padding: 3px 6px;
  border-radius: 3px;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  gap: 4px;
}

.event-followup {
  background-color: #ecf5ff;
  color: #409EFF;
}

.event-clinic {
  background-color: #f0f9eb;
  color: #67C23A;
}

.event-meeting {
  background-color: #fdf6ec;
  color: #E6A23C;
}

.event-other {
  background-color: #f4f4f5;
  color: #909399;
}

.event-time {
  font-weight: 500;
  flex-shrink: 0;
}

.event-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.list-card {
  border-radius: 8px;
}

.search-form {
  margin-bottom: 0;
}
</style>
