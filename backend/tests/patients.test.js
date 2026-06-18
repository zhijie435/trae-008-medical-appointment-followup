import { createTestDb, seedTestData, buildTestApp, teardownTestDb } from './helper.js';
import patientRoutes from '../src/routes/patients.js';

describe('患者管理模块测试', () => {
  let db;
  let fastify;
  let testPatientIds;

  beforeAll(async () => {
    db = createTestDb();
    const { patientIds } = seedTestData(db);
    testPatientIds = patientIds;
    fastify = buildTestApp(db);
    fastify.register(patientRoutes, { prefix: '/api/patients' });
    await fastify.ready();
  });

  afterAll(async () => {
    await fastify.close();
    await teardownTestDb(db);
  });

  describe('患者列表查询 (GET /api/patients)', () => {
    test('应返回分页患者列表', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/patients',
        query: { page: '1', pageSize: '10' }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.code).toBe(0);
      expect(result.data.list).toBeDefined();
      expect(result.data.total).toBe(3);
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(10);
    });

    test('应支持按关键字搜索（姓名、电话、诊断）', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/patients',
        query: { keyword: '高血压' }
      });

      const result = JSON.parse(response.payload);
      expect(result.code).toBe(0);
      expect(result.data.total).toBe(1);
      expect(result.data.list[0].diagnosis).toContain('高血压');
    });

    test('应支持按状态筛选', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/patients',
        query: { status: 'discharged' }
      });

      const result = JSON.parse(response.payload);
      expect(result.code).toBe(0);
      expect(result.data.total).toBe(1);
      expect(result.data.list[0].status).toBe('discharged');
    });

    test('应支持按科室筛选', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/patients',
        query: { department: '心内科' }
      });

      const result = JSON.parse(response.payload);
      expect(result.code).toBe(0);
      expect(result.data.total).toBe(2);
      result.data.list.forEach(p => {
        expect(p.department).toBe('心内科');
      });
    });

    test('分页功能应正常工作', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/patients',
        query: { page: '1', pageSize: '2' }
      });

      const result = JSON.parse(response.payload);
      expect(result.code).toBe(0);
      expect(result.data.list.length).toBe(2);
      expect(result.data.total).toBe(3);
    });
  });

  describe('获取科室列表 (GET /api/patients/departments)', () => {
    test('应返回去重后的科室列表', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/patients/departments'
      });

      const result = JSON.parse(response.payload);
      expect(result.code).toBe(0);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data).toContain('心内科');
      expect(result.data).toContain('内分泌科');
    });
  });

  describe('获取所有活跃患者 (GET /api/patients/all)', () => {
    test('应只返回状态为active的患者', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/patients/all'
      });

      const result = JSON.parse(response.payload);
      expect(result.code).toBe(0);
      expect(result.data.length).toBe(2);
    });
  });

  describe('获取单个患者详情 (GET /api/patients/:id)', () => {
    test('应返回正确的患者信息', async () => {
      const patientId = testPatientIds[0];
      const response = await fastify.inject({
        method: 'GET',
        url: `/api/patients/${patientId}`
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.code).toBe(0);
      expect(result.data.id).toBe(patientId);
      expect(result.data.name).toBe('测试患者1');
    });

    test('患者不存在时应返回404', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/patients/99999'
      });

      expect(response.statusCode).toBe(404);
      const result = JSON.parse(response.payload);
      expect(result.code).toBe("-1");
      expect(result.message).toBe('患者不存在');
    });
  });

  describe('创建患者 (POST /api/patients)', () => {
    test('应成功创建新患者', async () => {
      const newPatient = {
        name: '新测试患者',
        gender: '男',
        age: 30,
        phone: '13900139000',
        id_card: '110101199401011234',
        diagnosis: '测试诊断',
        admission_date: '2024-04-01',
        discharge_date: '2024-04-10',
        department: '测试科室',
        doctor: '测试医生',
        status: 'active',
        notes: '测试备注'
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/patients',
        body: newPatient
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.code).toBe(0);
      expect(result.data.name).toBe(newPatient.name);
      expect(result.data.diagnosis).toBe(newPatient.diagnosis);
      expect(result.message).toBe('创建成功');
    });

    test('创建患者时缺失字段应使用默认值', async () => {
      const newPatient = {
        name: '最小信息患者'
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/patients',
        body: newPatient
      });

      const result = JSON.parse(response.payload);
      expect(result.code).toBe(0);
      expect(result.data.name).toBe('最小信息患者');
      expect(result.data.status).toBe('active');
      expect(result.data.age).toBe(0);
    });
  });

  describe('更新患者 (PUT /api/patients/:id)', () => {
    test('应成功更新患者信息', async () => {
      const patientId = testPatientIds[0];
      const updateData = {
        name: '测试患者1-更新',
        gender: '男',
        age: 46,
        phone: '13800138001',
        diagnosis: '高血压2级',
        department: '心内科',
        doctor: '李医生',
        status: 'active',
        notes: '更新后的备注'
      };

      const response = await fastify.inject({
        method: 'PUT',
        url: `/api/patients/${patientId}`,
        body: updateData
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.code).toBe(0);
      expect(result.data.name).toBe('测试患者1-更新');
      expect(result.data.age).toBe(46);
      expect(result.data.diagnosis).toBe('高血压2级');
      expect(result.message).toBe('更新成功');
    });

    test('更新不存在的患者应返回404', async () => {
      const response = await fastify.inject({
        method: 'PUT',
        url: '/api/patients/99999',
        body: { name: '不存在的患者' }
      });

      expect(response.statusCode).toBe(404);
      const result = JSON.parse(response.payload);
      expect(result.code).toBe("-1");
      expect(result.message).toBe('患者不存在');
    });
  });

  describe('删除患者 (DELETE /api/patients/:id)', () => {
    test('应成功删除患者', async () => {
      const patientId = testPatientIds[2];
      const response = await fastify.inject({
        method: 'DELETE',
        url: `/api/patients/${patientId}`
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.code).toBe(0);
      expect(result.message).toBe('删除成功');

      const checkResponse = await fastify.inject({
        method: 'GET',
        url: `/api/patients/${patientId}`
      });
      expect(checkResponse.statusCode).toBe(404);
    });

    test('删除不存在的患者应返回404', async () => {
      const response = await fastify.inject({
        method: 'DELETE',
        url: '/api/patients/99999'
      });

      expect(response.statusCode).toBe(404);
      const result = JSON.parse(response.payload);
      expect(result.code).toBe("-1");
      expect(result.message).toBe('患者不存在');
    });
  });
});
