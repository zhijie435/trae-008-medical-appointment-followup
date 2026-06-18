import BaseRepository from './BaseRepository.js';
import { buildPagination, buildKeywordCondition } from '../utils/queryBuilder.js';
import { FOLLOWUP_STATUS } from '../constants/index.js';

const JOIN_CLAUSE = 'LEFT JOIN patients p ON f.patient_id = p.id';
const BASE_SELECT = `
  SELECT f.*, p.name as patient_name, p.gender, p.age, p.phone, p.diagnosis, p.department as patient_department
  FROM followups f ${JOIN_CLAUSE}
`;
const COUNT_SELECT = `SELECT COUNT(*) as count FROM followups f ${JOIN_CLAUSE}`;

class FollowupRepository extends BaseRepository {
  constructor(db) {
    super(db, 'followups', 'id');
    this.db = db;
  }

  _buildWhere({ patient_id, status, department, doctor }) {
    const clauses = [];
    const params = [];

    if (patient_id) {
      clauses.push('f.patient_id = ?');
      params.push(patient_id);
    }
    if (status) {
      clauses.push('f.status = ?');
      params.push(status);
    }
    if (department) {
      clauses.push('p.department = ?');
      params.push(department);
    }
    if (doctor) {
      clauses.push('(f.doctor = ? OR p.doctor = ?)');
      params.push(doctor, doctor);
    }

    return { clauses, params };
  }

  listPaginated({ page, pageSize, keyword, patient_id, status, department, doctor }) {
    const pagination = buildPagination(page, pageSize);
    const { clauses, params } = this._buildWhere({ patient_id, status, department, doctor });

    let whereClause = '';
    let allParams = [...params];

    if (clauses.length > 0) {
      whereClause = `WHERE ${clauses.join(' AND ')}`;
    }

    if (keyword) {
      const connector = clauses.length > 0 ? ' AND ' : ' WHERE ';
      whereClause += `${connector} (p.name LIKE ? OR f.content LIKE ?)`;
      allParams.push(`%${keyword}%`, `%${keyword}%`);
    }

    const countResult = this.rawGet(`${COUNT_SELECT} ${whereClause}`, allParams);

    const list = this.raw(
      `${BASE_SELECT} ${whereClause} ORDER BY f.followup_date DESC LIMIT ? OFFSET ?`,
      [...allParams, pagination.limit, pagination.offset]
    );

    return {
      list,
      total: countResult.count,
      page: pagination.page,
      pageSize: pagination.pageSize
    };
  }

  getByIdWithPatient(id) {
    return this.rawGet(`${BASE_SELECT} WHERE f.id = ?`, [id]);
  }

  listByPatient(patientId) {
    return this.raw(
      `SELECT * FROM followups WHERE patient_id = ? ORDER BY followup_date DESC`,
      [patientId]
    );
  }

  listTodayPending() {
    const today = new Date().toISOString().split('T')[0];
    return this.raw(
      `${BASE_SELECT} WHERE f.followup_date = ? AND f.status = ? ORDER BY f.created_at ASC`,
      [today, FOLLOWUP_STATUS.PENDING]
    );
  }
}

export default FollowupRepository;
