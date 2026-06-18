import BaseRepository from './BaseRepository.js';
import { buildWhereClause, buildKeywordCondition, buildOrderClause, buildPagination } from '../utils/queryBuilder.js';
import { isTimeOverlap } from '../utils/time.js';
import { SCHEDULE_STATUS, CONFLICT_TYPES } from '../constants/index.js';

class ScheduleRepository extends BaseRepository {
  constructor(db) {
    super(db, 'schedules', 'id');
    this.db = db;
  }

  _buildConditions({ type, status, department, startDate, endDate }) {
    const conditions = [];
    if (type) conditions.push({ field: 'type', value: type });
    if (status) conditions.push({ field: 'status', value: status });
    if (department) conditions.push({ field: 'department', value: department });
    if (startDate) conditions.push({ field: 'date', operator: '>=', value: startDate });
    if (endDate) conditions.push({ field: 'date', operator: '<=', value: endDate });
    return conditions;
  }

  listFiltered({ startDate, endDate, type, status, department, keyword }) {
    const conditions = this._buildConditions({ type, status, department, startDate, endDate });
    const keywordFields = ['title', 'patient_name', 'doctor'];
    const orders = [
      { field: 'date', direction: 'ASC' },
      { field: 'start_time', direction: 'ASC' }
    ];
    return this.findWithKeyword(keyword, keywordFields, conditions, orders);
  }

  listByMonth(year, month, { type, status, department }) {
    const nextMonth = month == 12 ? 1 : parseInt(month, 10) + 1;
    const nextYear = month == 12 ? parseInt(year, 10) + 1 : year;
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

    const conditions = [
      { field: 'date', operator: '>=', value: startDate },
      { field: 'date', operator: '<', value: endDate }
    ];
    if (type) conditions.push({ field: 'type', value: type });
    if (status) conditions.push({ field: 'status', value: status });
    if (department) conditions.push({ field: 'department', value: department });

    return this.findAll(conditions, [
      { field: 'date', direction: 'ASC' },
      { field: 'start_time', direction: 'ASC' }
    ]);
  }

  getDepartments() {
    const rows = this.raw(`
      SELECT DISTINCT department FROM (
        SELECT department FROM patients WHERE department IS NOT NULL AND department != ''
        UNION
        SELECT department FROM schedules WHERE department IS NOT NULL AND department != ''
      ) ORDER BY department
    `);
    return rows.map((r) => r.department);
  }

  getDoctors(department = '') {
    let sql = `
      SELECT DISTINCT doctor FROM (
        SELECT doctor, department FROM patients WHERE doctor IS NOT NULL AND doctor != ''
        UNION
        SELECT doctor, department FROM schedules WHERE doctor IS NOT NULL AND doctor != ''
      )
    `;
    const params = [];
    if (department) {
      sql += ' WHERE department = ?';
      params.push(department);
    }
    sql += ' ORDER BY doctor';
    const rows = this.raw(sql, params);
    return rows.map((r) => r.doctor);
  }

  findConflicts({ date, start_time, end_time, doctor, room, patient_id, excludeId = null }) {
    const conflicts = [];
    const activeStatuses = [SCHEDULE_STATUS.SCHEDULED, SCHEDULE_STATUS.ONGOING];

    let sql = `SELECT * FROM schedules WHERE date = ? AND status IN (${activeStatuses.map(() => '?').join(',')})`;
    const params = [date, ...activeStatuses];

    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }

    const sameDay = this.raw(sql, params);

    for (const s of sameDay) {
      if (!isTimeOverlap(start_time, end_time, s.start_time, s.end_time)) continue;

      if (doctor && s.doctor && s.doctor === doctor) {
        conflicts.push({ type: CONFLICT_TYPES.DOCTOR, message: `该时间段医生[${doctor}]已有排班：${s.title}`, schedule: s });
      }
      if (room && s.room && s.room === room) {
        conflicts.push({ type: CONFLICT_TYPES.ROOM, message: `该时间段诊室[${room}]已被占用：${s.title}`, schedule: s });
      }
      if (patient_id && s.patient_id && s.patient_id == patient_id) {
        conflicts.push({ type: CONFLICT_TYPES.PATIENT, message: `该患者此时间段已有预约：${s.title}`, schedule: s });
      }
    }

    return conflicts;
  }
}

export default ScheduleRepository;
