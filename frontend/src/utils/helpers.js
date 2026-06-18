import {
  PATIENT_STATUS_OPTIONS,
  FOLLOWUP_STATUS_OPTIONS,
  FOLLOWUP_TYPE_OPTIONS,
  SCHEDULE_STATUS_OPTIONS,
  SCHEDULE_TYPE_OPTIONS
} from '../constants/index.js';

const findOption = (options, value) => options.find((o) => o.value === value);

export const getPatientStatusMeta = (status) =>
  findOption(PATIENT_STATUS_OPTIONS, status) || { label: status, type: 'info' };

export const getPatientStatusType = (status) => getPatientStatusMeta(status).type;
export const getPatientStatusText = (status) => getPatientStatusMeta(status).label;

export const getFollowupStatusMeta = (status) =>
  findOption(FOLLOWUP_STATUS_OPTIONS, status) || { label: status, type: 'info' };

export const getFollowupStatusType = (status) => getFollowupStatusMeta(status).type;
export const getFollowupStatusText = (status) => getFollowupStatusMeta(status).label;

export const getFollowupTypeMeta = (type) =>
  findOption(FOLLOWUP_TYPE_OPTIONS, type) || { label: type, type: 'info' };

export const getFollowupTypeTag = (type) => getFollowupTypeMeta(type).type;
export const getFollowupTypeText = (type) => getFollowupTypeMeta(type).label;

export const getScheduleStatusMeta = (status) =>
  findOption(SCHEDULE_STATUS_OPTIONS, status) || { label: status, type: 'info' };

export const getScheduleStatusType = (status) => getScheduleStatusMeta(status).type;
export const getScheduleStatusText = (status) => getScheduleStatusMeta(status).label;

export const getScheduleTypeMeta = (type) =>
  findOption(SCHEDULE_TYPE_OPTIONS, type) || { label: type, type: 'info' };

export const getScheduleTypeTag = (type) => getScheduleTypeMeta(type).type;
export const getScheduleTypeText = (type) => getScheduleTypeMeta(type).label;

export const getTimelineType = (status) => {
  const map = { pending: 'warning', completed: 'success', cancelled: 'info' };
  return map[status] || 'primary';
};

export const debounce = (fn, delay = 300) => {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
};

export const throttle = (fn, delay = 300) => {
  let last = 0;
  return function (...args) {
    const now = Date.now();
    if (now - last >= delay) {
      last = now;
      fn.apply(this, args);
    }
  };
};

export const generateCacheKey = (prefix, params) => {
  const sorted = Object.keys(params || {})
    .sort()
    .reduce((acc, k) => {
      acc[k] = params[k];
      return acc;
    }, {});
  return `${prefix}:${JSON.stringify(sorted)}`;
};

export const safeGet = (obj, path, defaultValue = null) => {
  if (!obj) return defaultValue;
  const keys = path.split('.');
  let result = obj;
  for (const key of keys) {
    if (result == null) return defaultValue;
    result = result[key];
  }
  return result == null ? defaultValue : result;
};

export const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

export const pick = (obj, keys) => {
  return keys.reduce((acc, k) => {
    if (obj && Object.prototype.hasOwnProperty.call(obj, k)) {
      acc[k] = obj[k];
    }
    return acc;
  }, {});
};

export const omit = (obj, keys) => {
  const keySet = new Set(keys);
  return Object.keys(obj || {}).reduce((acc, k) => {
    if (!keySet.has(k)) acc[k] = obj[k];
    return acc;
  }, {});
};

export default {
  getPatientStatusType,
  getPatientStatusText,
  getFollowupStatusType,
  getFollowupStatusText,
  getFollowupTypeTag,
  getFollowupTypeText,
  getScheduleStatusType,
  getScheduleStatusText,
  getScheduleTypeTag,
  getScheduleTypeText,
  getTimelineType,
  debounce,
  throttle,
  generateCacheKey,
  safeGet,
  isEmpty,
  pick,
  omit
};
