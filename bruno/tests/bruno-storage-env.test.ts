import { describe, expect, it } from "@jest/globals";
import { getMissingBrunoStorageEnv } from "../tooling/brunoStorageEnv.js";

describe("bruno storage env", () => {
  it("returns no missing names when all storage variables are present", () => {
    expect(
      getMissingBrunoStorageEnv({
        AWS_ACCESS_KEY_ID: "key",
        AWS_SECRET_ACCESS_KEY: "secret",
        AWS_ENDPOINT_URL_S3: "http://localhost:9000",
        AWS_REGION: "us-east-1",
        NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES: "andv-lms-test",
      })
    ).toEqual([]);
  });

  it("reports the bucket alternative when both bucket variables are missing", () => {
    expect(getMissingBrunoStorageEnv({})).toEqual([
      "AWS_ACCESS_KEY_ID",
      "AWS_SECRET_ACCESS_KEY",
      "AWS_ENDPOINT_URL_S3",
      "AWS_REGION",
      "NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES or AWS_BUCKET_NAME",
    ]);
  });
});
