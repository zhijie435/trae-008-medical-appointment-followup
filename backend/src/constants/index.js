export const PATIENT_STATUS = {
  ACTIVE: 'active',
  DISCHARGED: 'discharged',
  INACTIVE: 'inactive'
};

export const FOLLOWUP_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const FOLLOWUP_TYPES = ['电话随访', '门诊随访', '上门随访', '微信随访', '其他'];

export const SCHEDULE_STATUS = {
  SCHEDULED: 'scheduled',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const SCHEDULE_TYPES = {
  FOLLOWUP: 'followup',
  CLINIC: 'clinic',
  MEETING: 'meeting',
  OTHER: 'other'
};

export const CONFLICT_TYPES = {
  DOCTOR: 'doctor',
  ROOM: 'room',
  PATIENT: 'patient',
  TIME: 'time'
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500
};

export const RESPONSE_CODE = {
  SUCCESS: 0,
  ERROR: -1,
  UNAUTHORIZED: -2,
  FORBIDDEN: -3
};

export default {
  PATIENT_STATUS,
  FOLLOWUP_STATUS,
  FOLLOWUP_TYPES,
  SCHEDULE_STATUS,
  SCHEDULE_TYPES,
  CONFLICT_TYPES,
  HTTP_STATUS,
  RESPONSE_CODE
};
