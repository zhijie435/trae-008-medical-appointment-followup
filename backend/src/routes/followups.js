async function followupRoutes(fastify, options) {
  const db = fastify.db;

  fastify.get('/', async (request, reply) => {
    const { page = 1, pageSize = 10, patient_id = '', status = '', keyword = '', department = '', doctor = '' } = request.query;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (patient_id) {
      whereClause += ' AND f.patient_id = ?';
      params.push(patient_id);
    }

    if (status) {
      whereClause += ' AND f.status = ?';
      params.push(status);
    }

    if (department) {
      whereClause += ' AND p.department = ?';
      params.push(department);
    }

    if (doctor) {
      whereClause += ' AND (f.doctor = ? OR p.doctor = ?)';
      params.push(doctor, doctor);
    }

    if (keyword) {
      whereClause += ' AND (p.name LIKE ? OR f.content LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    const total = db.prepare(`
      SELECT COUNT(*) as count FROM followups f
      LEFT JOIN patients p ON f.patient_id = p.id
      ${whereClause}
    `).get(...params);

    const followups = db.prepare(`
      SELECT f.*, p.name as patient_name, p.gender, p.age, p.diagnosis, p.department as patient_department
      FROM followups f
      LEFT JOIN patients p ON f.patient_id = p.id
      ${whereClause}
      ORDER BY f.followup_date DESC
      LIMIT ? OFFSET ?
    `).all(...params, parseInt(pageSize), parseInt(offset));

    return {
      code: 0,
      data: {
        list: followups,
        total: total.count,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    };
  });

  fastify.get('/:id', async (request, reply) => {
    const followup = db.prepare(`
      SELECT f.*, p.name as patient_name, p.gender, p.age, p.phone, p.diagnosis
      FROM followups f
      LEFT JOIN patients p ON f.patient_id = p.id
      WHERE f.id = ?
    `).get(request.params.id);

    if (!followup) {
      reply.code(404);
      return { code: -1, message: '随访记录不存在' };
    }
    return { code: 0, data: followup };
  });

  fastify.get('/patient/:patientId', async (request, reply) => {
    const followups = db.prepare(`
      SELECT * FROM followups
      WHERE patient_id = ?
      ORDER BY followup_date DESC
    `).all(request.params.patientId);

    return { code: 0, data: followups };
  });

  fastify.get('/today/pending', async (request, reply) => {
    const today = new Date().toISOString().split('T')[0];
    const followups = db.prepare(`
      SELECT f.*, p.name as patient_name, p.gender, p.age, p.phone, p.diagnosis
      FROM followups f
      LEFT JOIN patients p ON f.patient_id = p.id
      WHERE f.followup_date = ? AND f.status = 'pending'
      ORDER BY f.created_at ASC
    `).all(today);

    return { code: 0, data: followups };
  });

  fastify.post('/', async (request, reply) => {
    const { patient_id, followup_date, followup_type, content, result, next_followup_date, doctor, status, notes } = request.body;

    const result_db = db.prepare(`
      INSERT INTO followups (patient_id, followup_date, followup_type, content, result, next_followup_date, doctor, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(patient_id, followup_date, followup_type || '电话随访', content || '', result || '', next_followup_date || '', doctor || '', status || 'pending', notes || '');

    const followup = db.prepare('SELECT * FROM followups WHERE id = ?').get(result_db.lastInsertRowid);
    reply.code(201);
    return { code: 0, data: followup, message: '创建成功' };
  });

  fastify.put('/:id', async (request, reply) => {
    const { patient_id, followup_date, followup_type, content, result, next_followup_date, doctor, status, notes } = request.body;

    const followup = db.prepare('SELECT * FROM followups WHERE id = ?').get(request.params.id);
    if (!followup) {
      reply.code(404);
      return { code: -1, message: '随访记录不存在' };
    }

    db.prepare(`
      UPDATE followups SET patient_id = ?, followup_date = ?, followup_type = ?, content = ?, 
      result = ?, next_followup_date = ?, doctor = ?, status = ?, notes = ?,
      updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(patient_id, followup_date, followup_type || '电话随访', content || '', result || '', next_followup_date || '', doctor || '', status || 'pending', notes || '', request.params.id);

    const updated = db.prepare('SELECT * FROM followups WHERE id = ?').get(request.params.id);
    return { code: 0, data: updated, message: '更新成功' };
  });

  fastify.patch('/:id/status', async (request, reply) => {
    const { status, result = '' } = request.body;

    const followup = db.prepare('SELECT * FROM followups WHERE id = ?').get(request.params.id);
    if (!followup) {
      reply.code(404);
      return { code: -1, message: '随访记录不存在' };
    }

    db.prepare(`
      UPDATE followups SET status = ?, result = ?, updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(status, result, request.params.id);

    const updated = db.prepare('SELECT * FROM followups WHERE id = ?').get(request.params.id);
    return { code: 0, data: updated, message: '状态更新成功' };
  });

  fastify.delete('/:id', async (request, reply) => {
    const followup = db.prepare('SELECT * FROM followups WHERE id = ?').get(request.params.id);
    if (!followup) {
      reply.code(404);
      return { code: -1, message: '随访记录不存在' };
    }

    db.prepare('DELETE FROM followups WHERE id = ?').run(request.params.id);
    return { code: 0, message: '删除成功' };
  });
}

export default followupRoutes;
