import { success, successPage, created } from '../utils/response.js';

class FollowupController {
  constructor(services) {
    this.service = services.followup;
  }

  list = async (request) => {
    const { page, pageSize, patient_id, status, keyword, department, doctor } = request.query;
    const result = await this.service.listPaginated({
      page, pageSize, patient_id, status, keyword, department, doctor
    });
    return successPage(result.list, result.total, result.page, result.pageSize);
  };

  get = async (request) => {
    const data = await this.service.getById(request.params.id);
    return success(data);
  };

  byPatient = async (request) => {
    const data = await this.service.listByPatient(request.params.patientId);
    return success(data);
  };

  todayPending = async () => {
    const data = await this.service.listTodayPending();
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

export default FollowupController;
