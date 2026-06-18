import config from '../config/index.js';

export const buildPagination = (page = config.pagination.defaultPage, pageSize = config.pagination.defaultPageSize) => {
  const p = Math.max(1, parseInt(page, 10) || config.pagination.defaultPage);
  const ps = Math.min(
    config.pagination.maxPageSize,
    Math.max(1, parseInt(pageSize, 10) || config.pagination.defaultPageSize)
  );
  return {
    limit: ps,
    offset: (p - 1) * ps,
    page: p,
    pageSize: ps
  };
};

export const buildWhereClause = (conditions) => {
  const clauses = [];
  const params = [];

  for (const { field, operator = '=', value, modifier } of conditions) {
    if (value === undefined || value === null || value === '') continue;

    if (operator === 'LIKE') {
      clauses.push(`${field} LIKE ?`);
      params.push(`%${value}%`);
    } else if (operator === 'IN') {
      if (!Array.isArray(value) || value.length === 0) continue;
      const placeholders = value.map(() => '?').join(',');
      clauses.push(`${field} IN (${placeholders})`);
      params.push(...value);
    } else if (operator === 'IS' || operator === 'IS NOT') {
      clauses.push(`${field} ${operator} ?`);
      params.push(value);
    } else if (operator === '>=') {
      clauses.push(`${field} >= ?`);
      params.push(value);
    } else if (operator === '<=') {
      clauses.push(`${field} <= ?`);
      params.push(value);
    } else if (operator === '>') {
      clauses.push(`${field} > ?`);
      params.push(value);
    } else if (operator === '<') {
      clauses.push(`${field} < ?`);
      params.push(value);
    } else if (operator === 'CUSTOM') {
      clauses.push(field);
      if (Array.isArray(value)) params.push(...value);
      else params.push(value);
    } else {
      clauses.push(`${field} = ?`);
      params.push(value);
    }

    if (modifier) modifier(clauses, params);
  }

  const whereClause = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
  return { whereClause, params };
};

export const buildKeywordCondition = (keyword, fields) => {
  if (!keyword) return null;
  const fieldClauses = fields.map((f) => `${f} LIKE ?`).join(' OR ');
  const params = fields.map(() => `%${keyword}%`);
  return { fieldClauses, params };
};

export const buildOrderClause = (orders) => {
  if (!orders || orders.length === 0) return '';
  const orderStr = orders
    .map(({ field, direction = 'ASC' }) => `${field} ${direction.toUpperCase()}`)
    .join(', ');
  return `ORDER BY ${orderStr}`;
};

export default {
  buildPagination,
  buildWhereClause,
  buildKeywordCondition,
  buildOrderClause
};
