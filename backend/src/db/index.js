import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataDir = join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = join(dataDir, 'medical.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDb() {
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

  const patientCount = db.prepare('SELECT COUNT(*) as count FROM patients').get();
  if (patientCount.count === 0) {
    const insertPatient = db.prepare(`
      INSERT INTO patients (name, gender, age, phone, id_card, diagnosis, admission_date, discharge_date, department, doctor, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const patients = [
      ['张三', '男', 45, '13800138001', '110101198001011234', '高血压', '2024-01-15', '2024-01-20', '心内科', '李医生', 'active', '患者血压控制良好，需定期随访'],
      ['李四', '女', 32, '13800138002', '110101199202022345', '糖尿病', '2024-02-10', '2024-02-15', '内分泌科', '王医生', 'active', '2型糖尿病，饮食控制中'],
      ['王五', '男', 58, '13800138003', '110101196603033456', '冠心病', '2024-03-05', '2024-03-12', '心内科', '李医生', 'active', '支架术后，需要密切随访'],
      ['赵六', '女', 67, '13800138004', '110101195704044567', '脑梗塞', '2024-01-20', '2024-02-05', '神经内科', '张医生', 'active', '恢复期，康复训练中'],
      ['孙七', '男', 41, '13800138005', '110101198305055678', '慢性胃炎', '2024-02-25', '2024-02-28', '消化内科', '刘医生', 'active', '幽门螺杆菌阳性，正在治疗']
    ];

    const stmt = db.transaction(() => {
      for (const p of patients) {
        insertPatient.run(...p);
      }
    });
    stmt();

    const insertFollowup = db.prepare(`
      INSERT INTO followups (patient_id, followup_date, followup_type, content, result, next_followup_date, doctor, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const followups = [
      [1, '2024-02-01', '电话随访', '询问血压控制情况，用药情况', '血压稳定，继续当前用药方案', '2024-03-01', '李医生', 'completed', '患者依从性好'],
      [1, '2024-03-01', '门诊随访', '复查血压、心电图', '血压135/85mmHg，心电图正常', '2024-04-01', '李医生', 'completed', ''],
      [2, '2024-03-15', '电话随访', '血糖监测情况，饮食控制', '空腹血糖7.2mmol/L，略高', '2024-04-15', '王医生', 'pending', '需要加强饮食控制'],
      [3, '2024-03-20', '门诊随访', '术后一月复查', '恢复良好，心功能正常', '2024-04-20', '李医生', 'pending', '继续服用抗凝药物'],
      [4, '2024-02-15', '上门随访', '康复评估', '肢体功能恢复3级', '2024-03-15', '张医生', 'completed', '建议继续康复训练']
    ];

    const stmt2 = db.transaction(() => {
      for (const f of followups) {
        insertFollowup.run(...f);
      }
    });
    stmt2();

    const insertSchedule = db.prepare(`
      INSERT INTO schedules (title, date, start_time, end_time, type, patient_id, patient_name, doctor, department, room, status, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const schedules = [
      ['张三-复查', '2024-04-01', '09:00', '09:30', 'followup', 1, '张三', '李医生', '心内科', '门诊2室', 'scheduled', '高血压定期复查'],
      ['李四-复查', '2024-04-15', '10:00', '10:30', 'followup', 2, '李四', '王医生', '内分泌科', '门诊3室', 'scheduled', '糖尿病随访'],
      ['王五-复查', '2024-04-20', '14:00', '14:45', 'followup', 3, '王五', '李医生', '心内科', '门诊2室', 'scheduled', '冠心病术后复查'],
      ['心内科门诊', '2024-04-02', '08:00', '12:00', 'clinic', null, '', '李医生', '心内科', '门诊2室', 'scheduled', '李医生上午门诊'],
      ['内分泌科门诊', '2024-04-02', '13:30', '17:00', 'clinic', null, '', '王医生', '内分泌科', '门诊3室', 'scheduled', '王医生下午门诊'],
      ['科室例会', '2024-04-03', '08:30', '09:30', 'meeting', null, '', '', '全院', '会议室A', 'scheduled', '每周科室例会']
    ];

    const stmt3 = db.transaction(() => {
      for (const s of schedules) {
        insertSchedule.run(...s);
      }
    });
    stmt3();
  }

  return db;
}

export default db;
