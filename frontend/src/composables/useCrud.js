import { ref, reactive, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

export function useCrud(options = {}) {
  const {
    store,
    fetchMethod = 'fetchList',
    createMethod = 'create',
    updateMethod = 'update',
    deleteMethod = 'remove',
    confirmOnDelete = true,
    deleteConfirmTitle = '提示',
    deleteConfirmContent = (row) => `确定要删除这条记录吗？`,
    successMessages = {
      create: '创建成功',
      update: '更新成功',
      delete: '删除成功'
    }
  } = options;

  const loading = ref(false);
  const submitting = ref(false);
  const dialogVisible = ref(false);
  const dialogMode = ref('add');
  const dialogTitle = computed(() => (dialogMode.value === 'add' ? '新增' : '编辑'));
  const currentId = ref(null);

  const formData = reactive({});
  const formRef = ref(null);
  const initialFormData = {};

  const setInitialFormData = (data) => {
    Object.assign(initialFormData, data);
    resetForm();
  };

  const resetForm = () => {
    Object.keys(formData).forEach((k) => delete formData[k]);
    Object.assign(formData, initialFormData);
    formRef.value?.clearValidate?.();
  };

  const openAddDialog = (data = {}) => {
    dialogMode.value = 'add';
    currentId.value = null;
    resetForm();
    Object.assign(formData, data);
    dialogVisible.value = true;
  };

  const openEditDialog = (row, data = {}) => {
    dialogMode.value = 'edit';
    currentId.value = row.id;
    resetForm();
    Object.assign(formData, row, data);
    dialogVisible.value = true;
  };

  const closeDialog = () => {
    dialogVisible.value = false;
    resetForm();
  };

  const fetchList = async (params = {}) => {
    loading.value = true;
    try {
      return await store[fetchMethod](params);
    } finally {
      loading.value = false;
    }
  };

  const validateForm = async () => {
    if (!formRef.value) return true;
    try {
      await formRef.value.validate();
      return true;
    } catch {
      return false;
    }
  };

  const handleCreate = async () => {
    const valid = await validateForm();
    if (!valid) return null;

    submitting.value = true;
    try {
      const result = await store[createMethod](formData);
      ElMessage.success(successMessages.create);
      closeDialog();
      return result;
    } finally {
      submitting.value = false;
    }
  };

  const handleUpdate = async () => {
    const valid = await validateForm();
    if (!valid) return null;

    submitting.value = true;
    try {
      const result = await store[updateMethod](currentId.value, formData);
      ElMessage.success(successMessages.update);
      closeDialog();
      return result;
    } finally {
      submitting.value = false;
    }
  };

  const handleSubmit = async () => {
    return dialogMode.value === 'add' ? handleCreate() : handleUpdate();
  };

  const handleDelete = async (row) => {
    if (confirmOnDelete) {
      try {
        await ElMessageBox.confirm(
          typeof deleteConfirmContent === 'function' ? deleteConfirmContent(row) : deleteConfirmContent,
          deleteConfirmTitle,
          { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
        );
      } catch {
        return false;
      }
    }

    loading.value = true;
    try {
      await store[deleteMethod](row.id);
      ElMessage.success(successMessages.delete);
      return true;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    submitting,
    dialogVisible,
    dialogMode,
    dialogTitle,
    currentId,
    formData,
    formRef,
    setInitialFormData,
    resetForm,
    openAddDialog,
    openEditDialog,
    closeDialog,
    fetchList,
    validateForm,
    handleCreate,
    handleUpdate,
    handleSubmit,
    handleDelete
  };
}

export default useCrud;
