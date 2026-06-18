import { usePatientStore } from './patient.js';
import { useFollowupStore } from './followup.js';
import { useScheduleStore } from './schedule.js';
import { useDashboardStore } from './dashboard.js';

export { usePatientStore, useFollowupStore, useScheduleStore, useDashboardStore };

export default {
  usePatientStore,
  useFollowupStore,
  useScheduleStore,
  useDashboardStore
};
