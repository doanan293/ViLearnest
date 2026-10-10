import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "@jest/globals";

let tempCollection: string | undefined;

function sendJson(reply: ServerResponse, statusCode: number, body: unknown, headers: Record<string, string> = {}) {
  reply.writeHead(statusCode, { "content-type": "application/json", ...headers });
  reply.end(JSON.stringify(body));
}

async function runBruno(
  workingDir: string,
  request?: string
): Promise<{ status: number | null; stdout: string; stderr: string }> {
  const executable = join(process.cwd(), "node_modules", ".bin", "bru");
  const args = ["run", ...(request ? [request] : ["runtime-tests"]), "--env", "local", "--bail"];
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, { cwd: workingDir });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => child.kill("SIGKILL"), 10_000);
    child.stdout.setEncoding("utf8").on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.setEncoding("utf8").on("data", (chunk: string) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (status) => {
      clearTimeout(timer);
      resolve({ status, stdout, stderr });
    });
  });
}

function requestFile(name: string, actor: string, path: string, postResponse = "") {
  return `meta {
  name: ${name}
  type: http
}

get {
  url: {{baseUrl}}${path}
}

vars:pre-request {
  actor: ${actor}
}
${postResponse}
tests {
  test("returns the expected runtime probe status", function() {
    expect(res.status).to.equal(200);
  });
}
`;
}

describe("Bruno collection actor isolation", () => {
  afterEach(async () => {
    if (tempCollection) await rm(tempCollection, { recursive: true, force: true });
  });

  it("clears stale cookies and attaches only the explicitly selected actor session", async () => {
    let anonymousHadCredentials = false;
    let learnerHadOwnCookie = false;
    let externalHadCredentials = false;
    const server = createServer((request: IncomingMessage, response: ServerResponse) => {
      if (request.url === "/login") {
        sendJson(
          response,
          200,
          { ok: true },
          { "set-cookie": "better-auth.session_token=learner-a-session; Path=/; HttpOnly; SameSite=Lax" }
        );
        return;
      }
      const cookie = request.headers.cookie || "";
      const hasLmsAuth = Boolean(request.headers.authorization || cookie.includes("better-auth.session_token="));
      if (request.url === "/anonymous") {
        anonymousHadCredentials = hasLmsAuth;
        sendJson(response, hasLmsAuth ? 401 : 200, { ok: !hasLmsAuth });
        return;
      }
      if (request.url === "/learner") {
        learnerHadOwnCookie = cookie.includes("better-auth.session_token=learner-a-session");
        sendJson(response, learnerHadOwnCookie && !request.headers.authorization ? 200 : 401, {
          ok: learnerHadOwnCookie,
        });
        return;
      }
      if (request.url === "/external") {
        externalHadCredentials = hasLmsAuth || Boolean(request.headers["x-bruno-helper-token"]);
        sendJson(response, externalHadCredentials ? 401 : 200, { ok: !externalHadCredentials });
        return;
      }
      sendJson(response, 404, { ok: false });
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Bruno mock server did not bind to a TCP port");

    try {
      tempCollection = await mkdtemp(join(tmpdir(), "bruno-actor-isolation-"));
      const folder = join(tempCollection, "runtime-tests");
      const sharedCollection = await readFile(join(process.cwd(), "bruno", "collection.bru"), "utf8");
      await mkdir(folder, { recursive: true });
      await writeFile(
        join(tempCollection, "bruno.json"),
        JSON.stringify({ version: "1", name: "Runtime Probe", type: "collection" })
      );
      await writeFile(join(tempCollection, "collection.bru"), sharedCollection);
      await mkdir(join(tempCollection, "environments"), { recursive: true });
      await writeFile(
        join(tempCollection, "environments", "local.bru"),
        `vars {\n  baseUrl: http://127.0.0.1:${address.port}\n}\n`
      );
      await writeFile(
        join(folder, "01-login.bru"),
        requestFile(
          "Login",
          "anonymous",
          "/login",
          `script:post-response {
  const setCookie = res.headers["set-cookie"];
  const cookie = (Array.isArray(setCookie) ? setCookie : [setCookie]).find((value) => value && value.startsWith("better-auth.session_token="));
  if (!cookie) throw new Error("session cookie is missing");
  bru.setVar("session.learnerA", cookie.split(";")[0]);
}`
        )
      );
      await writeFile(join(folder, "02-anonymous.bru"), requestFile("Anonymous", "anonymous", "/anonymous"));
      await writeFile(join(folder, "03-learner.bru"), requestFile("Learner", "learnerA", "/learner"));
      await writeFile(join(folder, "04-external.bru"), requestFile("External", "external", "/external"));
      const result = await runBruno(tempCollection);

      expect(result.status).toBe(0);
      expect(anonymousHadCredentials).toBe(false);
      expect(learnerHadOwnCookie).toBe(true);
      expect(externalHadCredentials).toBe(false);

      await writeFile(join(folder, "05-missing-actor.bru"), requestFile("Missing Actor", "learnerB", "/learner"));
      const missingActor = await runBruno(tempCollection, "runtime-tests/05-missing-actor.bru");
      expect(missingActor.status).not.toBe(0);
      expect(missingActor.stdout + missingActor.stderr).toContain("session.learnerB is required");
      expect(learnerHadOwnCookie).toBe(true);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
