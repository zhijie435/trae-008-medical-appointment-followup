import Fastify from 'fastify';
import cors from '@fastify/cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { initDb } from './db/index.js';
import patientRoutes from './routes/patients.js';
import followupRoutes from './routes/followups.js';
import scheduleRoutes from './routes/schedules.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const fastify = Fastify({
  logger: true
});

fastify.register(cors, {
  origin: true,
  credentials: true
});

const db = initDb();
fastify.decorate('db', db);

fastify.register(patientRoutes, { prefix: '/api/patients' });
fastify.register(followupRoutes, { prefix: '/api/followups' });
fastify.register(scheduleRoutes, { prefix: '/api/schedules' });

fastify.get('/api/health', async (request, reply) => {
  return { status: 'ok', message: '医疗随访排班系统服务运行正常' };
});

const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log('Server running on http://localhost:3001');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
