import cache from '../utils/cache.js';
import { notFound, badRequest, conflict } from '../utils/response.js';
import { FOLLOWUP_STATUS, FOLLOWUP_TYPES } from '../constants/index.js';

class FollowupService {
  constructor(repos) {
    this.repo = repos.followup;
    this.patientRepo = repos.patient;
  }

  _invalidateCache() {
    cache.invalidate('followups');
    cache.invalidate('patients');
  }

  async listPaginated(query) {
    const cacheKey = JSON.stringify(query);
    return cache.wrap('followups', `list:${cacheKey}`, () =>
      this.repo.listPaginated(query)
    );
  }

  async getById(id) {
    const followup = this.repo.getByIdWithPatient(id);
    if (!followup) throw notFound('随访记录不存在');
    return followup;
  }

  async listByPatient(patientId) {
    return cache.wrap('followups', `patient:${patientId}`, () =>
      this.repo.listByPatient(patientId)
    );
  }

  async listTodayPending() {
    return cache.wrap('followups', 'today:pending', () =>
      this.repo.listTodayPending(),
      60 * 1000
    );
  }

  async create(data) {
    if (!data.patient_id) throw badRequest('患者ID不能为空');
    if (!data.followup_date) throw badRequest('随访日期不能为空');

    const patient = this.patientRepo.findById(data.patient_id);
    if (!patient) throw notFound('患者不存在');

    const followup = {
      patient_id: data.patient_id,
      followup_date: data.followup_date,
      followup_type: data.followup_type || FOLLOWUP_TYPES[0],
      content: data.content || '',
      result: data.result || '',
      next_followup_date: data.next_followup_date || '',
      doctor: data.doctor || patient.doctor || '',
      status: data.status || FOLLOWUP_STATUS.PENDING,
      notes: data.notes || ''
    };

    const created = this.repo.create(followup);
    this._invalidateCache();
    return created;
  }

  async update(id, data) {
    const existing = this.repo.findById(id);
    if (!existing) throw notFound('随访记录不存在');

    const updated = {
      ...existing,
      patient_id: data.patient_id !== undefined ? data.patient_id : existing.patient_id,
      followup_date: data.followup_date !== undefined ? data.followup_date : existing.followup_date,
      followup_type: data.followup_type !== undefined ? data.followup_type : existing.followup_type,
      content: data.content !== undefined ? data.content : existing.content,
      result: data.result !== undefined ? data.result : existing.result,
      next_followup_date: data.next_followup_date !== undefined ? data.next_followup_date : existing.next_followup_date,
      doctor: data.doctor !== undefined ? data.doctor : existing.doctor,
      status: data.status !== undefined ? data.status : existing.status,
      notes: data.notes !== undefined ? data.notes : existing.notes
    };

    const result = this.repo.update(id, updated);
    this._invalidateCache();
    return result;
  }

  async updateStatus(id, { status, result = '' }) {
    const existing = this.repo.findById(id);
    if (!existing) throw notFound('随访记录不存在');

    const updated = this.repo.patch(id, {
      status: status || existing.status,
      result: result !== '' ? result : (existing.result || '')
    });
    this._invalidateCache();
    return updated;
  }

  async delete(id) {
    const existing = this.repo.findById(id);
    if (!existing) throw notFound('随访记录不存在');
    const result = this.repo.delete(id);
    this._invalidateCache();
    return result;
  }
}

export default FollowupService;
