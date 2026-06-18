import { createTestDb, seedTestData, buildTestApp, teardownTestDb } from './helper.js';
import followupRoutes from '../src/routes/followups.js';

describe('随访管理模块测试', () => {
  let db;
  let fastify;
  let testPatientIds;
  let testFollowupIds;

  beforeAll(async () => {
    db = createTestDb();
    const { patientIds, followupIds } = seedTestData(db);
    testPatientIds = patientIds;
    testFollowupIds = followupIds;
    fastify = buildTestApp(db);
    fastify.register(followupRoutes, { prefix: '/api/followups' });
    await fastify.ready();
  });

  afterAll(async () => {
    await fastify.close();
    await teardownTestDb(db);
  });

  describe('随访记录列表查询 (GET /api/followups)', () => {
    test('应返回分页随访记录列表，包含患者关联信息', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/followups',
        query: { page: '1', pageSize: '10' }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.code).toBe(0);
      expect(result.data.list).toBeDefined();
      expect(result.data.total).toBe(3);
      expect(result.data.list[0].patient_name).toBeDefined();
      expect(result.data.list[0].patient_department).toBeDefined();
    });

    test('应支持按患者ID筛选', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/followups',
        query: { patient_id: testPatientIds[0].toString() }
      });

      const result = JSON.parse(response.payload);
      expect(result.code).toBe(0);
      expect(result.data.total).toBe(2);
      result.data.list.forEach(f => {
        expect(f.patient_id).toBe(testPatientIds[0]);
      });
    });

    test('应支持按状态筛选', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/followups',
        query: { status: 'pending' }
      });

      const result = JSON.parse(response.payload);
      expect(result.code).toBe(0);
      expect(result.data.total).toBe(2);
      result.data.list.forEach(f => {
        expect(f.status).toBe('pending');
      });
    });

    test('应支持按科室筛选', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/followups',
        query: { department: '心内科' }
      });

      const result = JSON.parse(response.payload);
      expect(result.code).toBe(0);
      expect(result.data.total).toBe(2);
      result.data.list.forEach(f => {
        expect(f.patient_department).toBe('心内科');
      });
    });

    test('应支持按医生筛选', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/followups',
        query: { doctor: '王医生' }
      });

      const result = JSON.parse(response.payload);
      expect(result.code).toBe(0);
      expect(result.data.total).toBe(1);
      expect(result.data.list[0].doctor).toBe('王医生');
    });

    test('应支持按关键字搜索（患者姓名、随访内容）', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/followups',
        query: { keyword: '测试患者1' }
      });

      const result = JSON.parse(response.payload);
      expect(result.code).toBe(0);
      expect(result.data.total).toBe(2);
    });
  });

  describe('获取单个随访记录详情 (GET /api/followups/:id)', () => {
    test('应返回正确的随访记录及患者信息', async () => {
      const followupId = testFollowupIds[0];
      const response = await fastify.inject({
        method: 'GET',
        url: `/api/followups/${followupId}`
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.code).toBe(0);
      expect(result.data.id).toBe(followupId);
      expect(result.data.patient_name).toBeDefined();
      expect(result.data.phone).toBeDefined();
    });

    test('随访记录不存在时应返回404', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/followups/99999'
      });

      expect(response.statusCode).toBe(404);
      const result = JSON.parse(response.payload);
      expect(result.code).toBe("-1");
      expect(result.message).toBe('随访记录不存在');
    });
  });

  describe('获取指定患者的所有随访记录 (GET /api/followups/patient/:patientId)', () => {
    test('应返回指定患者的所有随访记录', async () => {
      const patientId = testPatientIds[0];
      const response = await fastify.inject({
        method: 'GET',
        url: `/api/followups/patient/${patientId}`
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.code).toBe(0);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBe(2);
      result.data.forEach(f => {
        expect(f.patient_id).toBe(patientId);
      });
    });
  });

  describe('获取今日待办随访 (GET /api/followups/today/pending)', () => {
    test('应返回今日待处理的随访记录', async () => {
      const today = new Date().toISOString().split('T')[0];
      db.prepare(`
        INSERT INTO followups (patient_id, followup_date, followup_type, content, doctor, status)
        VALUES (?, ?, '电话随访', '今日测试随访', '李医生', 'pending')
      `).run(testPatientIds[0], today);

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/followups/today/pending'
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.code).toBe(0);
      expect(Array.isArray(result.data)).toBe(true);
      result.data.forEach(f => {
        expect(f.followup_date).toBe(today);
        expect(f.status).toBe('pending');
        expect(f.patient_name).toBeDefined();
      });
    });
  });

  describe('创建随访记录 (POST /api/followups)', () => {
    test('应成功创建新的随访记录', async () => {
      const newFollowup = {
        patient_id: testPatientIds[1],
        followup_date: '2024-05-01',
        followup_type: '门诊随访',
        content: '糖尿病定期复查',
        result: '',
        next_followup_date: '2024-06-01',
        doctor: '王医生',
        status: 'pending',
        notes: '需要检查血糖'
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/followups',
        body: newFollowup
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.code).toBe(0);
      expect(result.data.patient_id).toBe(newFollowup.patient_id);
      expect(result.data.followup_type).toBe(newFollowup.followup_type);
      expect(result.message).toBe('创建成功');
    });

    test('创建时缺失字段应使用默认值', async () => {
      const newFollowup = {
        patient_id: testPatientIds[0],
        followup_date: '2024-05-15'
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/followups',
        body: newFollowup
      });

      const result = JSON.parse(response.payload);
      expect(result.code).toBe(0);
      expect(result.data.followup_type).toBe('电话随访');
      expect(result.data.status).toBe('pending');
    });
  });

  describe('更新随访记录 (PUT /api/followups/:id)', () => {
    test('应成功更新随访记录', async () => {
      const followupId = testFollowupIds[1];
      const updateData = {
        patient_id: testPatientIds[0],
        followup_date: '2024-03-01',
        followup_type: '门诊随访',
        content: '复查血压、心电图',
        result: '血压130/80mmHg，心电图正常',
        next_followup_date: '2024-04-01',
        doctor: '李医生',
        status: 'completed',
        notes: '患者恢复良好'
      };

      const response = await fastify.inject({
        method: 'PUT',
        url: `/api/followups/${followupId}`,
        body: updateData
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.code).toBe(0);
      expect(result.data.status).toBe('completed');
      expect(result.data.result).toBe('血压130/80mmHg，心电图正常');
      expect(result.message).toBe('更新成功');
    });

    test('更新不存在的随访记录应返回404', async () => {
      const response = await fastify.inject({
        method: 'PUT',
        url: '/api/followups/99999',
        body: { patient_id: testPatientIds[0], followup_date: '2024-05-01' }
      });

      expect(response.statusCode).toBe(404);
      const result = JSON.parse(response.payload);
      expect(result.code).toBe("-1");
      expect(result.message).toBe('随访记录不存在');
    });
  });

  describe('更新随访状态 (PATCH /api/followups/:id/status)', () => {
    test('应成功更新随访状态和结果', async () => {
      const followupId = testFollowupIds[2];
      const updateData = {
        status: 'completed',
        result: '血糖控制良好，继续当前方案'
      };

      const response = await fastify.inject({
        method: 'PATCH',
        url: `/api/followups/${followupId}/status`,
        body: updateData
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.code).toBe(0);
      expect(result.data.status).toBe('completed');
      expect(result.data.result).toBe('血糖控制良好，继续当前方案');
      expect(result.message).toBe('状态更新成功');
    });

    test('更新不存在的随访记录状态应返回404', async () => {
      const response = await fastify.inject({
        method: 'PATCH',
        url: '/api/followups/99999/status',
        body: { status: 'completed' }
      });

      expect(response.statusCode).toBe(404);
      const result = JSON.parse(response.payload);
      expect(result.code).toBe("-1");
      expect(result.message).toBe('随访记录不存在');
    });
  });

  describe('删除随访记录 (DELETE /api/followups/:id)', () => {
    test('应成功删除随访记录', async () => {
      const followupId = testFollowupIds[0];
      const response = await fastify.inject({
        method: 'DELETE',
        url: `/api/followups/${followupId}`
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.code).toBe(0);
      expect(result.message).toBe('删除成功');

      const checkResponse = await fastify.inject({
        method: 'GET',
        url: `/api/followups/${followupId}`
      });
      expect(checkResponse.statusCode).toBe(404);
    });

    test('删除不存在的随访记录应返回404', async () => {
      const response = await fastify.inject({
        method: 'DELETE',
        url: '/api/followups/99999'
      });

      expect(response.statusCode).toBe(404);
      const result = JSON.parse(response.payload);
      expect(result.code).toBe("-1");
      expect(result.message).toBe('随访记录不存在');
    });
  });
});
