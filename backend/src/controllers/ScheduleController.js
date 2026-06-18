import { success, created } from '../utils/response.js';

class ScheduleController {
  constructor(services) {
    this.service = services.schedule;
  }

  departments = async () => {
    const data = await this.service.getDepartments();
    return success(data);
  };

  doctors = async (request) => {
    const { department } = request.query;
    const data = await this.service.getDoctors(department);
    return success(data);
  };

  checkConflict = async (request) => {
    const data = await this.service.checkConflict(request.body);
    return success(data);
  };

  list = async (request) => {
    const { startDate, endDate, type, status, keyword, department } = request.query;
    const data = await this.service.listFiltered({
      startDate, endDate, type, status, keyword, department
    });
    return success(data);
  };

  monthSchedule = async (request) => {
    const { year, month } = request.params;
    const { department, type, status } = request.query;
    const data = await this.service.listByMonth(year, month, {
      department, type, status
    });
    return success(data);
  };

  get = async (request) => {
    const data = await this.service.getById(request.params.id);
    return success(data);
  };

  create = async (request) => {
    const data = await this.service.create(request.body);
    return created(data, '创建成功');
  };

  update = async (request) => {
    const data = await this.service.update(request.params.id, request.body);
    return success(data, '更新成功');
  };

  updateStatus = async (request) => {
    const data = await this.service.updateStatus(request.params.id, request.body);
    return success(data, '状态更新成功');
  };

  remove = async (request) => {
    await this.service.delete(request.params.id);
    return success(null, '删除成功');
  };
}

export default ScheduleController;
