import PatientController from './PatientController.js';
import FollowupController from './FollowupController.js';
import ScheduleController from './ScheduleController.js';

class ControllerFactory {
  constructor(services) {
    this.services = services;
    this._controllers = {};
  }

  get patient() {
    if (!this._controllers.patient) {
      this._controllers.patient = new PatientController(this.services);
    }
    return this._controllers.patient;
  }

  get followup() {
    if (!this._controllers.followup) {
      this._controllers.followup = new FollowupController(this.services);
    }
    return this._controllers.followup;
  }

  get schedule() {
    if (!this._controllers.schedule) {
      this._controllers.schedule = new ScheduleController(this.services);
    }
    return this._controllers.schedule;
  }
}

export default ControllerFactory;
