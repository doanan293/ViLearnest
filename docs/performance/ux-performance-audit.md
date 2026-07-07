# UX Performance Audit

## Production Build

Run `npm run build -w frontend` from the repository root. Review the Next.js route output
for unexpectedly large client bundle entries and routes that should remain mostly
server-rendered but pull in heavy client code.

## Web Vitals

After deploy, review Vercel Speed Insights for LCP, INP, and CLS. Treat repeated poor
metrics on a route as a follow-up issue with the route path, metric, device class, and
observed value.

## Bundle Review

Use the production build output as the first client bundle audit. Check whether a route that
should be mostly server-rendered pulls in editor, chart, upload, or admin-only code.

## Render Review

Use React DevTools Profiler locally when a route feels slow after data is cached. Capture
which component re-renders, what interaction caused it, and whether the render work is
avoidable.

## Follow-Up Template

- Route:
- Metric or interaction:
- Observed value:
- Expected behavior:
- Suspected component or bundle:
- Verification command:
