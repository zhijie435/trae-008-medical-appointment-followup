const DEFAULT_CONFIG = {
  server: {
    port: parseInt(process.env.PORT, 10) || 3001,
    host: process.env.HOST || '0.0.0.0'
  },
  cors: {
    origin: true,
    credentials: true
  },
  db: {
    filename: 'medical.db',
    journalMode: 'WAL',
    foreignKeys: 'ON'
  },
  cache: {
    ttl: 5 * 60 * 1000,
    maxSize: 200
  },
  pagination: {
    defaultPage: 1,
    defaultPageSize: 10,
    maxPageSize: 200
  },
  logger: {
    level: process.env.LOG_LEVEL || 'info'
  }
};

export const config = DEFAULT_CONFIG;
export default config;
