import { buildPagination, buildWhereClause, buildOrderClause, buildKeywordCondition } from '../utils/queryBuilder.js';

class BaseRepository {
  constructor(db, tableName, primaryKey = 'id') {
    this.db = db;
    this.tableName = tableName;
    this.primaryKey = primaryKey;
  }

  _prepare(sql) {
    return this.db.prepare(sql);
  }

  _runTransaction(fn) {
    const wrapped = this.db.transaction(fn);
    return wrapped();
  }

  findById(id) {
    return this._prepare(`SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = ?`).get(id);
  }

  findOne(conditions = [], orders = []) {
    const { whereClause, params } = buildWhereClause(conditions);
    const orderClause = buildOrderClause(orders);
    return this._prepare(
      `SELECT * FROM ${this.tableName} ${whereClause} ${orderClause} LIMIT 1`
    ).get(...params);
  }

  findAll(conditions = [], orders = []) {
    const { whereClause, params } = buildWhereClause(conditions);
    const orderClause = buildOrderClause(orders);
    return this._prepare(
      `SELECT * FROM ${this.tableName} ${whereClause} ${orderClause}`
    ).all(...params);
  }

  findWithKeyword(keyword, keywordFields, conditions = [], orders = []) {
    const { whereClause: baseWhere, params: baseParams } = buildWhereClause(conditions);
    let whereClause = baseWhere;
    let params = baseParams;

    if (keyword) {
      const kw = buildKeywordCondition(keyword, keywordFields);
      const connector = baseWhere ? ' AND ' : ' WHERE ';
      whereClause = `${baseWhere} ${connector} (${kw.fieldClauses})`;
      params = [...params, ...kw.params];
    }

    const orderClause = buildOrderClause(orders);
    return this._prepare(
      `SELECT * FROM ${this.tableName} ${whereClause} ${orderClause}`
    ).all(...params);
  }

  findPaginated(page, pageSize, conditions = [], orders = [], keyword = null, keywordFields = []) {
    const pagination = buildPagination(page, pageSize);
    const { whereClause: baseWhere, params: baseParams } = buildWhereClause(conditions);
    let whereClause = baseWhere;
    let params = baseParams;

    if (keyword && keywordFields.length > 0) {
      const kw = buildKeywordCondition(keyword, keywordFields);
      const connector = baseWhere ? ' AND ' : ' WHERE ';
      whereClause = `${baseWhere} ${connector} (${kw.fieldClauses})`;
      params = [...params, ...kw.params];
    }

    const countResult = this._prepare(
      `SELECT COUNT(*) as count FROM ${this.tableName} ${whereClause}`
    ).get(...params);

    const orderClause = buildOrderClause(orders);
    const list = this._prepare(
      `SELECT * FROM ${this.tableName} ${whereClause} ${orderClause} LIMIT ? OFFSET ?`
    ).all(...params, pagination.limit, pagination.offset);

    return {
      list,
      total: countResult.count,
      page: pagination.page,
      pageSize: pagination.pageSize
    };
  }

  count(conditions = []) {
    const { whereClause, params } = buildWhereClause(conditions);
    const result = this._prepare(
      `SELECT COUNT(*) as count FROM ${this.tableName} ${whereClause}`
    ).get(...params);
    return result.count;
  }

  exists(conditions = []) {
    return this.count(conditions) > 0;
  }

  create(data) {
    const fields = Object.keys(data);
    const placeholders = fields.map(() => '?').join(', ');
    const values = Object.values(data);
    const result = this._prepare(
      `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders})`
    ).run(...values);
    return this.findById(result.lastInsertRowid);
  }

  update(id, data) {
    const fields = Object.keys(data).filter((k) => k !== this.primaryKey);
    const setClause = fields.map((f) => `${f} = ?`).join(', ');
    const values = fields.map((f) => data[f]);
    values.push(id);
    this._prepare(
      `UPDATE ${this.tableName} SET ${setClause}, updated_at = datetime('now', 'localtime') WHERE ${this.primaryKey} = ?`
    ).run(...values);
    return this.findById(id);
  }

  patch(id, data) {
    return this.update(id, data);
  }

  delete(id) {
    const result = this._prepare(
      `DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = ?`
    ).run(id);
    return result.changes > 0;
  }

  raw(sql, params = []) {
    return this._prepare(sql).all(...params);
  }

  rawGet(sql, params = []) {
    return this._prepare(sql).get(...params);
  }

  rawRun(sql, params = []) {
    return this._prepare(sql).run(...params);
  }
}

export default BaseRepository;
