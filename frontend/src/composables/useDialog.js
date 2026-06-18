import { ref, shallowRef } from 'vue';

export function useDialog(initialVisible = false) {
  const visible = ref(initialVisible);
  const loading = ref(false);
  const title = ref('');
  const payload = shallowRef(null);

  const open = (data = null, dialogTitle = null) => {
    if (data !== undefined && data !== null) payload.value = data;
    if (dialogTitle !== null) title.value = dialogTitle;
    visible.value = true;
  };

  const close = () => {
    visible.value = false;
  };

  const toggle = () => {
    visible.value = !visible.value;
  };

  const withLoading = async (fn) => {
    loading.value = true;
    try {
      const result = await fn();
      return result;
    } finally {
      loading.value = false;
    }
  };

  const confirm = async (fn) => {
    loading.value = true;
    try {
      const result = await fn();
      visible.value = false;
      payload.value = null;
      return result;
    } finally {
      loading.value = false;
    }
  };

  const setTitle = (t) => {
    title.value = t;
  };

  const reset = () => {
    visible.value = false;
    loading.value = false;
    title.value = '';
    payload.value = null;
  };

  return {
    visible,
    loading,
    title,
    payload,
    open,
    close,
    toggle,
    withLoading,
    confirm,
    setTitle,
    reset
  };
}

export default useDialog;
