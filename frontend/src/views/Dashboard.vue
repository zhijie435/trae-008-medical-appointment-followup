<template>
  <div class="dashboard">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card stat-blue">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon :size="40"><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.patientCount }}</div>
              <div class="stat-label">总病例数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-green">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon :size="40"><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.followupCount }}</div>
              <div class="stat-label">随访记录</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-orange">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon :size="40"><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.todayPending }}</div>
              <div class="stat-label">今日待办</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card stat-purple">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon :size="40"><Calendar /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.todaySchedules }}</div>
              <div class="stat-label">今日排班</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="todo-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon :size="20" color="#E6A23C"><Bell /></el-icon>
            <span class="header-title">今日随访待办</span>
            <el-tag size="small" type="warning" v-if="todayPending.length > 0">{{ todayPending.length }}条待处理</el-tag>
            <el-tag size="small" type="success" v-else>全部完成</el-tag>
          </div>
          <el-button type="primary" link @click="$router.push('/followups?status=pending')">查看全部待随访</el-button>
        </div>
      </template>
      <div v-if="todayPending.length === 0" class="empty-todo">
        <el-empty description="今日暂无待办随访，真棒！" :image-size="80" />
      </div>
      <div v-else class="todo-list">
        <div
          v-for="(item, index) in todayPending"
          :key="item.id"
          class="todo-item"
          :class="{ 'todo-done': item.completed }"
        >
          <div class="todo-check">
            <el-checkbox
              :model-value="item.completed"
              @change="(val) => handleTodoComplete(item, val)"
              size="large"
            />
          </div>
          <div class="todo-content">
            <div class="todo-header">
              <span class="todo-priority">{{ index + 1 }}</span>
              <span class="todo-patient">{{ item.patient_name }}</span>
              <el-tag size="small" :type="getFollowupTypeTag(item.followup_type)">{{ item.followup_type }}</el-tag>
              <span class="todo-phone">{{ item.phone }}</span>
            </div>
            <div class="todo-body">
              <div class="todo-info">
                <span class="info-item"><el-icon><User /></el-icon> {{ item.gender }}，{{ item.age }}岁</span>
                <span class="info-item"><el-icon><DataLine /></el-icon> {{ item.diagnosis }}</span>
                <span class="info-item"><el-icon><UserFilled /></el-icon> {{ item.doctor || '未分配' }}</span>
              </div>
              <div class="todo-content-text" v-if="item.content">
                <el-icon><Document /></el-icon>
                <span>{{ item.content }}</span>
              </div>
            </div>
          </div>
          <div class="todo-actions">
            <el-button type="primary" link size="small" @click="handleViewTodo(item)">
              <el-icon><View /></el-icon> 详情
            </el-button>
            <el-button type="success" link size="small" @click="handleQuickComplete(item)">
              <el-icon><Check /></el-icon> 完成
            </el-button>
          </div>
        </div>
      </div>
    </el-card>

    <el-row :gutter="20" class="content-row">
      <el-col :span="12">
        <el-card class="panel-card">
          <template #header>
            <div class="card-header">
              <span>近期随访</span>
              <el-button type="primary" link @click="$router.push('/followups')">查看全部</el-button>
            </div>
          </template>
          <el-table :data="recentFollowups" size="small" style="width: 100%">
            <el-table-column prop="patient_name" label="患者姓名" width="100" />
            <el-table-column prop="followup_date" label="随访日期" width="110" />
            <el-table-column prop="followup_type" label="类型" width="90" />
            <el-table-column prop="content" label="内容" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" size="small">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="panel-card">
          <template #header>
            <div class="card-header">
              <span>今日排班</span>
              <el-button type="primary" link @click="$router.push('/schedule')">查看全部</el-button>
            </div>
          </template>
          <el-table :data="todaySchedules" size="small" style="width: 100%">
            <el-table-column prop="title" label="标题" show-overflow-tooltip />
            <el-table-column prop="start_time" label="开始时间" width="90" />
            <el-table-column prop="end_time" label="结束时间" width="90" />
            <el-table-column prop="type" label="类型" width="80">
              <template #default="{ row }">
                {{ getScheduleTypeText(row.type) }}
              </template>
            </el-table-column>
            <el-table-column prop="doctor" label="医生" width="90" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="completeDialogVisible" title="完成随访" width="500px" destroy-on-close>
      <el-form :model="completeForm" label-width="100px">
        <el-form-item label="随访结果">
          <el-input
            v-model="completeForm.result"
            type="textarea"
            :rows="4"
            placeholder="请输入随访结果"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="completeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="completeLoading" @click="submitComplete">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="随访详情" width="640px" destroy-on-close>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="患者姓名">{{ detailData.patient_name }}</el-descriptions-item>
        <el-descriptions-item label="随访日期">{{ detailData.followup_date }}</el-descriptions-item>
        <el-descriptions-item label="随访类型">{{ detailData.followup_type }}</el-descriptions-item>
        <el-descriptions-item label="随访医生">{{ detailData.doctor }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(detailData.status)">{{ getStatusText(detailData.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="下次随访">{{ detailData.next_followup_date || '-' }}</el-descriptions-item>
        <el-descriptions-item label="随访内容" :span="2">
          <div class="detail-content">{{ detailData.content || '暂无' }}</div>
        </el-descriptions-item>
        <el-descriptions-item label="随访结果" :span="2">
          <div class="detail-content">{{ detailData.result || '暂无' }}</div>
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">
          <div class="detail-content">{{ detailData.notes || '暂无' }}</div>
        </el-descriptions-item>
      </el-descriptions>
      <div style="margin-top: 20px; text-align: right">
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button v-if="detailData.status === 'pending'" type="success" @click="handleCompleteFromDetail">
          标记完成
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getPatientList } from '@/api/patients';
import { getFollowupList, getTodayPendingFollowups, updateFollowupStatus } from '@/api/followups';
import { getScheduleList } from '@/api/schedules';
import dayjs from 'dayjs';

