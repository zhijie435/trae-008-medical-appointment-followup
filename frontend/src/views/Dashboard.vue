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
              <div class="stat-value">{{ stats.pendingFollowups }}</div>
              <div class="stat-label">待随访</div>
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getPatientList } from '@/api/patients';
import { getFollowupList } from '@/api/followups';
import { getScheduleList } from '@/api/schedules';
import dayjs from 'dayjs';

const stats = ref({
  patientCount: 0,
  followupCount: 0,
  pendingFollowups: 0,
  todaySchedules: 0
});

const recentFollowups = ref([]);
const todaySchedules = ref([]);

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

const loadData = async () => {
  try {
    const [patientsRes, followupsRes, schedulesRes] = await Promise.all([
      getPatientList({ page: 1, pageSize: 100 }),
      getFollowupList({ page: 1, pageSize: 100 }),
      getScheduleList({ startDate: dayjs().format('YYYY-MM-DD'), endDate: dayjs().format('YYYY-MM-DD') })
    ]);

    stats.value.patientCount = patientsRes.data.total;
    stats.value.followupCount = followupsRes.data.total;
    stats.value.pendingFollowups = followupsRes.data.list.filter(f => f.status === 'pending').length;
    stats.value.todaySchedules = schedulesRes.data.length;

    recentFollowups.value = followupsRes.data.list.slice(0, 6);
    todaySchedules.value = schedulesRes.data;
  } catch (e) {
    console.error('加载数据失败', e);
  }
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
</style>
