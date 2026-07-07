# Frontend Data Ownership Guidelines

- Use Server Components for SEO-critical public content and initial server-only data.
- Use TanStack Query for interactive client data, authenticated private screens, and mutation cache effects.
- Use local React state for temporary form, modal, and optimistic UI state.
- Use `router.push` or `router.replace` only for navigation.
- Do not use `router.refresh()` as a mutation synchronization mechanism.
- On mutation success, prefer `queryClient.setQueryData` when the response contains the fresh object and `queryClient.invalidateQueries` when several server-derived views must refetch.

## Direct API Calls That Can Stay Direct

- File uploads can stay direct when the upload component owns its own local progress and does not affect shared cached data.
- Server Components should keep using server API helpers for SEO-critical public content and request-scoped private data.
- Better Auth client calls can stay on `authClient` when Better Auth owns the session lifecycle; use explicit session refetch when profile or login changes need UI synchronization.

## Private Page Hydration

Private learner and admin pages can prefetch query data in Server Components and render a
`HydrationBoundary` around the Client Component that owns interaction. Use feature-owned
query option helpers for both `prefetchQuery` and `useQuery`.

Use this shape:

1. Server Component authenticates and reads route params.
2. Server Component creates a `QueryClient`.
3. Server Component calls `hydrateQueryClient(queryClient, [featureQueryOptions(...)])`.
4. Server Component renders `QueryHydrationBoundary`.
5. Client Component calls `useQuery(featureQueryOptions(...))`.

Public SEO content should stay server-rendered. Only viewer-specific state on public pages
should move to query-backed client components.

## Course Player

Private course player data should use query hydration for sidebar and lesson content. Keep
server-side entitlement checks in route layouts/pages, then hydrate the query cache for
client interaction. Mark-complete should update exact lesson/sidebar cache entries before
invalidating dashboard course cards.

## Public Enrollment CTA

Public course pages must keep SEO-critical content server-rendered. Only viewer-specific
CTA state, such as enrollment status and enroll loading, should be query-backed.

## Upload Lifecycle

File transfer state belongs to upload mutation hooks and local component state. Upload hooks
return storage keys; owner forms decide when those keys become persisted entity state and
when profile/course query caches should update.

## Final Migration Boundary

Use TanStack Query for shared server state, private page hydration, and command mutation
state. Do not migrate local-only UI state, public SEO content, Better Auth session state,
rich text editor internals, drag/drop state, or upload byte progress into query cache.

Profile and admin users pages should hydrate private data from Server Components. Auth
forms may use mutation hooks for command lifecycles, but the session remains owned by
Better Auth.
