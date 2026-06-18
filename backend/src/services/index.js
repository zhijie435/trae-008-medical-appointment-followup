import PatientService from './PatientService.js';
import FollowupService from './FollowupService.js';
import ScheduleService from './ScheduleService.js';

class ServiceFactory {
  constructor(repos) {
    this.repos = repos;
    this._services = {};
  }

  get patient() {
    if (!this._services.patient) {
      this._services.patient = new PatientService(this.repos);
    }
    return this._services.patient;
  }

  get followup() {
    if (!this._services.followup) {
      this._services.followup = new FollowupService(this.repos);
    }
    return this._services.followup;
  }

  get schedule() {
    if (!this._services.schedule) {
      this._services.schedule = new ScheduleService(this.repos);
    }
    return this._services.schedule;
  }
}

export default ServiceFactory;
