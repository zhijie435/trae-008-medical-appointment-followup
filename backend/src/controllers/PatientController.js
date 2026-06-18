import { success, successPage, created } from '../utils/response.js';

class PatientController {
  constructor(services) {
    this.service = services.patient;
  }

  list = async (request) => {
    const { page, pageSize, keyword, status, department } = request.query;
    const result = await this.service.listPaginated({
      page, pageSize, keyword, status, department
    });
    return successPage(result.list, result.total, result.page, result.pageSize);
  };

  departments = async () => {
    const data = await this.service.getDepartments();
    return success(data);
  };

  all = async () => {
    const data = await this.service.getAll();
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

  remove = async (request) => {
    await this.service.delete(request.params.id);
    return success(null, '删除成功');
  };
}

export default PatientController;
