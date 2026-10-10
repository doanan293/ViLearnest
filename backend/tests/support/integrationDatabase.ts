import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../src/db/schema.js";

export function requireTestDatabaseUrl(env: Record<string, string | undefined> = process.env) {
  const value = env.TEST_DATABASE_URL?.trim();
  if (!value) {
    throw new Error("TEST_DATABASE_URL must point to an isolated test database");
  }

  let databaseName: string;
  try {
    databaseName = decodeURIComponent(new URL(value).pathname.slice(1));
  } catch {
    throw new Error("TEST_DATABASE_URL must be a valid PostgreSQL URL");
  }

  if (!/(?:^|[_-])test(?:$|[_-])/i.test(databaseName)) {
    throw new Error("TEST_DATABASE_URL database name must clearly identify an isolated test database");
  }

  return value;
}

export async function openIntegrationDatabase(env: Record<string, string | undefined> = process.env) {
  const client = postgres(requireTestDatabaseUrl(env), { max: 2 });
  try {
    const db = drizzle(client, { schema });
    await client`select 1`;
    return {
      db,
      async close() {
        await client.end();
      },
    };
  } catch (error) {
    await client.end();
    throw error;
  }
}
