import { afterEach, describe, expect, it, jest } from "@jest/globals";

describe("Bruno integration database configuration", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.TEST_DATABASE_URL;
  });

  it("refuses to connect when an isolated test database URL is missing", async () => {
    delete process.env.TEST_DATABASE_URL;
    const { openIntegrationDatabase } = await import("../support/integrationDatabase.js");

    await expect(openIntegrationDatabase()).rejects.toThrow(
      "TEST_DATABASE_URL must point to an isolated test database"
    );
  });

  it("rejects database names that do not identify an isolated test database", async () => {
    const { openIntegrationDatabase } = await import("../support/integrationDatabase.js");

    await expect(
      openIntegrationDatabase({ TEST_DATABASE_URL: "postgres://user:password@localhost/production" })
    ).rejects.toThrow("database name must clearly identify an isolated test database");
  });
});
