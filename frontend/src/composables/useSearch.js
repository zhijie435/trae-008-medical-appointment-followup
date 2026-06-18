import { reactive, ref } from 'vue';
import { debounce } from '@/utils/helpers.js';

export function useSearch(initialQuery = {}, options = {}) {
  const { debounceMs = 300, immediate = false } = options;

  const searchForm = reactive({ ...initialQuery });
  const originalQuery = { ...initialQuery };
  const searching = ref(false);

  const setQuery = (query) => {
    Object.assign(searchForm, query);
  };

  const reset = () => {
    Object.keys(searchForm).forEach((k) => {
      delete searchForm[k];
    });
    Object.assign(searchForm, originalQuery);
  };

  const buildParams = () => {
    const params = {};
    Object.keys(searchForm).forEach((k) => {
      const v = searchForm[k];
      if (v !== undefined && v !== null && v !== '') {
        params[k] = v;
      }
    });
    return params;
  };

  const search = (fetchFn) => {
    searching.value = true;
    return Promise.resolve()
      .then(() => fetchFn(buildParams()))
      .finally(() => {
        searching.value = false;
      });
  };

  const debouncedSearch = debounce((fetchFn) => search(fetchFn), debounceMs);

  return {
    searchForm,
    searching,
    setQuery,
    reset,
    buildParams,
    search,
    debouncedSearch
  };
}

export default useSearch;
