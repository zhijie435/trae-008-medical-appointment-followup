import { AppError, fail, success } from '../utils/response.js';
import { HTTP_STATUS, RESPONSE_CODE } from '../constants/index.js';

const responseHandler = async (fastify) => {
  fastify.addHook('preHandler', async (request) => {
    request.locals = request.locals || {};
  });

  fastify.addHook('preSerialization', async (request, reply, payload) => {
    if (payload && payload._statusCode) {
      reply.code(payload._statusCode);
      const { _statusCode, ...rest } = payload;
      return rest;
    }
    return payload;
  });

  fastify.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      reply.code(error.statusCode);
      return {
        code: error.code,
        message: error.message,
        data: error.data
      };
    }

    if (error.validation) {
      reply.code(HTTP_STATUS.BAD_REQUEST);
      const message = error.validation.map((v) => v.message).join('; ');
      return fail(message || '参数校验失败', RESPONSE_CODE.ERROR, error.validation);
    }

    fastify.log.error({ err: error }, 'Unhandled error occurred');
    reply.code(HTTP_STATUS.INTERNAL_ERROR);
    return fail(error.message || '服务器内部错误', RESPONSE_CODE.ERROR);
  });
};

export default responseHandler;
