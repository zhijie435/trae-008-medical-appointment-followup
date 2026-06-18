export const PATIENT_STATUS = {
  ACTIVE: 'active',
  DISCHARGED: 'discharged',
  INACTIVE: 'inactive'
};

export const PATIENT_STATUS_OPTIONS = [
  { value: PATIENT_STATUS.ACTIVE, label: '活跃', type: 'success' },
  { value: PATIENT_STATUS.DISCHARGED, label: '已出院', type: 'info' },
  { value: PATIENT_STATUS.INACTIVE, label: '其他', type: 'warning' }
];

export const FOLLOWUP_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const FOLLOWUP_STATUS_OPTIONS = [
  { value: FOLLOWUP_STATUS.PENDING, label: '待随访', type: 'warning' },
  { value: FOLLOWUP_STATUS.COMPLETED, label: '已完成', type: 'success' },
  { value: FOLLOWUP_STATUS.CANCELLED, label: '已取消', type: 'info' }
];

export const FOLLOWUP_TYPES = ['电话随访', '门诊随访', '上门随访', '微信随访', '其他'];

export const FOLLOWUP_TYPE_OPTIONS = FOLLOWUP_TYPES.map((t, i) => ({
  value: t,
  label: t,
  type: ['primary', 'success', 'warning', 'info', 'info'][i]
}));

export const SCHEDULE_STATUS = {
  SCHEDULED: 'scheduled',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const SCHEDULE_STATUS_OPTIONS = [
  { value: SCHEDULE_STATUS.SCHEDULED, label: '已排', type: 'primary' },
  { value: SCHEDULE_STATUS.ONGOING, label: '进行中', type: 'warning' },
  { value: SCHEDULE_STATUS.COMPLETED, label: '已完成', type: 'success' },
  { value: SCHEDULE_STATUS.CANCELLED, label: '已取消', type: 'info' }
];

export const SCHEDULE_TYPES = {
  FOLLOWUP: 'followup',
  CLINIC: 'clinic',
  MEETING: 'meeting',
  OTHER: 'other'
};

export const SCHEDULE_TYPE_OPTIONS = [
  { value: SCHEDULE_TYPES.FOLLOWUP, label: '随访', type: 'primary' },
  { value: SCHEDULE_TYPES.CLINIC, label: '门诊', type: 'success' },
  { value: SCHEDULE_TYPES.MEETING, label: '会议', type: 'warning' },
  { value: SCHEDULE_TYPES.OTHER, label: '其他', type: 'info' }
];

export const MENU_ITEMS = [
  { path: '/dashboard', title: '首页概览', icon: 'HomeFilled' },
  { path: '/patients', title: '病例管理', icon: 'User' },
  { path: '/followups', title: '随访管理', icon: 'Document' },
  { path: '/schedule', title: '排班管理', icon: 'Calendar' }
];

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export const RESPONSE_CODE = {
  SUCCESS: 0,
  ERROR: -1
};

export const CONFLICT_TYPES = {
  DOCTOR: 'doctor',
  ROOM: 'room',
  PATIENT: 'patient',
  TIME: 'time'
};

export default {
  PATIENT_STATUS,
  PATIENT_STATUS_OPTIONS,
  FOLLOWUP_STATUS,
  FOLLOWUP_STATUS_OPTIONS,
  FOLLOWUP_TYPES,
  FOLLOWUP_TYPE_OPTIONS,
  SCHEDULE_STATUS,
  SCHEDULE_STATUS_OPTIONS,
  SCHEDULE_TYPES,
  SCHEDULE_TYPE_OPTIONS,
  MENU_ITEMS,
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  RESPONSE_CODE,
  CONFLICT_TYPES
};
