function timeToMinutes(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function isTimeOverlap(start1, end1, start2, end2) {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  if (s1 === null || s2 === null) return false;
  const e1Safe = e1 === null ? s1 + 1 : e1;
  const e2Safe = e2 === null ? s2 + 1 : e2;
  return s1 < e2Safe && s2 < e1Safe;
}

function findConflicts(db, date, start_time, end_time, doctor, room, patient_id, excludeId = null) {
  const conflicts = [];
  const activeStatuses = ['scheduled', 'ongoing'];
  const placeholders = activeStatuses.map(() => '?').join(',');

  let sql = `SELECT * FROM schedules WHERE date = ? AND status IN (${placeholders})`;
  const params = [date, ...activeStatuses];

  if (excludeId) {
    sql += ' AND id != ?';
    params.push(excludeId);
  }

  const sameDay = db.prepare(sql).all(...params);

  for (const s of sameDay) {
    if (!isTimeOverlap(start_time, end_time, s.start_time, s.end_time)) continue;

    if (doctor && s.doctor && s.doctor === doctor) {
      conflicts.push({ type: 'doctor', message: `该时间段医生[${doctor}]已有排班：${s.title}`, schedule: s });
    }
    if (room && s.room && s.room === room) {
      conflicts.push({ type: 'room', message: `该时间段诊室[${room}]已被占用：${s.title}`, schedule: s });
    }
    if (patient_id && s.patient_id && s.patient_id == patient_id) {
      conflicts.push({ type: 'patient', message: `该患者此时间段已有预约：${s.title}`, schedule: s });
    }
  }

  return conflicts;
}

async function scheduleRoutes(fastify, options) {
  const db = fastify.db;

  fastify.get('/departments', async (request, reply) => {
    const rows = db.prepare(`
      SELECT DISTINCT department FROM patients WHERE department IS NOT NULL AND department != ''
      UNION
      SELECT DISTINCT department FROM schedules WHERE department IS NOT NULL AND department != ''
      ORDER BY department
    `).all();
    const departments = rows.map(r => r.department);
    return { code: 0, data: departments };
  });

  fastify.get('/doctors', async (request, reply) => {
    const { department = '' } = request.query;
    let sql = `
      SELECT DISTINCT doctor FROM patients WHERE doctor IS NOT NULL AND doctor != ''
      UNION
      SELECT DISTINCT doctor FROM schedules WHERE doctor IS NOT NULL AND doctor != ''
    `;
    const params = [];
    if (department) {
      sql = `
        SELECT DISTINCT doctor FROM (
          SELECT doctor, department FROM patients WHERE doctor IS NOT NULL AND doctor != ''
          UNION
          SELECT doctor, department FROM schedules WHERE doctor IS NOT NULL AND doctor != ''
        ) WHERE department = ?
      `;
      params.push(department);
    }
    sql += ' ORDER BY doctor';
    const rows = db.prepare(sql).all(...params);
    const doctors = rows.map(r => r.doctor);
    return { code: 0, data: doctors };
  });

  fastify.post('/check-conflict', async (request, reply) => {
    const { date, start_time, end_time, doctor, room, patient_id, exclude_id } = request.body;

    if (!date || !start_time) {
      return { code: 0, data: { hasConflict: false, conflicts: [] } };
    }

    if (end_time) {
      const s = timeToMinutes(start_time);
      const e = timeToMinutes(end_time);
      if (s !== null && e !== null && e <= s) {
        return {
          code: 0,
          data: {
            hasConflict: true,
            conflicts: [{ type: 'time', message: '结束时间必须晚于开始时间' }]
          }
        };
      }
    }

    const conflicts = findConflicts(db, date, start_time, end_time, doctor, room, patient_id, exclude_id);
    return { code: 0, data: { hasConflict: conflicts.length > 0, conflicts } };
  });

  fastify.get('/', async (request, reply) => {
    const { startDate, endDate, type = '', status = '', keyword = '', department = '' } = request.query;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (startDate) {
      whereClause += ' AND date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND date <= ?';
      params.push(endDate);
    }

    if (type) {
      whereClause += ' AND type = ?';
      params.push(type);
    }

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    if (department) {
      whereClause += ' AND department = ?';
      params.push(department);
    }

    if (keyword) {
      whereClause += ' AND (title LIKE ? OR patient_name LIKE ? OR doctor LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    const schedules = db.prepare(`
      SELECT * FROM schedules ${whereClause}
      ORDER BY date ASC, start_time ASC
    `).all(...params);

    return {
      code: 0,
      data: schedules
    };
  });

  fastify.get('/month/:year/:month', async (request, reply) => {
    const { year, month } = request.params;
    const { department = '', type = '', status = '' } = request.query;
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const nextMonth = month == 12 ? 1 : parseInt(month) + 1;
    const nextYear = month == 12 ? parseInt(year) + 1 : year;
    const endDate = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;

    let whereClause = 'WHERE date >= ? AND date < ?';
    const params = [startDate, endDate];

    if (department) {
      whereClause += ' AND department = ?';
      params.push(department);
    }
    if (type) {
      whereClause += ' AND type = ?';
      params.push(type);
    }
    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    const schedules = db.prepare(`
      SELECT * FROM schedules
      ${whereClause}
      ORDER BY date ASC, start_time ASC
    `).all(...params);

    return { code: 0, data: schedules };
  });

  fastify.get('/:id', async (request, reply) => {
    const schedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(request.params.id);
    if (!schedule) {
      reply.code(404);
      return { code: -1, message: '排班不存在' };
    }
    return { code: 0, data: schedule };
  });

  fastify.post('/', async (request, reply) => {
    const { title, date, start_time, end_time, type, patient_id, patient_name, doctor, department, room, status, description } = request.body;

    if (!title || !date) {
      reply.code(400);
      return { code: -1, message: '标题和日期为必填项' };
    }

    if (start_time && end_time) {
      const s = timeToMinutes(start_time);
      const e = timeToMinutes(end_time);
      if (s !== null && e !== null && e <= s) {
        reply.code(400);
        return { code: -1, message: '结束时间必须晚于开始时间' };
      }
    }

    const finalStatus = status || 'scheduled';
    if (['scheduled', 'ongoing'].includes(finalStatus) && date && start_time) {
      const conflicts = findConflicts(db, date, start_time, end_time, doctor, room, patient_id);
      if (conflicts.length > 0) {
        reply.code(409);
        return { code: -1, message: '预约存在冲突', data: { conflicts } };
      }
    }

    const result = db.prepare(`
      INSERT INTO schedules (title, date, start_time, end_time, type, patient_id, patient_name, doctor, department, room, status, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      title, date, start_time || '', end_time || '', type || 'followup', 
      patient_id || null, patient_name || '', doctor || '', department || '', 
      room || '', finalStatus, description || ''
    );

    const schedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(result.lastInsertRowid);
    reply.code(201);
    return { code: 0, data: schedule, message: '创建成功' };
  });

  fastify.put('/:id', async (request, reply) => {
    const { title, date, start_time, end_time, type, patient_id, patient_name, doctor, department, room, status, description } = request.body;

    const schedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(request.params.id);
    if (!schedule) {
      reply.code(404);
      return { code: -1, message: '排班不存在' };
    }

    if (!title || !date) {
      reply.code(400);
      return { code: -1, message: '标题和日期为必填项' };
    }

    if (start_time && end_time) {
      const s = timeToMinutes(start_time);
      const e = timeToMinutes(end_time);
      if (s !== null && e !== null && e <= s) {
        reply.code(400);
        return { code: -1, message: '结束时间必须晚于开始时间' };
      }
    }

    const finalStatus = status || 'scheduled';
    if (['scheduled', 'ongoing'].includes(finalStatus) && date && start_time) {
      const conflicts = findConflicts(db, date, start_time, end_time, doctor, room, patient_id, request.params.id);
      if (conflicts.length > 0) {
        reply.code(409);
        return { code: -1, message: '预约存在冲突', data: { conflicts } };
      }
    }

    db.prepare(`
      UPDATE schedules SET title = ?, date = ?, start_time = ?, end_time = ?, type = ?, 
      patient_id = ?, patient_name = ?, doctor = ?, department = ?, room = ?, status = ?, description = ?,
      updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(
      title, date, start_time || '', end_time || '', type || 'followup', 
      patient_id || null, patient_name || '', doctor || '', department || '', 
      room || '', finalStatus, description || '', request.params.id
    );

    const updated = db.prepare('SELECT * FROM schedules WHERE id = ?').get(request.params.id);
    return { code: 0, data: updated, message: '更新成功' };
  });

  fastify.patch('/:id/status', async (request, reply) => {
    const { status } = request.body;

    const schedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(request.params.id);
    if (!schedule) {
      reply.code(404);
      return { code: -1, message: '排班不存在' };
    }

    db.prepare(`
      UPDATE schedules SET status = ?, updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(status, request.params.id);

    const updated = db.prepare('SELECT * FROM schedules WHERE id = ?').get(request.params.id);
    return { code: 0, data: updated, message: '状态更新成功' };
  });

  fastify.delete('/:id', async (request, reply) => {
    const schedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(request.params.id);
    if (!schedule) {
      reply.code(404);
      return { code: -1, message: '排班不存在' };
    }

    db.prepare('DELETE FROM schedules WHERE id = ?').run(request.params.id);
    return { code: 0, message: '删除成功' };
  });
}

export default scheduleRoutes;
