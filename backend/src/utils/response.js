import { RESPONSE_CODE, HTTP_STATUS } from '../constants/index.js';

export class AppError extends Error {
  constructor(message, statusCode = HTTP_STATUS.BAD_REQUEST, code = RESPONSE_CODE.ERROR, data = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.data = data;
  }
}

export const success = (data = null, message = 'success', extra = {}) => ({
  code: RESPONSE_CODE.SUCCESS,
  data,
  message,
  ...extra
});

export const successPage = (list, total, page, pageSize, message = 'success') => ({
  code: RESPONSE_CODE.SUCCESS,
  data: {
    list,
    total,
    page: parseInt(page, 10),
    pageSize: parseInt(pageSize, 10)
  },
  message
});

export const fail = (message = 'error', code = RESPONSE_CODE.ERROR, data = null) => ({
  code,
  data,
  message
});

export const notFound = (message = '资源不存在') => new AppError(message, HTTP_STATUS.NOT_FOUND);

export const badRequest = (message = '请求参数错误', data = null) =>
  new AppError(message, HTTP_STATUS.BAD_REQUEST, RESPONSE_CODE.ERROR, data);

export const conflict = (message = '资源冲突', data = null) =>
  new AppError(message, HTTP_STATUS.CONFLICT, RESPONSE_CODE.ERROR, data);

export const created = (data = null, message = '创建成功') => ({
  code: RESPONSE_CODE.SUCCESS,
  data,
  message,
  _statusCode: HTTP_STATUS.CREATED
});

export default {
  AppError,
  success,
  successPage,
  fail,
  notFound,
  badRequest,
  conflict,
  created
};
