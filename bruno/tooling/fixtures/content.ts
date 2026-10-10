type PasswordEnv = {
  BRUNO_TEST_PASSWORD?: string;
};

export function getBrunoPassword(env: PasswordEnv = process.env) {
  return env.BRUNO_TEST_PASSWORD?.trim() || "BrunoPass123!";
}

export function tipTapDocument(text: string) {
  return JSON.stringify({
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text }],
      },
    ],
  });
}
