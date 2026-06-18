import { ref } from 'vue';

export function useLoading() {
  const loading = ref(false);
  const submitting = ref(false);

  const withLoading = async (fn) => {
    loading.value = true;
    try {
      return await fn();
    } finally {
      loading.value = false;
    }
  };

  const withSubmitting = async (fn) => {
    submitting.value = true;
    try {
      return await fn();
    } finally {
      submitting.value = false;
    }
  };

  const startLoading = () => (loading.value = true);
  const stopLoading = () => (loading.value = false);
  const startSubmitting = () => (submitting.value = true);
  const stopSubmitting = () => (submitting.value = false);

  return {
    loading,
    submitting,
    withLoading,
    withSubmitting,
    startLoading,
    stopLoading,
    startSubmitting,
    stopSubmitting
  };
}

export default useLoading;
