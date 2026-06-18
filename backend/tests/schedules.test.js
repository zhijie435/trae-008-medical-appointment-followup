import { createTestDb, seedTestData, buildTestApp, teardownTestDb } from './helper.js';
import scheduleRoutes from '../src/routes/schedules.js';

describe('排班管理模块测试', () => {
  let db;
  let fastify;
  let testPatientIds;
  let testScheduleIds;

  beforeAll(async () => {
    db = createTestDb();
    const { patientIds, scheduleIds } = seedTestData(db);
    testPatientIds = patientIds;
    testScheduleIds = scheduleIds;
    fastify = buildTestApp(db);
    fastify.register(scheduleRoutes, { prefix: '/api/schedules' });
    await fastify.ready();
  });

  afterAll(async () => {
    await fastify.close();
    await teardownTestDb(db);
  });

  describe('核心功能：时间冲突检测 (POST /api/schedules/check-conflict)', () => {
    test('应检测到医生时间冲突', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/schedules/check-conflict',
        body: {
          date: '2024-04-01',
          start_time: '09:15',
          end_time: '09:45',
          doctor: '李医生',
          room: '门诊3室',
          patient_id: testPatientIds[1]
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.code).toBe(0);
      expect(result.data.hasConflict).toBe(true);
      const doctorConflict = result.data.conflicts.find(c => c.type === 'doctor');
      expect(doctorConflict).toBeDefined();
      expect(doctorConflict.message).toContain('李医生');
    });

    test('应检测到诊室时间冲突', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/schedules/check-conflict',
        body: {
          date: '2024-04-01',
          start_time: '09:15',
          end_time: '09:45',
          doctor: '王医生',
          room: '门诊2室',
          patient_id: testPatientIds[1]
        }
      });

      const result = JSON.parse(response.payload);
      expect(result.data.hasConflict).toBe(true);
      const roomConflict = result.data.conflicts.find(c => c.type === 'room');
      expect(roomConflict).toBeDefined();
      expect(roomConflict.message).toContain('门诊2室');
    });

    test('应检测到患者时间冲突', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/schedules/check-conflict',
        body: {
          date: '2024-04-01',
          start_time: '09:15',
          end_time: '09:45',
          doctor: '王医生',
          room: '门诊3室',
          patient_id: testPatientIds[0]
        }
      });

      const result = JSON.parse(response.payload);
      expect(result.data.hasConflict).toBe(true);
      const patientConflict = result.data.conflicts.find(c => c.type === 'patient');
      expect(patientConflict).toBeDefined();
      expect(patientConflict.message).toContain('该患者此时间段已有预约');
    });

    test('应同时检测到医生、诊室、患者三重冲突', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/schedules/check-conflict',
        body: {
          date: '2024-04-01',
          start_time: '09:00',
          end_time: '09:30',
          doctor: '李医生',
          room: '门诊2室',
          patient_id: testPatientIds[0]
        }
      });

      const result = JSON.parse(response.payload);
      expect(result.data.hasConflict).toBe(true);
      expect(result.data.conflicts.length).toBeGreaterThanOrEqual(3);
      const conflictTypes = result.data.conflicts.map(c => c.type);
      expect(conflictTypes).toContain('doctor');
      expect(conflictTypes).toContain('room');
      expect(conflictTypes).toContain('patient');
    });

    test('结束时间早于开始时间应返回时间冲突', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/schedules/check-conflict',
        body: {
          date: '2024-04-01',
          start_time: '10:00',
          end_time: '09:00',
          doctor: '王医生'
        }
      });

      const result = JSON.parse(response.payload);
      expect(result.data.hasConflict).toBe(true);
      const timeConflict = result.data.conflicts.find(c => c.type === 'time');
      expect(timeConflict).toBeDefined();
      expect(timeConflict.message).toBe('结束时间必须晚于开始时间');
    });

    test('时间完全不重叠应无冲突', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/schedules/check-conflict',
        body: {
          date: '2024-04-01',
          start_time: '13:00',
          end_time: '13:30',
          doctor: '李医生',
          room: '门诊2室',
          patient_id: testPatientIds[0]
        }
      });

      const result = JSON.parse(response.payload);
      expect(result.data.hasConflict).toBe(false);
      expect(result.data.conflicts.length).toBe(0);
    });

    test('时间刚好衔接不应判定为冲突', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/schedules/check-conflict',
        body: {
          date: '2024-04-01',
          start_time: '12:00',
          end_time: '12:30',
          doctor: '李医生',
          room: '门诊2室'
        }
      });

      const result = JSON.parse(response.payload);
      expect(result.data.hasConflict).toBe(false);
    });

    test('使用exclude_id排除自身后应无冲突', async () => {
      const scheduleId = testScheduleIds[2];
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/schedules/check-conflict',
        body: {
          date: '2024-04-03',
          start_time: '08:30',
          end_time: '09:30',
          doctor: '张医生',
          room: '会议室A',
          patient_id: null,
          exclude_id: scheduleId
        }
      });

      const result = JSON.parse(response.payload);
      expect(result.data.hasConflict).toBe(false);
    });

    test('缺少日期或开始时间应返回无冲突', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/schedules/check-conflict',
        body: {
          doctor: '李医生',
          room: '门诊2室'
        }
      });

      const result = JSON.parse(response.payload);
      expect(result.data.hasConflict).toBe(false);
      expect(result.data.conflicts.length).toBe(0);
    });

    test('跨天的排班不应判定为冲突', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/schedules/check-conflict',
        body: {
          date: '2024-04-02',
          start_time: '09:00',
          end_time: '09:30',
          doctor: '李医生',
          room: '门诊2室',
          patient_id: testPatientIds[0]
        }
      });

      const result = JSON.parse(response.payload);
      expect(result.data.hasConflict).toBe(false);
    });
  });

  describe('获取科室列表 (GET /api/schedules/departments)', () => {
    test('应返回患者表和排班表合并后的去重科室列表', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/schedules/departments'
      });

      const result = JSON.parse(response.payload);
      expect(result.code).toBe(0);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data).toContain('心内科');
      expect(result.data).toContain('内分泌科');
      expect(result.data).toContain('全院');
    });
  });

  describe('获取医生列表 (GET /api/schedules/doctors)', () => {
    test('应返回合并后的去重医生列表', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/schedules/doctors'
      });

      const result = JSON.parse(response.payload);
      expect(result.code).toBe(0);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data).toContain('李医生');
      expect(result.data).toContain('王医生');
    });

    test('应支持按科室筛选医生', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/schedules/doctors',
        query: { department: '心内科' }
      });

      const result = JSON.parse(response.payload);
      expect(result.code).toBe(0);
      expect(result.data).toContain('李医生');
      expect(result.data).not.toContain('王医生');
    });
  });

  describe('排班列表查询 (GET /api/schedules)', () => {
    test('应返回排班列表', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/schedules'
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.code).toBe(0);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
    });

    test('应支持按日期范围筛选', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/schedules',
        query: { startDate: '2024-04-01', endDate: '2024-04-01' }
      });

      const result = JSON.parse(response.payload);
      expect(result.code).toBe(0);
      expect(result.data.length).toBe(2);
      result.data.forEach(s => {
        expect(s.date).toBe('2024-04-01');
      });
    });

    test('应支持按类型筛选', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/schedules',
        query: { type: 'followup' }
      });

      const result = JSON.parse(response.payload);
      expect(result.code).toBe(0);
      result.data.forEach(s => {
        expect(s.type).toBe('followup');
      });
    });

    test('应支持按关键字搜索（标题、患者姓名、医生）', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/schedules',
        query: { keyword: '李医生' }
      });

      const result = JSON.parse(response.payload);
      expect(result.code).toBe(0);
      expect(result.data.length).toBe(2);
    });
  });

  describe('按月查询排班 (GET /api/schedules/month/:year/:month)', () => {
    test('应返回指定月份的所有排班', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/schedules/month/2024/4'
      });

      const result = JSON.parse(response.payload);
      expect(result.code).toBe(0);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBe(3);
      result.data.forEach(s => {
        expect(s.date.startsWith('2024-04')).toBe(true);
      });
    });

    test('12月时应正确计算下一年1月', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/schedules/month/2024/12'
      });

      const result = JSON.parse(response.payload);
      expect(result.code).toBe(0);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('创建排班 (POST /api/schedules)', () => {
    test('应成功创建无冲突的排班', async () => {
      const newSchedule = {
        title: '新患者-初诊',
        date: '2024-04-10',
        start_time: '10:00',
        end_time: '10:30',
        type: 'followup',
        patient_id: testPatientIds[1],
        patient_name: '测试患者2',
        doctor: '王医生',
        department: '内分泌科',
        room: '门诊3室',
        status: 'scheduled',
        description: '糖尿病初诊'
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/schedules',
        body: newSchedule
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.code).toBe(0);
      expect(result.data.title).toBe(newSchedule.title);
      expect(result.message).toBe('创建成功');
    });

    test('创建有冲突的排班应返回409错误', async () => {
      const conflictSchedule = {
        title: '冲突测试',
        date: '2024-04-01',
        start_time: '09:00',
        end_time: '09:30',
        doctor: '李医生',
        room: '门诊2室',
        patient_id: testPatientIds[0]
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/schedules',
        body: conflictSchedule
      });

      expect(response.statusCode).toBe(409);
      const result = JSON.parse(response.payload);
      expect(result.code).toBe("-1");
      expect(result.message).toBe('预约存在冲突');
      expect(result.data.conflicts).toBeDefined();
    });

    test('缺少必填字段应返回400错误', async () => {
      const invalidSchedule = {
        start_time: '10:00',
        end_time: '10:30'
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/schedules',
        body: invalidSchedule
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);
      expect(result.code).toBe("-1");
      expect(result.message).toBe('标题和日期为必填项');
    });

    test('结束时间早于开始时间应返回400错误', async () => {
      const invalidSchedule = {
        title: '时间错误测试',
        date: '2024-04-10',
        start_time: '11:00',
        end_time: '10:00'
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/schedules',
        body: invalidSchedule
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);
      expect(result.code).toBe("-1");
      expect(result.message).toBe('结束时间必须晚于开始时间');
    });
  });

  describe('更新排班 (PUT /api/schedules/:id)', () => {
    test('应成功更新无冲突的排班', async () => {
      const scheduleId = testScheduleIds[2];
      const updateData = {
        title: '科室例会-更新',
        date: '2024-04-03',
        start_time: '09:00',
        end_time: '10:00',
        type: 'meeting',
        department: '全院',
        room: '会议室A',
        status: 'scheduled',
        description: '更新后的例会'
      };

      const response = await fastify.inject({
        method: 'PUT',
        url: `/api/schedules/${scheduleId}`,
        body: updateData
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.code).toBe(0);
      expect(result.data.title).toBe('科室例会-更新');
      expect(result.data.start_time).toBe('09:00');
      expect(result.message).toBe('更新成功');
    });

    test('更新为有冲突的时间应返回409错误', async () => {
      const scheduleId = testScheduleIds[2];
      const updateData = {
        title: '冲突测试更新',
        date: '2024-04-01',
        start_time: '09:00',
        end_time: '09:30',
        doctor: '李医生',
        room: '门诊2室'
      };

      const response = await fastify.inject({
        method: 'PUT',
        url: `/api/schedules/${scheduleId}`,
        body: updateData
      });

      expect(response.statusCode).toBe(409);
      const result = JSON.parse(response.payload);
      expect(result.code).toBe("-1");
      expect(result.message).toBe('预约存在冲突');
    });

    test('更新不存在的排班应返回404', async () => {
      const response = await fastify.inject({
        method: 'PUT',
        url: '/api/schedules/99999',
        body: { title: '测试', date: '2024-04-10' }
      });

      expect(response.statusCode).toBe(404);
      const result = JSON.parse(response.payload);
      expect(result.code).toBe("-1");
      expect(result.message).toBe('排班不存在');
    });
  });

  describe('更新排班状态 (PATCH /api/schedules/:id/status)', () => {
    test('应成功更新排班状态', async () => {
      const scheduleId = testScheduleIds[0];
      const response = await fastify.inject({
        method: 'PATCH',
        url: `/api/schedules/${scheduleId}/status`,
        body: { status: 'completed' }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.code).toBe(0);
      expect(result.data.status).toBe('completed');
      expect(result.message).toBe('状态更新成功');
    });

    test('更新不存在的排班状态应返回404', async () => {
      const response = await fastify.inject({
        method: 'PATCH',
        url: '/api/schedules/99999/status',
        body: { status: 'completed' }
      });

      expect(response.statusCode).toBe(404);
      const result = JSON.parse(response.payload);
      expect(result.code).toBe("-1");
      expect(result.message).toBe('排班不存在');
    });
  });

  describe('删除排班 (DELETE /api/schedules/:id)', () => {
    test('应成功删除排班', async () => {
      const scheduleId = testScheduleIds[1];
      const response = await fastify.inject({
        method: 'DELETE',
        url: `/api/schedules/${scheduleId}`
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.code).toBe(0);
      expect(result.message).toBe('删除成功');

      const checkResponse = await fastify.inject({
        method: 'GET',
        url: `/api/schedules/${scheduleId}`
      });
      expect(checkResponse.statusCode).toBe(404);
    });

    test('删除不存在的排班应返回404', async () => {
      const response = await fastify.inject({
        method: 'DELETE',
        url: '/api/schedules/99999'
      });

      expect(response.statusCode).toBe(404);
      const result = JSON.parse(response.payload);
      expect(result.code).toBe("-1");
      expect(result.message).toBe('排班不存在');
    });
  });
});
