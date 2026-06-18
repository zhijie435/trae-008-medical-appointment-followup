import Fastify from 'fastify';
import cors from '@fastify/cors';

import config from './config/index.js';
import { initDb } from './db/index.js';
import RepositoryFactory from './repositories/index.js';
import ServiceFactory from './services/index.js';
import ControllerFactory from './controllers/index.js';
import responseHandler from './middleware/responseHandler.js';
import cache from './utils/cache.js';
import { success } from './utils/response.js';

import patientRoutes from './routes/patients.js';
import followupRoutes from './routes/followups.js';
import scheduleRoutes from './routes/schedules.js';

const fastify = Fastify({
  logger: {
    level: config.logger.level
  }
});

fastify.register(cors, config.cors);
fastify.register(responseHandler);

const db = initDb();
const repos = new RepositoryFactory(db);
const services = new ServiceFactory(repos);
const controllers = new ControllerFactory(services);

fastify.decorate('db', db);
fastify.decorate('repos', repos);
fastify.decorate('services', services);
fastify.decorate('controllers', controllers);
fastify.decorate('cache', cache);

fastify.register(patientRoutes, { prefix: '/api/patients' });
fastify.register(followupRoutes, { prefix: '/api/followups' });
fastify.register(scheduleRoutes, { prefix: '/api/schedules' });

fastify.get('/api/health', async () => {
  return success(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      cacheSize: cache.size
    },
    '医疗随访排班系统服务运行正常'
  );
});

fastify.get('/api/stats/cache', async () => {
  return success({
    size: cache.size,
    maxSize: config.cache.maxSize
  });
});

const start = async () => {
  try {
    await fastify.listen({
      port: config.server.port,
      host: config.server.host
    });
    fastify.log.info(
      `Server running on http://${config.server.host}:${config.server.port}`
    );
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
