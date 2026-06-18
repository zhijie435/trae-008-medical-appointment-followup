<template>
  <div class="patients-page">
    <el-card class="search-card" shadow="never">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="姓名/电话/诊断"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
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
            <el-option label="活跃" value="active" />
            <el-option label="已出院" value="discharged" />
            <el-option label="其他" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
        <el-form-item style="margin-left: auto">
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增病例
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card" shadow="never">
      <el-table :data="tableData" v-loading="loading" border stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="gender" label="性别" width="70" align="center" />
        <el-table-column prop="age" label="年龄" width="70" align="center" />
        <el-table-column prop="phone" label="电话" width="130" />
        <el-table-column prop="diagnosis" label="诊断" show-overflow-tooltip />
        <el-table-column prop="department" label="科室" width="110" />
        <el-table-column prop="doctor" label="主治医生" width="100" />
        <el-table-column prop="admission_date" label="入院日期" width="120" />
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">
              <el-icon><View /></el-icon>
              查看
            </el-button>
            <el-button type="primary" link size="small" @click="handleEdit(row)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="720px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="90px"
        class="patient-form"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="formData.name" placeholder="请输入姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="性别" prop="gender">
              <el-select v-model="formData.gender" placeholder="请选择性别" style="width: 100%">
                <el-option label="男" value="男" />
                <el-option label="女" value="女" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="年龄" prop="age">
              <el-input-number v-model="formData.age" :min="0" :max="150" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="电话" prop="phone">
              <el-input v-model="formData.phone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="身份证号" prop="id_card">
              <el-input v-model="formData.id_card" placeholder="请输入身份证号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="诊断" prop="diagnosis">
              <el-input v-model="formData.diagnosis" placeholder="请输入诊断结果" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="科室" prop="department">
              <el-select
                v-model="formData.department"
                placeholder="请选择或输入科室"
                filterable
                allow-create
                default-first-option
                clearable
                style="width: 100%"
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
            <el-form-item label="主治医生" prop="doctor">
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
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="formData.status" style="width: 100%">
                <el-option label="活跃" value="active" />
                <el-option label="已出院" value="discharged" />
                <el-option label="其他" value="inactive" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="入院日期" prop="admission_date">
              <el-date-picker
                v-model="formData.admission_date"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="选择日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="出院日期" prop="discharge_date">
              <el-date-picker
                v-model="formData.discharge_date"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="选择日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="病例摘要" prop="notes">
              <el-input
                v-model="formData.notes"
                type="textarea"
                :rows="4"
                placeholder="请输入病例摘要、病史等信息"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="病例详情" width="900px" destroy-on-close class="patient-detail-dialog">
      <el-tabs v-model="activeTab" class="detail-tabs">
        <el-tab-pane label="基本信息" name="basic">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="姓名">{{ detailData.name }}</el-descriptions-item>
            <el-descriptions-item label="性别">{{ detailData.gender }}</el-descriptions-item>
            <el-descriptions-item label="年龄">{{ detailData.age }}岁</el-descriptions-item>
            <el-descriptions-item label="电话">{{ detailData.phone }}</el-descriptions-item>
            <el-descriptions-item label="身份证号" :span="2">{{ detailData.id_card }}</el-descriptions-item>
            <el-descriptions-item label="诊断">{{ detailData.diagnosis }}</el-descriptions-item>
            <el-descriptions-item label="科室">{{ detailData.department }}</el-descriptions-item>
            <el-descriptions-item label="主治医生">{{ detailData.doctor }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="getStatusType(detailData.status)">{{ getStatusText(detailData.status) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="入院日期">{{ detailData.admission_date }}</el-descriptions-item>
            <el-descriptions-item label="出院日期">{{ detailData.discharge_date || '-' }}</el-descriptions-item>
            <el-descriptions-item label="创建时间" :span="2">{{ detailData.created_at }}</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <el-tab-pane label="病例摘要" name="summary">
          <div class="summary-section">
            <div class="summary-header">
              <span class="section-title">病例摘要</span>
              <el-button type="primary" link @click="showEditSummary = true">
                <el-icon><Edit /></el-icon> 编辑摘要
              </el-button>
            </div>
            <div class="summary-content">
              <div v-if="detailData.notes" class="notes-text">{{ detailData.notes }}</div>
              <el-empty v-else description="暂无病例摘要，点击上方编辑按钮录入" :image-size="80" />
            </div>
          </div>

          <el-divider />

          <div class="summary-section">
            <div class="summary-header">
              <span class="section-title">诊断信息</span>
            </div>
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="主要诊断">
                <el-tag type="primary">{{ detailData.diagnosis || '未填写' }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="就诊科室">{{ detailData.department || '未填写' }}</el-descriptions-item>
              <el-descriptions-item label="主治医生">{{ detailData.doctor || '未填写' }}</el-descriptions-item>
              <el-descriptions-item label="患者状态">
                <el-tag :type="getStatusType(detailData.status)">{{ getStatusText(detailData.status) }}</el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </el-tab-pane>

        <el-tab-pane label="随访历史" name="followups">
          <div class="followup-timeline">
            <div class="timeline-header">
              <span class="section-title">随访记录时间线</span>
              <el-button type="primary" size="small" @click="handleQuickAddFollowup">
                <el-icon><Plus /></el-icon> 新增随访
              </el-button>
            </div>
            <div v-if="patientFollowups.length === 0" class="empty-followups">
              <el-empty description="暂无随访记录" :image-size="80" />
            </div>
            <el-timeline v-else>
              <el-timeline-item
                v-for="(item, index) in patientFollowups"
                :key="item.id"
                :timestamp="item.followup_date"
                :type="getTimelineType(item.status)"
                placement="top"
              >
                <el-card shadow="never" class="timeline-card">
                  <div class="timeline-card-header">
                    <div class="card-title">
                      <el-tag size="small" :type="getFollowupTypeTag(item.followup_type)">
                        {{ item.followup_type }}
                      </el-tag>
                      <el-tag size="small" :type="getStatusType(item.status)">
                        {{ getStatusText(item.status) }}
                      </el-tag>
                      <span class="followup-doctor" v-if="item.doctor">{{ item.doctor }}</span>
                    </div>
                  </div>
                  <div class="timeline-card-body">
                    <div class="form-group" v-if="item.content">
                      <span class="label">随访内容：</span>
                      <span class="value">{{ item.content }}</span>
                    </div>
                    <div class="form-group" v-if="item.result">
                      <span class="label">随访结果：</span>
                      <span class="value">{{ item.result }}</span>
                    </div>
                    <div class="form-group" v-if="item.next_followup_date">
                      <span class="label">下次随访：</span>
                      <span class="value highlight">{{ item.next_followup_date }}</span>
                    </div>
                    <div class="form-group" v-if="item.notes">
                      <span class="label">备注：</span>
                      <span class="value">{{ item.notes }}</span>
                    </div>
                  </div>
                  <div class="timeline-card-footer">
                    <span class="create-time">创建于 {{ item.created_at }}</span>
                    <div class="card-actions">
                      <el-button type="primary" link size="small" @click="handleViewFollowup(item)">
                        <el-icon><View /></el-icon> 详情
                      </el-button>
                      <el-button v-if="item.status === 'pending'" type="success" link size="small" @click="handleCompleteFollowup(item)">
                        <el-icon><Check /></el-icon> 完成
                      </el-button>
                    </div>
                  </div>
                </el-card>
              </el-timeline-item>
            </el-timeline>
          </div>
        </el-tab-pane>
      </el-tabs>

      <div style="margin-top: 20px; text-align: right">
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleEditFromDetail">编辑基本信息</el-button>
      </div>
    </el-dialog>

    <el-dialog v-model="showEditSummary" title="编辑病例摘要" width="640px" destroy-on-close>
      <el-form :model="summaryForm" label-width="100px">
        <el-form-item label="诊断">
          <el-input v-model="summaryForm.diagnosis" placeholder="请输入诊断结果" />
        </el-form-item>
        <el-form-item label="科室">
          <el-input v-model="summaryForm.department" placeholder="请输入科室" />
        </el-form-item>
        <el-form-item label="主治医生">
          <el-input v-model="summaryForm.doctor" placeholder="请输入主治医生" />
        </el-form-item>
        <el-form-item label="病例摘要">
          <el-input
            v-model="summaryForm.notes"
            type="textarea"
            :rows="8"
            placeholder="请输入病例摘要，包括：主诉、现病史、既往史、检查结果、治疗方案、注意事项等..."
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditSummary = false">取消</el-button>
        <el-button type="primary" :loading="summaryLoading" @click="submitSummary">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="followupDetailVisible" title="随访详情" width="560px" destroy-on-close>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="随访日期">{{ currentFollowup.followup_date }}</el-descriptions-item>
        <el-descriptions-item label="随访类型">{{ currentFollowup.followup_type }}</el-descriptions-item>
        <el-descriptions-item label="随访医生">{{ currentFollowup.doctor || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentFollowup.status)">{{ getStatusText(currentFollowup.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="随访内容" :span="2">
          <div class="detail-text">{{ currentFollowup.content || '暂无' }}</div>
        </el-descriptions-item>
        <el-descriptions-item label="随访结果" :span="2">
          <div class="detail-text">{{ currentFollowup.result || '暂无' }}</div>
        </el-descriptions-item>
        <el-descriptions-item label="下次随访" :span="2">{{ currentFollowup.next_followup_date || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">
          <div class="detail-text">{{ currentFollowup.notes || '暂无' }}</div>
        </el-descriptions-item>
      </el-descriptions>
      <div style="margin-top: 20px; text-align: right">
        <el-button @click="followupDetailVisible = false">关闭</el-button>
      </div>
    </el-dialog>

    <el-dialog v-model="completeFollowupVisible" title="完成随访" width="500px" destroy-on-close>
      <el-form :model="completeFollowupForm" label-width="100px">
        <el-form-item label="随访结果" required>
          <el-input
            v-model="completeFollowupForm.result"
            type="textarea"
            :rows="4"
            placeholder="请输入随访结果"
          />
        </el-form-item>
        <el-form-item label="下次随访">
          <el-date-picker
            v-model="completeFollowupForm.next_followup_date"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择日期"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="completeFollowupVisible = false">取消</el-button>
        <el-button type="primary" :loading="completeFollowupLoading" @click="submitCompleteFollowup">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getPatientList, createPatient, updatePatient, deletePatient, getPatientDepartments } from '@/api/patients';
import { getFollowupsByPatient, createFollowup, updateFollowupStatus } from '@/api/followups';
import { getScheduleDoctors } from '@/api/schedules';
import dayjs from 'dayjs';

const loading = ref(false);
const submitLoading = ref(false);
const tableData = ref([]);
const departmentList = ref([]);
const doctorList = ref([]);

const searchForm = reactive({
  keyword: '',
  status: '',
  department: ''
});

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
});

const dialogVisible = ref(false);
const dialogType = ref('add');
const dialogTitle = ref('新增病例');
const formRef = ref(null);

const formData = reactive({
  name: '',
  gender: '',
  age: null,
  phone: '',
  id_card: '',
  diagnosis: '',
  admission_date: '',
  discharge_date: '',
  department: '',
  doctor: '',
  status: 'active',
  notes: ''
});

const formRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  diagnosis: [{ required: true, message: '请输入诊断', trigger: 'blur' }]
};

const detailVisible = ref(false);
const detailData = ref({});
const currentId = ref(null);

const activeTab = ref('basic');
const showEditSummary = ref(false);
const summaryLoading = ref(false);
const summaryForm = reactive({
  diagnosis: '',
  department: '',
  doctor: '',
  notes: ''
});

const patientFollowups = ref([]);
const followupDetailVisible = ref(false);
const currentFollowup = ref({});
const completeFollowupVisible = ref(false);
const completeFollowupLoading = ref(false);
const completeFollowupForm = reactive({
  result: '',
  next_followup_date: ''
});

const getStatusType = (status) => {
  const map = {
    active: 'success',
    discharged: 'info',
    inactive: 'warning'
  };
  return map[status] || 'info';
};

const getStatusText = (status) => {
  const map = {
    active: '活跃',
    discharged: '已出院',
    inactive: '其他'
  };
  return map[status] || status;
};

const getTimelineType = (status) => {
  const map = {
    pending: 'warning',
    completed: 'success',
    cancelled: 'info'
  };
  return map[status] || 'primary';
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
  loading.value = true;
  try {
    const res = await getPatientList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword,
      status: searchForm.status,
      department: searchForm.department
    });
    tableData.value = res.data.list;
    pagination.total = res.data.total;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const loadPatientFollowups = async (patientId) => {
  try {
    const res = await getFollowupsByPatient(patientId);
    patientFollowups.value = res.data;
  } catch (e) {
    console.error(e);
  }
};

const loadDepartments = async () => {
  try {
    const res = await getPatientDepartments();
    departmentList.value = res.data || [];
  } catch (e) {
    console.error(e);
  }
};

const loadDoctors = async () => {
  try {
    const res = await getScheduleDoctors();
    doctorList.value = res.data || [];
  } catch (e) {
    console.error(e);
  }
};

watch(detailVisible, (val) => {
  if (val && currentId.value) {
    loadPatientFollowups(currentId.value);
  }
});

const handleSearch = () => {
  pagination.page = 1;
  loadData();
};

const handleReset = () => {
  searchForm.keyword = '';
  searchForm.status = '';
  searchForm.department = '';
  pagination.page = 1;
  loadData();
};

const resetForm = () => {
  formData.name = '';
  formData.gender = '';
  formData.age = null;
  formData.phone = '';
  formData.id_card = '';
  formData.diagnosis = '';
  formData.admission_date = '';
  formData.discharge_date = '';
  formData.department = '';
  formData.doctor = '';
  formData.status = 'active';
  formData.notes = '';
  formRef.value?.clearValidate();
};

const handleAdd = async () => {
  dialogType.value = 'add';
  dialogTitle.value = '新增病例';
  resetForm();
  if (departmentList.value.length === 0) await loadDepartments();
  if (doctorList.value.length === 0) await loadDoctors();
  dialogVisible.value = true;
};

const handleEdit = async (row) => {
  dialogType.value = 'edit';
  dialogTitle.value = '编辑病例';
  currentId.value = row.id;
  Object.assign(formData, row);
  if (departmentList.value.length === 0) await loadDepartments();
  if (doctorList.value.length === 0) await loadDoctors();
  dialogVisible.value = true;
};

const handleView = (row) => {
  detailData.value = row;
  currentId.value = row.id;
  activeTab.value = 'basic';
  detailVisible.value = true;
};

const handleEditFromDetail = () => {
  detailVisible.value = false;
  handleEdit(detailData.value);
};

const handleQuickAddFollowup = () => {
  detailVisible.value = false;
  const newFollowup = {
    patient_id: currentId.value,
    followup_date: dayjs().format('YYYY-MM-DD'),
    followup_type: '电话随访',
    content: '',
    result: '',
    next_followup_date: '',
    doctor: detailData.value.doctor || '',
    status: 'pending',
    notes: ''
  };
  ElMessageBox.confirm(`确定为患者"${detailData.value.name}"创建一条随访记录吗？`, '提示', {
    confirmButtonText: '去创建',
    cancelButtonText: '取消',
    type: 'info'
  }).then(async () => {
    try {
      await createFollowup(newFollowup);
      ElMessage.success('随访记录创建成功，请在随访管理中完善内容');
      loadPatientFollowups(currentId.value);
      detailVisible.value = true;
      activeTab.value = 'followups';
    } catch (e) {
      console.error(e);
    }
  }).catch(() => {
    detailVisible.value = true;
  });
};

const handleViewFollowup = (item) => {
  currentFollowup.value = item;
  followupDetailVisible.value = true;
};

const handleCompleteFollowup = (item) => {
  currentFollowup.value = item;
  completeFollowupForm.result = '';
  completeFollowupForm.next_followup_date = '';
  completeFollowupVisible.value = true;
};

const submitCompleteFollowup = async () => {
  if (!completeFollowupForm.result) {
    ElMessage.warning('请输入随访结果');
    return;
  }
  completeFollowupLoading.value = true;
  try {
    await updateFollowupStatus(currentFollowup.value.id, {
      status: 'completed',
      result: completeFollowupForm.result
    });
    if (completeFollowupForm.next_followup_date) {
      await createFollowup({
        patient_id: currentFollowup.value.patient_id,
        followup_date: completeFollowupForm.next_followup_date,
        followup_type: currentFollowup.value.followup_type,
        content: '',
        result: '',
        next_followup_date: '',
        doctor: currentFollowup.value.doctor || '',
        status: 'pending',
        notes: ''
      });
    }
    ElMessage.success('随访已完成');
    completeFollowupVisible.value = false;
    loadPatientFollowups(currentId.value);
  } catch (e) {
    console.error(e);
  } finally {
    completeFollowupLoading.value = false;
  }
};

const submitSummary = async () => {
  summaryLoading.value = true;
  try {
    await updatePatient(currentId.value, {
      ...detailData.value,
      diagnosis: summaryForm.diagnosis,
      department: summaryForm.department,
      doctor: summaryForm.doctor,
      notes: summaryForm.notes
    });
    detailData.value.diagnosis = summaryForm.diagnosis;
    detailData.value.department = summaryForm.department;
    detailData.value.doctor = summaryForm.doctor;
    detailData.value.notes = summaryForm.notes;
    ElMessage.success('病例摘要保存成功');
    showEditSummary.value = false;
    loadData();
  } catch (e) {
    console.error(e);
  } finally {
    summaryLoading.value = false;
  }
};

watch(showEditSummary, (val) => {
  if (val && detailData.value) {
    summaryForm.diagnosis = detailData.value.diagnosis || '';
    summaryForm.department = detailData.value.department || '';
    summaryForm.doctor = detailData.value.doctor || '';
    summaryForm.notes = detailData.value.notes || '';
  }
});

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true;
      try {
        if (dialogType.value === 'add') {
          await createPatient(formData);
          ElMessage.success('新增成功');
        } else {
          await updatePatient(currentId.value, formData);
          ElMessage.success('更新成功');
        }
        dialogVisible.value = false;
        loadData();
      } catch (e) {
        console.error(e);
      } finally {
        submitLoading.value = false;
      }
    }
  });
};

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除患者"${row.name}"的病例吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deletePatient(row.id);
      ElMessage.success('删除成功');
      loadData();
    } catch (e) {
      console.error(e);
    }
  }).catch(() => {});
};

