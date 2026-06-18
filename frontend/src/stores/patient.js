import { defineStore } from 'pinia';
import { ref, computed, reactive } from 'vue';
import {
  getPatientList,
  getAllPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
  getPatientDepartments
} from '@/api/patients';
import { DEFAULT_PAGE_SIZE } from '@/constants/index.js';
import { generateCacheKey } from '@/utils/helpers.js';
import memoryCache from '@/utils/cache.js';

export const usePatientStore = defineStore('patient', () => {
  const loading = ref(false);
  const list = ref([]);
  const allPatients = ref([]);
  const departments = ref([]);
  const current = ref(null);

  const pagination = reactive({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0
  });

  const totalPages = computed(() => Math.ceil(pagination.total / pagination.pageSize));

  const fetchList = async (query = {}) => {
    loading.value = true;
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...query
    };
    try {
      const cacheKey = generateCacheKey('patients:list', params);
      const res = await memoryCache.wrap(cacheKey, () => getPatientList(params), 30 * 1000);
      list.value = res.data.list;
      pagination.total = res.data.total;
      pagination.page = res.data.page;
      pagination.pageSize = res.data.pageSize;
      return res.data;
    } finally {
      loading.value = false;
    }
  };

  const fetchAll = async (force = false) => {
    if (allPatients.value.length > 0 && !force) return allPatients.value;
    try {
      const res = await memoryCache.wrap('patients:all', () => getAllPatients(), 5 * 60 * 1000);
      allPatients.value = res.data;
      return res.data;
    } catch (e) {
      return [];
    }
  };

  const fetchDepartments = async (force = false) => {
    if (departments.value.length > 0 && !force) return departments.value;
    try {
      const res = await memoryCache.wrap('patients:departments', () => getPatientDepartments(), 10 * 60 * 1000);
      departments.value = res.data || [];
      return res.data;
    } catch (e) {
      return [];
    }
  };

  const fetchById = async (id) => {
    const res = await getPatient(id);
    current.value = res.data;
    return res.data;
  };

  const create = async (data) => {
    const res = await createPatient(data);
    memoryCache.invalidatePrefix('patients:');
    return res.data;
  };

  const update = async (id, data) => {
    const res = await updatePatient(id, data);
    memoryCache.invalidatePrefix('patients:');
    return res.data;
  };

  const remove = async (id) => {
    await deletePatient(id);
    memoryCache.invalidatePrefix('patients:');
  };

  const resetPagination = () => {
    pagination.page = 1;
    pagination.pageSize = DEFAULT_PAGE_SIZE;
  };

  const clearCache = () => {
    memoryCache.invalidatePrefix('patients:');
  };

  return {
    loading,
    list,
    allPatients,
    departments,
    current,
    pagination,
    totalPages,
    fetchList,
    fetchAll,
    fetchDepartments,
    fetchById,
    create,
    update,
    remove,
    resetPagination,
    clearCache
  };
});

export default usePatientStore;
