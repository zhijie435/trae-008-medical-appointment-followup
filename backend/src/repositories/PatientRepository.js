import BaseRepository from './BaseRepository.js';
import { buildWhereClause, buildKeywordCondition, buildOrderClause, buildPagination } from '../utils/queryBuilder.js';

class PatientRepository extends BaseRepository {
  constructor(db) {
    super(db, 'patients', 'id');
    this.db = db;
  }

  _buildConditions({ status, department }) {
    const conditions = [];
    if (status) conditions.push({ field: 'status', value: status });
    if (department) conditions.push({ field: 'department', value: department });
    return conditions;
  }

  listPaginated({ page, pageSize, keyword, status, department }) {
    const conditions = this._buildConditions({ status, department });
    const keywordFields = ['name', 'phone', 'diagnosis'];
    const orders = [{ field: 'created_at', direction: 'DESC' }];
    return this.findPaginated(page, pageSize, conditions, orders, keyword, keywordFields);
  }

  listActive() {
    return this.findAll(
      [{ field: 'status', value: 'active' }],
      [{ field: 'name', direction: 'ASC' }]
    ).map(({ id, name, gender, age, phone, diagnosis, department, doctor }) => ({
      id, name, gender, age, phone, diagnosis, department, doctor
    }));
  }

  getDepartments() {
    const rows = this.raw(`
      SELECT DISTINCT department FROM patients
      WHERE department IS NOT NULL AND department != ''
      ORDER BY department
    `);
    return rows.map((r) => r.department);
  }
}

export default PatientRepository;
