import { describe, expect, it } from "@jest/globals";
import { getTableColumns } from "drizzle-orm";
import { account, user } from "../../src/db/schema.js";

describe("auth schema", () => {
  it("stores credential passwords on account records, not user records", () => {
    expect(getTableColumns(account)).toHaveProperty("password");
    expect(getTableColumns(user)).not.toHaveProperty("password");
  });
});
