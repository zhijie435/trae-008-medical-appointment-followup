import cache from '../utils/cache.js';
import { notFound, badRequest, conflict } from '../utils/response.js';
import { SCHEDULE_STATUS, SCHEDULE_TYPES, CONFLICT_TYPES } from '../constants/index.js';
import { isValidTimeRange } from '../utils/time.js';

class ScheduleService {
  constructor(repos) {
    this.repo = repos.schedule;
    this.patientRepo = repos.patient;
  }

  _invalidateCache() {
    cache.invalidate('schedules');
    cache.invalidate('patients');
  }

  _getConflictStatuses() {
    return [SCHEDULE_STATUS.SCHEDULED, SCHEDULE_STATUS.ONGOING];
  }

  async listFiltered(query) {
    const cacheKey = JSON.stringify(query);
    return cache.wrap('schedules', `filtered:${cacheKey}`, () =>
      this.repo.listFiltered(query)
    );
  }

  async listByMonth(year, month, query) {
    const cacheKey = `${year}-${month}:${JSON.stringify(query)}`;
    return cache.wrap('schedules', `month:${cacheKey}`, () =>
      this.repo.listByMonth(year, month, query)
    );
  }

  async getById(id) {
    const schedule = this.repo.findById(id);
    if (!schedule) throw notFound('排班不存在');
    return schedule;
  }

  async getDepartments() {
    return cache.wrap('schedules', 'departments', () => this.repo.getDepartments());
  }

  async getDoctors(department = '') {
    return cache.wrap('schedules', `doctors:${department || 'all'}`, () =>
      this.repo.getDoctors(department)
    );
  }

  async checkConflict(data) {
    const { date, start_time, end_time, doctor, room, patient_id, exclude_id } = data;

    if (!date || !start_time) {
      return { hasConflict: false, conflicts: [] };
    }

    if (!isValidTimeRange(start_time, end_time)) {
      return {
        hasConflict: true,
        conflicts: [{ type: CONFLICT_TYPES.TIME, message: '结束时间必须晚于开始时间' }]
      };
    }

    const conflicts = this.repo.findConflicts({
      date, start_time, end_time, doctor, room, patient_id,
      excludeId: exclude_id
    });
    return { hasConflict: conflicts.length > 0, conflicts };
  }

  _validateBase({ title, date, start_time, end_time }) {
    if (!title || !date) throw badRequest('标题和日期为必填项');
    if (start_time && end_time && !isValidTimeRange(start_time, end_time)) {
      throw badRequest('结束时间必须晚于开始时间');
    }
  }

  _resolvePatientInfo(data) {
    const schedule = { ...data };
    if (schedule.type === SCHEDULE_TYPES.FOLLOWUP && schedule.patient_id && !schedule.patient_name) {
      const patient = this.patientRepo.findById(schedule.patient_id);
      if (patient) schedule.patient_name = patient.name;
    }
    return schedule;
  }

  async create(data) {
    this._validateBase(data);

    const schedule = this._resolvePatientInfo({
      title: data.title,
      date: data.date,
      start_time: data.start_time || '',
      end_time: data.end_time || '',
      type: data.type || SCHEDULE_TYPES.FOLLOWUP,
      patient_id: data.patient_id || null,
      patient_name: data.patient_name || '',
      doctor: data.doctor || '',
      department: data.department || '',
      room: data.room || '',
      status: data.status || SCHEDULE_STATUS.SCHEDULED,
      description: data.description || ''
    });

    if (this._getConflictStatuses().includes(schedule.status) && schedule.date && schedule.start_time) {
      const conflicts = this.repo.findConflicts({
        date: schedule.date,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        doctor: schedule.doctor,
        room: schedule.room,
        patient_id: schedule.patient_id
      });
      if (conflicts.length > 0) {
        throw conflict('预约存在冲突', { conflicts });
      }
    }

    const created = this.repo.create(schedule);
    this._invalidateCache();
    return created;
  }

  async update(id, data) {
    const existing = this.repo.findById(id);
    if (!existing) throw notFound('排班不存在');

    const title = data.title !== undefined ? data.title : existing.title;
    const date = data.date !== undefined ? data.date : existing.date;
    this._validateBase({ title, date, start_time: data.start_time, end_time: data.end_time });

    const schedule = this._resolvePatientInfo({
      ...existing,
      title,
      date,
      start_time: data.start_time !== undefined ? data.start_time : existing.start_time,
      end_time: data.end_time !== undefined ? data.end_time : existing.end_time,
      type: data.type !== undefined ? data.type : existing.type,
      patient_id: data.patient_id !== undefined ? data.patient_id : existing.patient_id,
      patient_name: data.patient_name !== undefined ? data.patient_name : existing.patient_name,
      doctor: data.doctor !== undefined ? data.doctor : existing.doctor,
      department: data.department !== undefined ? data.department : existing.department,
      room: data.room !== undefined ? data.room : existing.room,
      status: data.status !== undefined ? data.status : existing.status,
      description: data.description !== undefined ? data.description : existing.description
    });

    if (this._getConflictStatuses().includes(schedule.status) && schedule.date && schedule.start_time) {
      const conflicts = this.repo.findConflicts({
        date: schedule.date,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        doctor: schedule.doctor,
        room: schedule.room,
        patient_id: schedule.patient_id,
        excludeId: id
      });
      if (conflicts.length > 0) {
        throw conflict('预约存在冲突', { conflicts });
      }
    }

    const updated = this.repo.update(id, schedule);
    this._invalidateCache();
    return updated;
  }

  async updateStatus(id, { status }) {
    const existing = this.repo.findById(id);
    if (!existing) throw notFound('排班不存在');
    const updated = this.repo.patch(id, { status });
    this._invalidateCache();
    return updated;
  }

  async delete(id) {
    const existing = this.repo.findById(id);
    if (!existing) throw notFound('排班不存在');
    const result = this.repo.delete(id);
    this._invalidateCache();
    return result;
  }
}

export default ScheduleService;
