process.env.NODE_ENV = "test";
process.env.ARCJET_MODE ??= "DRY_RUN";
process.env.DATABASE_URL ??= "postgres://postgres:postgres@localhost:5432/postgres";
