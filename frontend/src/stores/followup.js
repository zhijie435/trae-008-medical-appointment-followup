import { defineStore } from 'pinia';
import { ref, computed, reactive } from 'vue';
import {
  getFollowupList,
  getFollowup,
  getFollowupsByPatient,
  createFollowup,
  updateFollowup,
  deleteFollowup,
  updateFollowupStatus,
  getTodayPendingFollowups
} from '@/api/followups';
import { DEFAULT_PAGE_SIZE } from '@/constants/index.js';
import { generateCacheKey } from '@/utils/helpers.js';
import memoryCache from '@/utils/cache.js';

export const useFollowupStore = defineStore('followup', () => {
  const loading = ref(false);
  const list = ref([]);
  const patientFollowups = ref([]);
  const todayPending = ref([]);
  const current = ref(null);

  const pagination = reactive({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0
  });

  const totalPages = computed(() => Math.ceil(pagination.total / pagination.pageSize));

  const pendingCount = computed(() =>
    list.value.filter((f) => f.status === 'pending').length
  );

  const fetchList = async (query = {}) => {
    loading.value = true;
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...query
    };
    try {
      const cacheKey = generateCacheKey('followups:list', params);
      const res = await memoryCache.wrap(cacheKey, () => getFollowupList(params), 15 * 1000);
      list.value = res.data.list;
      pagination.total = res.data.total;
      pagination.page = res.data.page;
      pagination.pageSize = res.data.pageSize;
      return res.data;
    } finally {
      loading.value = false;
    }
  };

  const fetchTodayPending = async (force = false) => {
    if (todayPending.value.length > 0 && !force) return todayPending.value;
    try {
      const res = await memoryCache.wrap('followups:today:pending', () => getTodayPendingFollowups(), 60 * 1000);
      todayPending.value = res.data;
      return res.data;
    } catch (e) {
      return [];
    }
  };

  const fetchByPatient = async (patientId, force = false) => {
    if (!force && patientFollowups.value.length > 0) return patientFollowups.value;
    try {
      const cacheKey = `followups:patient:${patientId}`;
      const res = await memoryCache.wrap(cacheKey, () => getFollowupsByPatient(patientId), 30 * 1000);
      patientFollowups.value = res.data;
      return res.data;
    } catch (e) {
      return [];
    }
  };

  const fetchById = async (id) => {
    const res = await getFollowup(id);
    current.value = res.data;
    return res.data;
  };

  const create = async (data) => {
    const res = await createFollowup(data);
    memoryCache.invalidatePrefix('followups:');
    return res.data;
  };

  const update = async (id, data) => {
    const res = await updateFollowup(id, data);
    memoryCache.invalidatePrefix('followups:');
    return res.data;
  };

  const updateStatus = async (id, data) => {
    const res = await updateFollowupStatus(id, data);
    memoryCache.invalidatePrefix('followups:');
    return res.data;
  };

  const remove = async (id) => {
    await deleteFollowup(id);
    memoryCache.invalidatePrefix('followups:');
  };

  const resetPagination = () => {
    pagination.page = 1;
    pagination.pageSize = DEFAULT_PAGE_SIZE;
  };

  const clearCache = () => {
    memoryCache.invalidatePrefix('followups:');
  };

  return {
    loading,
    list,
    patientFollowups,
    todayPending,
    current,
    pagination,
    totalPages,
    pendingCount,
    fetchList,
    fetchTodayPending,
    fetchByPatient,
    fetchById,
    create,
    update,
    updateStatus,
    remove,
    resetPagination,
    clearCache
  };
});

export default useFollowupStore;
