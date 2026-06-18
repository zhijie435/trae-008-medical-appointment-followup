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
              <el-input v-model="formData.department" placeholder="请输入科室" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="主治医生" prop="doctor">
              <el-input v-model="formData.doctor" placeholder="请输入主治医生" />
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

    <el-dialog v-model="detailVisible" title="病例详情" width="720px" destroy-on-close>
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
        <el-descriptions-item label="病例摘要" :span="2">
          <div class="detail-notes">{{ detailData.notes || '暂无' }}</div>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ detailData.created_at }}</el-descriptions-item>
      </el-descriptions>
      <div style="margin-top: 20px; text-align: right">
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleEditFromDetail">编辑</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getPatientList, createPatient, updatePatient, deletePatient } from '@/api/patients';

const loading = ref(false);
const submitLoading = ref(false);
const tableData = ref([]);

const searchForm = reactive({
  keyword: '',
  status: ''
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

const loadData = async () => {
  loading.value = true;
  try {
    const res = await getPatientList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword,
      status: searchForm.status
    });
    tableData.value = res.data.list;
    pagination.total = res.data.total;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.page = 1;
  loadData();
};

const handleReset = () => {
  searchForm.keyword = '';
  searchForm.status = '';
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

const handleAdd = () => {
  dialogType.value = 'add';
  dialogTitle.value = '新增病例';
  resetForm();
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  dialogType.value = 'edit';
  dialogTitle.value = '编辑病例';
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
</style>
