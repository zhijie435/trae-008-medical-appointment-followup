import { defineStore } from 'pinia';
import { ref, reactive } from 'vue';
import {
  getScheduleList,
  getMonthSchedule,
  getSchedule,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  updateScheduleStatus,
  getScheduleDepartments,
  getScheduleDoctors,
  checkScheduleConflict
} from '@/api/schedules';
import { generateCacheKey } from '@/utils/helpers.js';
import memoryCache from '@/utils/cache.js';

export const useScheduleStore = defineStore('schedule', () => {
  const loading = ref(false);
  const list = ref([]);
  const monthSchedules = ref([]);
  const departments = ref([]);
  const doctors = ref([]);
  const current = ref(null);

  const conflictWarn = ref([]);

  const fetchList = async (query = {}) => {
    loading.value = true;
    try {
      const cacheKey = generateCacheKey('schedules:list', query);
      const res = await memoryCache.wrap(cacheKey, () => getScheduleList(query), 15 * 1000);
      list.value = res.data;
      return res.data;
    } finally {
      loading.value = false;
    }
  };

  const fetchMonth = async (year, month, query = {}) => {
    loading.value = true;
    try {
      const cacheKey = generateCacheKey(`schedules:month:${year}-${month}`, query);
      const res = await memoryCache.wrap(cacheKey, () => getMonthSchedule(year, month, query), 2 * 60 * 1000);
      monthSchedules.value = res.data;
      return res.data;
    } finally {
      loading.value = false;
    }
  };

  const fetchDepartments = async (force = false) => {
    if (departments.value.length > 0 && !force) return departments.value;
    try {
      const res = await memoryCache.wrap('schedules:departments', () => getScheduleDepartments(), 10 * 60 * 1000);
      departments.value = res.data || [];
      return res.data;
    } catch (e) {
      return [];
    }
  };

  const fetchDoctors = async (department = '', force = false) => {
    if (!force && doctors.value.length > 0 && !department) return doctors.value;
    try {
      const cacheKey = `schedules:doctors:${department || 'all'}`;
      const res = await memoryCache.wrap(cacheKey, () => getScheduleDoctors(department), 10 * 60 * 1000);
      doctors.value = res.data || [];
      return res.data;
    } catch (e) {
      return [];
    }
  };

  const fetchById = async (id) => {
    const res = await getSchedule(id);
    current.value = res.data;
    return res.data;
  };

  const checkConflict = async (data) => {
    const res = await checkScheduleConflict(data);
    conflictWarn.value = res.data?.conflicts || [];
    return res.data;
  };

  const create = async (data) => {
    const res = await createSchedule(data);
    memoryCache.invalidatePrefix('schedules:');
    conflictWarn.value = [];
    return res.data;
  };

  const update = async (id, data) => {
    const res = await updateSchedule(id, data);
    memoryCache.invalidatePrefix('schedules:');
    conflictWarn.value = [];
    return res.data;
  };

  const updateStatus = async (id, status) => {
    const res = await updateScheduleStatus(id, { status });
    memoryCache.invalidatePrefix('schedules:');
    return res.data;
  };

  const remove = async (id) => {
    await deleteSchedule(id);
    memoryCache.invalidatePrefix('schedules:');
  };

  const clearConflictWarn = () => {
    conflictWarn.value = [];
  };

  const clearCache = () => {
    memoryCache.invalidatePrefix('schedules:');
  };

  return {
    loading,
    list,
    monthSchedules,
    departments,
    doctors,
    current,
    conflictWarn,
    fetchList,
    fetchMonth,
    fetchDepartments,
    fetchDoctors,
    fetchById,
    checkConflict,
    create,
    update,
    updateStatus,
    remove,
    clearConflictWarn,
    clearCache
  };
});

export default useScheduleStore;
