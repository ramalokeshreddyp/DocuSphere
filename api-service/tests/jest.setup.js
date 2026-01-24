process.env.NODE_ENV = 'test';
process.env.DB_DIALECT = 'sqlite';
process.env.DB_STORAGE = ':memory:';
process.env.DB_HOST = 'localhost';
process.env.DB_USER = 'notification';
process.env.DB_PASSWORD = 'notification';
process.env.DB_NAME = 'notifications';
// Keep defaults for rate limiting and redis; assumes local redis (or container) reachable on default port
