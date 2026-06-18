import PatientRepository from './PatientRepository.js';
import FollowupRepository from './FollowupRepository.js';
import ScheduleRepository from './ScheduleRepository.js';

class RepositoryFactory {
  constructor(db) {
    this.db = db;
    this._repos = {};
  }

  get patient() {
    if (!this._repos.patient) {
      this._repos.patient = new PatientRepository(this.db);
    }
    return this._repos.patient;
  }

  get followup() {
    if (!this._repos.followup) {
      this._repos.followup = new FollowupRepository(this.db);
    }
    return this._repos.followup;
  }

  get schedule() {
    if (!this._repos.schedule) {
      this._repos.schedule = new ScheduleRepository(this.db);
    }
    return this._repos.schedule;
  }
}

export default RepositoryFactory;
