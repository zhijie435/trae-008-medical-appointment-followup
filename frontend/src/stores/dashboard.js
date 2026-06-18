import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import dayjs from 'dayjs';
import { usePatientStore } from './patient.js';
import { useFollowupStore } from './followup.js';
import { useScheduleStore } from './schedule.js';

export const useDashboardStore = defineStore('dashboard', () => {
  const loading = ref(false);

  const stats = ref({
    patientCount: 0,
    followupCount: 0,
    todayPending: 0,
    todaySchedules: 0
  });

  const recentFollowups = ref([]);
  const todaySchedules = ref([]);
  const todayPending = ref([]);

  const patientStore = usePatientStore();
  const followupStore = useFollowupStore();
  const scheduleStore = useScheduleStore();

  const completionRate = computed(() => {
    if (stats.value.followupCount === 0) return 0;
    const completed = stats.value.followupCount - (patientStore.pendingCount || 0);
    return Math.round((completed / stats.value.followupCount) * 100);
  });

  const loadStats = async () => {
    loading.value = true;
    try {
      const today = dayjs().format('YYYY-MM-DD');
      const [patientsRes, followupsRes, schedulesRes, pendingRes] = await Promise.all([
        patientStore.fetchList({ page: 1, pageSize: 100 }),
        followupStore.fetchList({ page: 1, pageSize: 100 }),
        scheduleStore.fetchList({ startDate: today, endDate: today }),
        followupStore.fetchTodayPending(true)
      ]);

      stats.value.patientCount = patientsRes.total;
      stats.value.followupCount = followupsRes.total;
      stats.value.todaySchedules = schedulesRes.length;
      stats.value.todayPending = pendingRes.length;

      recentFollowups.value = followupsRes.list.slice(0, 6);
      todaySchedules.value = schedulesRes;
      todayPending.value = pendingRes.map((item) => ({ ...item, completed: false }));
    } finally {
      loading.value = false;
    }
  };

  const refreshAll = async () => {
    patientStore.clearCache();
    followupStore.clearCache();
    scheduleStore.clearCache();
    await loadStats();
  };

  const markTodoCompleted = (id, result = '') => {
    return followupStore.updateStatus(id, { status: 'completed', result });
  };

  return {
    loading,
    stats,
    recentFollowups,
    todaySchedules,
    todayPending,
    completionRate,
    loadStats,
    refreshAll,
    markTodoCompleted
  };
});

export default useDashboardStore;