onMounted(() => {
  loadData();
  loadDepartments();
  loadDoctors();
});
</script>

<style scoped>
.patients-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-card {
  border-radius: 8px;
}

.search-form {
  margin-bottom: 0;
}

.table-card {
  border-radius: 8px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.patient-form {
  padding-right: 20px;
}

.detail-notes {
  line-height: 1.6;
  white-space: pre-wrap;
}

.detail-tabs {
  margin-top: 10px;
}

.summary-section {
  margin-bottom: 16px;
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.summary-content {
  background-color: #fafafa;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #ebeef5;
}

.notes-text {
  line-height: 1.8;
  color: #606266;
  white-space: pre-wrap;
  font-size: 14px;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.empty-followups {
  padding: 40px 0;
}

.timeline-card {
  border: 1px solid #ebeef5;
  border-radius: 8px;
}

.timeline-card :deep(.el-card__body) {
  padding: 16px;
}

.timeline-card-header {
  margin-bottom: 12px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.followup-doctor {
  color: #909399;
  font-size: 13px;
  margin-left: 8px;
}

.timeline-card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 14px;
}

.form-group .label {
  color: #909399;
  flex-shrink: 0;
  min-width: 80px;
}

.form-group .value {
  color: #303133;
  flex: 1;
}

.form-group .value.highlight {
  color: #e6a23c;
  font-weight: 500;
}

.timeline-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.create-time {
  color: #c0c4cc;
  font-size: 12px;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.detail-text {
  line-height: 1.6;
  white-space: pre-wrap;
  min-height: 40px;
  color: #606266;
}

.patient-detail-dialog :deep(.el-dialog__body) {
  padding: 10px 20px 20px;
}
</style>
