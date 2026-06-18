import { createTestDb, seedTestData, buildTestApp, teardownTestDb } from '../tests/helper.js';
import scheduleRoutes from '../src/routes/schedules.js';
import patientRoutes from '../src/routes/patients.js';

const db = createTestDb();
const { patientIds } = seedTestData(db);
const fastify = buildTestApp(db);
fastify.register(scheduleRoutes, { prefix: '/api/schedules' });
fastify.register(patientRoutes, { prefix: '/api/patients' });
await fastify.ready();

const checks = [
  ['冲突409', { method: 'POST', url: '/api/schedules', body: { title: 'c', date: '2024-04-01', start_time: '09:00', end_time: '09:30', doctor: '李医生', room: '门诊2室', patient_id: patientIds[0] } }],
  ['未找到404', { method: 'GET', url: '/api/patients/99999' }],
  ['缺字段400', { method: 'POST', url: '/api/schedules', body: { start_time: '10:00' } }],
  ['时间非法400', { method: 'POST', url: '/api/schedules', body: { title: 't', date: '2024-04-10', start_time: '11:00', end_time: '10:00' } }]
];

for (const [name, req] of checks) {
  const res = await fastify.inject(req);
  const parsed = JSON.parse(res.payload);
  console.log(`\n=== ${name} === HTTP=${res.statusCode}`);
  console.log('keys:', Object.keys(parsed));
  console.log('code =', JSON.stringify(parsed.code), '| typeof =', typeof parsed.code);
  console.log('has data field =', 'data' in parsed, '| data =', JSON.stringify(parsed.data));
  console.log('error field =', JSON.stringify(parsed.error));
}

await fastify.close();
await teardownTestDb(db);
