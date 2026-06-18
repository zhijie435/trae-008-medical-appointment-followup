import Fastify from 'fastify';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import RepositoryFactory from '../src/repositories/index.js';
import ServiceFactory from '../src/services/index.js';
import ControllerFactory from '../src/controllers/index.js';
import responseHandler from '../src/middleware/responseHandler.js';
import cache from '../src/utils/cache.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function createTestDb() {
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      gender TEXT,
      age INTEGER,
      phone TEXT,
      id_card TEXT,
      diagnosis TEXT,
      admission_date TEXT,
      discharge_date TEXT,
      department TEXT,
      doctor TEXT,
      status TEXT DEFAULT 'active',
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS followups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      followup_date TEXT NOT NULL,
      followup_type TEXT,
      content TEXT,
      result TEXT,
      next_followup_date TEXT,
      doctor TEXT,
      status TEXT DEFAULT 'pending',
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      start_time TEXT,
      end_time TEXT,
      type TEXT,
      patient_id INTEGER,
      patient_name TEXT,
      doctor TEXT,
      department TEXT,
      room TEXT,
      status TEXT DEFAULT 'scheduled',
      description TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL
    );
  `);

  return db;
}

export function seedTestData(db) {
  cache.clear();

  const insertPatient = db.prepare(`
    INSERT INTO patients (name, gender, age, phone, id_card, diagnosis, admission_date, discharge_date, department, doctor, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const patients = [
    ['测试患者1', '男', 45, '13800138001', '110101198001011234', '高血压', '2024-01-15', '2024-01-20', '心内科', '李医生', 'active', '测试患者1备注'],
    ['测试患者2', '女', 32, '13800138002', '110101199202022345', '糖尿病', '2024-02-10', '2024-02-15', '内分泌科', '王医生', 'active', '测试患者2备注'],
    ['测试患者3', '男', 58, '13800138003', '110101196603033456', '冠心病', '2024-03-05', '2024-03-12', '心内科', '李医生', 'discharged', '测试患者3备注']
  ];

  const patientIds = [];
  for (const p of patients) {
    const result = insertPatient.run(...p);
    patientIds.push(result.lastInsertRowid);
  }

  const insertFollowup = db.prepare(`
    INSERT INTO followups (patient_id, followup_date, followup_type, content, result, next_followup_date, doctor, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const followups = [
    [patientIds[0], '2024-02-01', '电话随访', '询问血压控制情况', '血压稳定', '2024-03-01', '李医生', 'completed', ''],
    [patientIds[0], '2024-03-01', '门诊随访', '复查血压', '血压正常', '2024-04-01', '李医生', 'pending', ''],
    [patientIds[1], '2024-03-15', '电话随访', '血糖监测', '空腹血糖7.2', '2024-04-15', '王医生', 'pending', '']
  ];

  const followupIds = [];
  for (const f of followups) {
    const result = insertFollowup.run(...f);
    followupIds.push(result.lastInsertRowid);
  }

  const insertSchedule = db.prepare(`
    INSERT INTO schedules (title, date, start_time, end_time, type, patient_id, patient_name, doctor, department, room, status, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const schedules = [
    ['测试患者1-复查', '2024-04-01', '09:00', '09:30', 'followup', patientIds[0], '测试患者1', '李医生', '心内科', '门诊2室', 'scheduled', '高血压复查'],
    ['李医生门诊', '2024-04-01', '08:00', '12:00', 'clinic', null, '', '李医生', '心内科', '门诊2室', 'scheduled', '上午门诊'],
    ['科室例会', '2024-04-03', '08:30', '09:30', 'meeting', null, '', '', '全院', '会议室A', 'scheduled', '例会']
  ];

  const scheduleIds = [];
  for (const s of schedules) {
    const result = insertSchedule.run(...s);
    scheduleIds.push(result.lastInsertRowid);
  }

  return { patientIds, followupIds, scheduleIds };
}

export function buildTestApp(db) {
  cache.clear();

  const fastify = Fastify({ logger: false });

  fastify.register(responseHandler);

  const repos = new RepositoryFactory(db);
  const services = new ServiceFactory(repos);
  const controllers = new ControllerFactory(services);

  fastify.decorate('db', db);
  fastify.decorate('repos', repos);
  fastify.decorate('services', services);
  fastify.decorate('controllers', controllers);
  fastify.decorate('cache', cache);

  return fastify;
}

export async function teardownTestDb(db) {
  cache.clear();
  if (db) {
    db.close();
  }
}
