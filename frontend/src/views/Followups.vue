<template>
  <div class="followups-page">
    <el-card class="search-card" shadow="never">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="患者姓名/随访内容"
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
            <el-option label="待随访" value="pending" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
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
            新增随访
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card" shadow="never">
      <el-table :data="tableData" v-loading="loading" border stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="patient_name" label="患者姓名" width="100" />
        <el-table-column prop="followup_date" label="随访日期" width="120" />
        <el-table-column prop="followup_type" label="类型" width="100" />
        <el-table-column prop="content" label="随访内容" show-overflow-tooltip min-width="180" />
        <el-table-column prop="result" label="随访结果" show-overflow-tooltip min-width="150" />
        <el-table-column prop="next_followup_date" label="下次随访" width="120" />
        <el-table-column prop="patient_department" label="所属科室" width="100" />
        <el-table-column prop="doctor" label="随访医生" width="100" />
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">
              <el-icon><View /></el-icon>
              查看
            </el-button>
            <el-button type="primary" link size="small" @click="handleEdit(row)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button v-if="row.status === 'pending'" type="success" link size="small" @click="handleComplete(row)">
              <el-icon><Check /></el-icon>
              完成
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
      width="680px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        class="followup-form"
      >
        <el-form-item label="患者" prop="patient_id">
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
            <el-form-item label="随访日期" prop="followup_date">
              <el-date-picker
                v-model="formData.followup_date"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="选择日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="随访类型" prop="followup_type">
              <el-select v-model="formData.followup_type" style="width: 100%">
                <el-option label="电话随访" value="电话随访" />
                <el-option label="门诊随访" value="门诊随访" />
                <el-option label="上门随访" value="上门随访" />
                <el-option label="微信随访" value="微信随访" />
                <el-option label="其他" value="其他" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
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
            <el-form-item label="随访医生" prop="doctor">
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
        <el-form-item label="随访内容" prop="content">
          <el-input
            v-model="formData.content"
            type="textarea"
            :rows="3"
            placeholder="请输入随访内容"
          />
        </el-form-item>
        <el-form-item label="随访结果" prop="result">
          <el-input
            v-model="formData.result"
            type="textarea"
            :rows="3"
            placeholder="请输入随访结果"
          />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="下次随访" prop="next_followup_date">
              <el-date-picker
                v-model="formData.next_followup_date"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="选择日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="状态" prop="status">
          <el-select v-model="formData.status" style="width: 100%">
            <el-option label="待随访" value="pending" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="notes">
          <el-input
            v-model="formData.notes"
            type="textarea"
            :rows="2"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
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
        <el-button type="primary" @click="handleEditFromDetail">编辑</el-button>
      </div>
    </el-dialog>

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
        <el-button type="primary" :loading="submitLoading" @click="submitComplete">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  getFollowupList,
  createFollowup,
  updateFollowup,
  deleteFollowup,
  updateFollowupStatus
} from '@/api/followups';
import { getAllPatients, getPatientDepartments } from '@/api/patients';
import { getScheduleDoctors } from '@/api/schedules';

const loading = ref(false);
const submitLoading = ref(false);
const tableData = ref([]);
const patientList = ref([]);
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
const dialogTitle = ref('新增随访');
const formRef = ref(null);
const currentId = ref(null);

const formData = reactive({
  patient_id: null,
  followup_date: '',
  followup_type: '电话随访',
  content: '',
  result: '',
  next_followup_date: '',
  department: '',
  doctor: '',
  status: 'pending',
  notes: ''
});

const formRules = {
  patient_id: [{ required: true, message: '请选择患者', trigger: 'change' }],
  followup_date: [{ required: true, message: '请选择随访日期', trigger: 'change' }]
};

const detailVisible = ref(false);
const detailData = ref({});

const completeDialogVisible = ref(false);
const completeForm = reactive({
  result: ''
});
const completeId = ref(null);

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

const loadData = async () => {
  loading.value = true;
  try {
    const res = await getFollowupList({
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

const handlePatientChange = (patientId) => {
  const patient = patientList.value.find(p => p.id === patientId);
  if (patient) {
    formData.department = patient.department || '';
    formData.doctor = patient.doctor || '';
  }
};

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
  formData.patient_id = null;
  formData.followup_date = '';
  formData.followup_type = '电话随访';
  formData.content = '';
  formData.result = '';
  formData.next_followup_date = '';
  formData.department = '';
  formData.doctor = '';
  formData.status = 'pending';
  formData.notes = '';
  formRef.value?.clearValidate();
};

const handleAdd = () => {
  dialogType.value = 'add';
  dialogTitle.value = '新增随访';
  resetForm();
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  dialogType.value = 'edit';
  dialogTitle.value = '编辑随访';
  currentId.value = row.id;
  Object.assign(formData, row);
  dialogVisible.value = true;
};

const handleView = (row) => {
  detailData.value = row;
  detailVisible.value = true;
};

const handleEditFromDetail = () => {
  detailVisible.value = false;
  handleEdit(detailData.value);
};

const handleComplete = (row) => {
  completeId.value = row.id;
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
  submitLoading.value = true;
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
    submitLoading.value = false;
  }
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true;
      try {
        if (dialogType.value === 'add') {
          await createFollowup(formData);
          ElMessage.success('新增成功');
        } else {
          await updateFollowup(currentId.value, formData);
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
  ElMessageBox.confirm(`确定要删除这条随访记录吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteFollowup(row.id);
      ElMessage.success('删除成功');
      loadData();
    } catch (e) {
      console.error(e);
    }
  }).catch(() => {});
};

onMounted(() => {
  loadData();
  loadPatients();
  loadDepartments();
  loadDoctors();
});
</script>

<style scoped>
.followups-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-card {
  border-radius: 8px;
}

.table-card {
  border-radius: 8px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.detail-content {
  line-height: 1.6;
  white-space: pre-wrap;
  min-height: 40px;
  max-height: 300px;
  overflow-y: auto;
  overflow-x: hidden;
  word-break: break-word;
  overflow-wrap: break-word;
  padding: 8px 12px;
  background-color: #fafafa;
  border-radius: 6px;
}
</style>
