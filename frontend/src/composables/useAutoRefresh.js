import { onMounted, onUnmounted, readonly, ref } from 'vue';

export function useAutoRefresh(callback, intervalMs = 60 * 1000, options = {}) {
  const { immediate = true, enabled = true } = options;
  const timer = ref(null);
  const isActive = ref(enabled);
  const lastRefresh = ref(null);

  const refresh = async () => {
    lastRefresh.value = new Date().toISOString();
    return callback && callback();
  };

  const start = () => {
    stop();
    isActive.value = true;
    timer.value = setInterval(refresh, intervalMs);
  };

  const stop = () => {
    isActive.value = false;
    if (timer.value) {
      clearInterval(timer.value);
      timer.value = null;
    }
  };

  const enable = () => {
    start();
  };

  const disable = () => {
    stop();
  };

  const setInterval = (newInterval) => {
    if (isActive.value) {
      stop();
      intervalMs = newInterval;
      start();
    }
  };

  onMounted(() => {
    if (immediate && isActive.value) {
      refresh();
    }
    if (isActive.value) {
      start();
    }
  });

  onUnmounted(() => {
    stop();
  });

  return {
    isActive: readonly(isActive),
    lastRefresh: readonly(lastRefresh),
    refresh,
    start,
    stop,
    enable,
    disable,
    setInterval
  };
}

export default useAutoRefresh;
