import type Stripe from "stripe";
import { discoverRunPaymentResources } from "../tooling/brunoPaymentRuntime.js";
import type { RunManifest, RunRef } from "../tooling/fixtures/types.js";

const ref: RunRef = { runId: "d23e4567-e89b-42d3-a456-426614174000", suite: "payment" };
const actor = { id: "owned-actor", email: `bruno-payment-${ref.runId.replaceAll("-", "")}-learner-a@example.com` };
const manifest: RunManifest = {
  version: 1,
  status: "active",
  ref,
  actors: { admin: actor, learnerA: actor, learnerB: actor },
  ids: { pendingCourse: "owned-course" },
  resources: [],
  retained: [],
};
function provider(overrides = {}) {
  return {
    customers: {
      list: async function* () {
        yield { id: "cus_owned", email: actor.email, metadata: { userId: actor.id } };
      },
    },
    checkout: {
      sessions: {
        list: async function* () {
          yield {
            id: "cs_test_owned",
            metadata: { userId: actor.id, courseId: "owned-course", enrollmentId: "owned-enrollment", ...overrides },
          };
        },
      },
    },
  } as unknown as Stripe;
}
it("discovers customer and checkout session ownership before a tracking request", async () => {
  await expect(discoverRunPaymentResources(ref, manifest, provider())).resolves.toEqual([
    { kind: "stripe-customer", id: "cus_owned" },
    { kind: "stripe-session", id: "cs_test_owned" },
  ]);
});
it("rejects foreign session metadata instead of cleaning another actor's resource", async () => {
  await expect(discoverRunPaymentResources(ref, manifest, provider({ userId: "foreign-user" }))).rejects.toThrow(
    "metadata"
  );
});
it("rejects a manifest email that is not the exact run-scoped payment email", async () => {
  await expect(
    discoverRunPaymentResources(
      ref,
      { ...manifest, actors: { ...manifest.actors, learnerA: { ...actor, email: "someone@example.com" } } },
      provider()
    )
  ).rejects.toThrow("run-owned");
});