const stats = ref({
  patientCount: 0,
  followupCount: 0,
  pendingFollowups: 0,
  todayPending: 0,
  todaySchedules: 0
});

const recentFollowups = ref([]);
const todaySchedules = ref([]);
const todayPending = ref([]);

const completeDialogVisible = ref(false);
const completeLoading = ref(false);
const completeForm = reactive({
  result: ''
});
const completeId = ref(null);

const detailVisible = ref(false);
const detailData = ref({});

const getStatusType = (status) => {
  const map = {
    pending: 'warning',
    completed: 'success',
    cancelled: 'info'
  };
  return map[status] || 'info';
};

const getStatusText = (status) => {
  const map = {
    pending: '待随访',
    completed: '已完成',
    cancelled: '已取消'
  };
  return map[status] || status;
};

const getScheduleTypeText = (type) => {
  const map = {
    followup: '随访',
    clinic: '门诊',
    meeting: '会议',
    other: '其他'
  };
  return map[type] || type;
};

const getFollowupTypeTag = (type) => {
  const map = {
    '电话随访': 'primary',
    '门诊随访': 'success',
    '上门随访': 'warning',
    '微信随访': 'info',
    '其他': 'info'
  };
  return map[type] || 'info';
};

const loadData = async () => {
  try {
    const [patientsRes, followupsRes, schedulesRes, todayPendingRes] = await Promise.all([
      getPatientList({ page: 1, pageSize: 100 }),
      getFollowupList({ page: 1, pageSize: 100 }),
      getScheduleList({ startDate: dayjs().format('YYYY-MM-DD'), endDate: dayjs().format('YYYY-MM-DD') }),
      getTodayPendingFollowups()
    ]);

    stats.value.patientCount = patientsRes.data.total;
    stats.value.followupCount = followupsRes.data.total;
    stats.value.pendingFollowups = followupsRes.data.list.filter(f => f.status === 'pending').length;
    stats.value.todaySchedules = schedulesRes.data.length;
    stats.value.todayPending = todayPendingRes.data.length;

    todayPending.value = todayPendingRes.data.map(item => ({ ...item, completed: false }));
    recentFollowups.value = followupsRes.data.list.slice(0, 6);
    todaySchedules.value = schedulesRes.data;
  } catch (e) {
    console.error('加载数据失败', e);
  }
};

const handleTodoComplete = (item, val) => {
  if (val) {
    handleQuickComplete(item);
  }
};

const handleQuickComplete = (item) => {
  completeId.value = item.id;
  completeForm.result = '';
  completeDialogVisible.value = true;
};

const handleCompleteFromDetail = () => {
  detailVisible.value = false;
  completeId.value = detailData.value.id;
  completeForm.result = '';
  completeDialogVisible.value = true;
};

const submitComplete = async () => {
  completeLoading.value = true;
  try {
    await updateFollowupStatus(completeId.value, {
      status: 'completed',
      result: completeForm.result
    });
    ElMessage.success('随访已完成');
    completeDialogVisible.value = false;
    loadData();
  } catch (e) {
    console.error(e);
  } finally {
    completeLoading.value = false;
  }
};

const handleViewTodo = (item) => {
  detailData.value = item;
  detailVisible.value = true;
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 8px;
  overflow: hidden;
}

.stat-card :deep(.el-card__body) {
  padding: 20px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-blue .stat-icon {
  background: linear-gradient(135deg, #409EFF, #2c7be5);
}

.stat-green .stat-icon {
  background: linear-gradient(135deg, #67C23A, #4ca64c);
}

.stat-orange .stat-icon {
  background: linear-gradient(135deg, #E6A23C, #d48806);
}

.stat-purple .stat-icon {
  background: linear-gradient(135deg, #909399, #6b6b7a);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  line-height: 1.2;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.todo-card {
  border-radius: 8px;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.empty-todo {
  padding: 40px 0;
}

.todo-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.todo-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  background-color: #fafafa;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  transition: all 0.3s;
}

.todo-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  background-color: #f5f7fa;
}

.todo-item.todo-done {
  opacity: 0.6;
  background-color: #f0f9eb;
}

.todo-check {
  padding-top: 4px;
  flex-shrink: 0;
}

.todo-content {
  flex: 1;
  min-width: 0;
}

.todo-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.todo-priority {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background-color: #e6a23c;
  color: white;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.todo-patient {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.todo-phone {
  color: #909399;
  font-size: 14px;
}

.todo-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.todo-info {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  color: #606266;
  font-size: 14px;
}

.info-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.todo-content-text {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  color: #606266;
  font-size: 14px;
  padding: 8px 12px;
  background-color: white;
  border-radius: 6px;
  border-left: 3px solid #409EFF;
}

.todo-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
}

.content-row {
  margin-bottom: 20px;
}

.panel-card {
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.detail-content {
  line-height: 1.6;
  white-space: pre-wrap;
  min-height: 40px;
}
</style>
