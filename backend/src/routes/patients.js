async function patientRoutes(fastify, options) {
  const db = fastify.db;

  fastify.get('/', async (request, reply) => {
    const { page = 1, pageSize = 10, keyword = '', status = '', department = '' } = request.query;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (keyword) {
      whereClause += ' AND (name LIKE ? OR phone LIKE ? OR diagnosis LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    if (department) {
      whereClause += ' AND department = ?';
      params.push(department);
    }

    const total = db.prepare(`SELECT COUNT(*) as count FROM patients ${whereClause}`).get(...params);
    
    const patients = db.prepare(`
      SELECT * FROM patients ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, parseInt(pageSize), parseInt(offset));

    return {
      code: 0,
      data: {
        list: patients,
        total: total.count,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    };
  });

  fastify.get('/departments', async (request, reply) => {
    const rows = db.prepare(`
      SELECT DISTINCT department FROM patients 
      WHERE department IS NOT NULL AND department != ''
      ORDER BY department
    `).all();
    const departments = rows.map(r => r.department);
    return { code: 0, data: departments };
  });

  fastify.get('/all', async (request, reply) => {
    const patients = db.prepare("SELECT id, name, gender, age, phone, diagnosis FROM patients WHERE status = 'active' ORDER BY name").all();
    return {
      code: 0,
      data: patients
    };
  });

  fastify.get('/:id', async (request, reply) => {
    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(request.params.id);
    if (!patient) {
      reply.code(404);
      return { code: -1, message: '患者不存在' };
    }
    return { code: 0, data: patient };
  });

  fastify.post('/', async (request, reply) => {
    const { name, gender, age, phone, id_card, diagnosis, admission_date, discharge_date, department, doctor, status, notes } = request.body;

    const result = db.prepare(`
      INSERT INTO patients (name, gender, age, phone, id_card, diagnosis, admission_date, discharge_date, department, doctor, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, gender || '', age || 0, phone || '', id_card || '', diagnosis || '', admission_date || '', discharge_date || '', department || '', doctor || '', status || 'active', notes || '');

    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(result.lastInsertRowid);
    reply.code(201);
    return { code: 0, data: patient, message: '创建成功' };
  });

  fastify.put('/:id', async (request, reply) => {
    const { name, gender, age, phone, id_card, diagnosis, admission_date, discharge_date, department, doctor, status, notes } = request.body;

    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(request.params.id);
    if (!patient) {
      reply.code(404);
      return { code: -1, message: '患者不存在' };
    }

    db.prepare(`
      UPDATE patients SET name = ?, gender = ?, age = ?, phone = ?, id_card = ?, diagnosis = ?, 
      admission_date = ?, discharge_date = ?, department = ?, doctor = ?, status = ?, notes = ?,
      updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(name, gender || '', age || 0, phone || '', id_card || '', diagnosis || '', admission_date || '', discharge_date || '', department || '', doctor || '', status || 'active', notes || '', request.params.id);

    const updated = db.prepare('SELECT * FROM patients WHERE id = ?').get(request.params.id);
    return { code: 0, data: updated, message: '更新成功' };
  });

  fastify.delete('/:id', async (request, reply) => {
    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(request.params.id);
    if (!patient) {
      reply.code(404);
      return { code: -1, message: '患者不存在' };
    }

    db.prepare('DELETE FROM patients WHERE id = ?').run(request.params.id);
    return { code: 0, message: '删除成功' };
  });
}

export default patientRoutes;
