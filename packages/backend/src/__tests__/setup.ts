process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@db_test:5432/kanban_test'
process.env.JWT_SECRET = 'test-secret-do-not-use-in-production'
process.env.NODE_ENV = 'test'
