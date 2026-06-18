async function scheduleRoutes(fastify, options) {
  const db = fastify.db;

  fastify.get('/', async (request, reply) => {
    const { startDate, endDate, type = '', status = '', keyword = '' } = request.query;

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
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const nextMonth = month == 12 ? 1 : parseInt(month) + 1;
    const nextYear = month == 12 ? parseInt(year) + 1 : year;
    const endDate = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;

    const schedules = db.prepare(`
      SELECT * FROM schedules
      WHERE date >= ? AND date < ?
      ORDER BY date ASC, start_time ASC
    `).all(startDate, endDate);

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

    const result = db.prepare(`
      INSERT INTO schedules (title, date, start_time, end_time, type, patient_id, patient_name, doctor, department, room, status, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      title, date, start_time || '', end_time || '', type || 'followup', 
      patient_id || null, patient_name || '', doctor || '', department || '', 
      room || '', status || 'scheduled', description || ''
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

    db.prepare(`
      UPDATE schedules SET title = ?, date = ?, start_time = ?, end_time = ?, type = ?, 
      patient_id = ?, patient_name = ?, doctor = ?, department = ?, room = ?, status = ?, description = ?,
      updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(
      title, date, start_time || '', end_time || '', type || 'followup', 
      patient_id || null, patient_name || '', doctor || '', department || '', 
      room || '', status || 'scheduled', description || '', request.params.id
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
