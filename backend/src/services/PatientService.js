import cache from '../utils/cache.js';
import { notFound } from '../utils/response.js';
import { PATIENT_STATUS } from '../constants/index.js';

class PatientService {
  constructor(repos) {
    this.repo = repos.patient;
  }

  _invalidateCache() {
    cache.invalidate('patients');
  }

  async listPaginated(query) {
    const cacheKey = JSON.stringify(query);
    return cache.wrap('patients', `list:${cacheKey}`, () =>
      this.repo.listPaginated(query)
    );
  }

  async getAll() {
    return cache.wrap('patients', 'all:active', () => this.repo.listActive());
  }

  async getDepartments() {
    return cache.wrap('patients', 'departments', () => this.repo.getDepartments());
  }

  async getById(id) {
    const patient = await cache.wrap('patients', `id:${id}`, () => this.repo.findById(id));
    if (!patient) throw notFound('患者不存在');
    return patient;
  }

  async create(data) {
    const patient = {
      name: data.name || '',
      gender: data.gender || '',
      age: data.age || 0,
      phone: data.phone || '',
      id_card: data.id_card || '',
      diagnosis: data.diagnosis || '',
      admission_date: data.admission_date || '',
      discharge_date: data.discharge_date || '',
      department: data.department || '',
      doctor: data.doctor || '',
      status: data.status || PATIENT_STATUS.ACTIVE,
      notes: data.notes || ''
    };
    if (!patient.name) {
      throw new Error('姓名不能为空');
    }
    const created = this.repo.create(patient);
    this._invalidateCache();
    return created;
  }

  async update(id, data) {
    const existing = this.repo.findById(id);
    if (!existing) throw notFound('患者不存在');

    const updated = {
      ...existing,
      name: data.name !== undefined ? data.name : existing.name,
      gender: data.gender !== undefined ? data.gender : existing.gender,
      age: data.age !== undefined ? data.age : existing.age,
      phone: data.phone !== undefined ? data.phone : existing.phone,
      id_card: data.id_card !== undefined ? data.id_card : existing.id_card,
      diagnosis: data.diagnosis !== undefined ? data.diagnosis : existing.diagnosis,
      admission_date: data.admission_date !== undefined ? data.admission_date : existing.admission_date,
      discharge_date: data.discharge_date !== undefined ? data.discharge_date : existing.discharge_date,
      department: data.department !== undefined ? data.department : existing.department,
      doctor: data.doctor !== undefined ? data.doctor : existing.doctor,
      status: data.status !== undefined ? data.status : existing.status,
      notes: data.notes !== undefined ? data.notes : existing.notes
    };

    const result = this.repo.update(id, updated);
    this._invalidateCache();
    return result;
  }

  async delete(id) {
    const existing = this.repo.findById(id);
    if (!existing) throw notFound('患者不存在');
    const result = this.repo.delete(id);
    this._invalidateCache();
    return result;
  }
}

export default PatientService;
