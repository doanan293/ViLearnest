const testDatabaseUrl = process.env.TEST_DATABASE_URL?.trim();
if (!testDatabaseUrl) {
  throw new Error("TEST_DATABASE_URL is required to run integration tests");
}

const databaseName = decodeURIComponent(new URL(testDatabaseUrl).pathname.slice(1));
if (!/(?:^|[_-])test(?:$|[_-])/i.test(databaseName)) {
  throw new Error("TEST_DATABASE_URL database name must clearly identify an isolated test database");
}

process.env.DATABASE_URL = testDatabaseUrl;
process.env.NODE_ENV = "test";
process.env.ARCJET_MODE ??= "DRY_RUN";
