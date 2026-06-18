import { ref, reactive, computed } from 'vue';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@/constants/index.js';

export function usePagination(initialPage = 1, initialPageSize = DEFAULT_PAGE_SIZE) {
  const pagination = reactive({
    page: initialPage,
    pageSize: initialPageSize,
    total: 0
  });

  const pageSizes = PAGE_SIZE_OPTIONS;

  const totalPages = computed(() => Math.ceil(pagination.total / pagination.pageSize));

  const hasPrev = computed(() => pagination.page > 1);
  const hasNext = computed(() => pagination.page < totalPages.value);

  const setPage = (page) => {
    pagination.page = Math.max(1, page);
  };

  const setPageSize = (size) => {
    pagination.pageSize = size;
    pagination.page = 1;
  };

  const setTotal = (total) => {
    pagination.total = total;
  };

  const reset = () => {
    pagination.page = initialPage;
    pagination.pageSize = initialPageSize;
    pagination.total = 0;
  };

  const nextPage = () => {
    if (hasNext.value) pagination.page++;
  };

  const prevPage = () => {
    if (hasPrev.value) pagination.page--;
  };

  const goToPage = (page) => {
    const target = Math.max(1, Math.min(page, totalPages.value || 1));
    pagination.page = target;
  };

  const updateFromResult = (result) => {
    if (result) {
      pagination.page = result.page || pagination.page;
      pagination.pageSize = result.pageSize || pagination.pageSize;
      pagination.total = result.total || 0;
    }
  };

  return {
    pagination,
    pageSizes,
    totalPages,
    hasPrev,
    hasNext,
    setPage,
    setPageSize,
    setTotal,
    reset,
    nextPage,
    prevPage,
    goToPage,
    updateFromResult
  };
}

export default usePagination;
