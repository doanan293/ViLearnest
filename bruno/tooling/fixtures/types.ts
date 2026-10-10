export const BRUNO_SUITES = [
  "auth",
  "profile",
  "public-courses",
  "admin-courses",
  "learning-access",
  "payment",
  "storage",
] as const;

export type SuiteName = (typeof BRUNO_SUITES)[number];
export type Actor = "admin" | "learnerA" | "learnerB";
export type RunRef = { runId: string; suite: SuiteName };
export type ActorFixture = { id: string; email: string; password: string };
export type PublicActorFixture = Omit<ActorFixture, "password">;
export type OwnedResource =
  | { kind: "database"; id: string }
  | { kind: "storage"; key: string }
  | { kind: "stripe-customer"; id: string }
  | { kind: "stripe-session"; id: string };

export type RunFixtures = {
  ref: RunRef;
  actors: Record<Actor, ActorFixture>;
  ids: Record<string, string>;
};

export type RunManifest = {
  version: 1;
  status: "preparing" | "active" | "cleaning" | "cleaned";
  ref: RunRef;
  actors: Record<Actor, PublicActorFixture>;
  ids: Record<string, string>;
  resources: OwnedResource[];
  retained: OwnedResource[];
  ownedStorageKeys?: string[];
};
