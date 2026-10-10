import { describe, expect, it } from "@jest/globals";
import { getTableColumns, getTableName } from "drizzle-orm";
import { user, userProfile } from "../../src/db/schema.js";

describe("profile schema", () => {
  it("stores extended profile fields outside the Better Auth user table", () => {
    const userColumns = getTableColumns(user);
    const profileColumns = getTableColumns(userProfile);

    expect(getTableName(userProfile)).toBe("user_profile");
    expect(userColumns).not.toHaveProperty("phoneNumber");
    expect(profileColumns).toHaveProperty("userId");
    expect(profileColumns).toHaveProperty("phoneNumber");
    expect(profileColumns).toHaveProperty("phoneVerified");
    expect(profileColumns).toHaveProperty("facebookUrl");
    expect(profileColumns).toHaveProperty("education");
  });
});
