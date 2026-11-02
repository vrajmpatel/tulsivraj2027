# Repository efficiency review and proposed plan

Date: September 13, 2026. Status: **proposed; awaiting your review before implementation**.

The strongest opportunities are smaller image downloads, less unnecessary request processing, and fewer database round trips. The site is small enough that a new caching service, wholesale rewrite, or table virtualization would be premature.

This review covers application routes, components, Supabase clients, server actions, the RSVP endpoint, migrations, assets, and build configuration. It is a source review with a TypeScript check, not a production performance benchmark or complete security audit. File sizes below are original bytes on disk, expressed as decimal MB; actual browser transfers and latency have not been measured. Hosted database settings and any deployment-level access protection were not inspected.

## Recommended order

| Order | Work | Expected benefit | Rough effort | Risk |
| --- | --- | --- | --- | --- |
| 0 | Establish performance baselines and working build checks | Makes improvements measurable and catches regressions | Small | Low |
| 1 | Resolve the admin access-control finding separately | Protects guest data and host actions | Medium | Medium; requires choosing host access rules |
| 2 | Optimize photos and decorative textures | Largest likely improvement to mobile loading and bandwidth | Small–medium | Low; visual comparison needed |
| 3 | Scope Supabase session middleware | Removes unused auth processing from public requests | Small | Medium; coordinate with admin login |
| 4 | Consolidate RSVP database work | Fewer network round trips and repeated counts | Medium | Medium; database behavior must be preserved |
| 5 | Reduce admin mutation refresh work | Faster repeated edits, less data transfer | Medium | Medium; synchronization and rollback |
| 6 | Reduce shared CSS and client component scope | Smaller public-page payloads and less hydration | Medium | Medium; layout and interaction regressions |
| 7 | Prune unused scaffolding and centralize repeated content | Easier maintenance and smaller dependency footprint | Small–medium | Low |
| Later | Database pagination and indexed invitee matching | Handles growth beyond current small lists | Medium | Medium; search and totals must remain complete |

Effort is relative, not a delivery estimate. Each item should be independently reviewable and reversible. Recommended initial implementation scope is items 0–4, with the access-control work explicitly identified as a separate concern.

## 0. Establish a reliable baseline

**Evidence:** [next.config.mjs](C:/dev/tulsivraj2027/next.config.mjs:3) disables build-time TypeScript and ESLint failures. [package.json](C:/dev/tulsivraj2027/package.json:5) has a lint command, but no declared ESLint dependencies; no ESLint configuration or test suite was found.

The command `node node_modules/typescript/bin/tsc --noEmit --incremental false` **passed** outside the sandbox. Its first run produced dependency/type resolution errors under restricted file access; those are not confirmed code defects. A production build, lint run, browser profile, and live database tests were not performed.

**Plan:** Add explicit typecheck and noninteractive lint checks compatible with the installed Next.js 15 stack; enable build error enforcement after establishing a clean lint baseline. Record production-build route output and browser measurements for home, story, wardrobe, guest list, task list, and RSVP submission. Use local or staging fixtures for writes.

**Acceptance:** Build, typecheck, and lint pass. Save cold/warm transferred bytes, image sizes, LCP, layout shifts, client JavaScript, and request counts under consistent device/network settings. Add targeted behavioral tests for subsequent database/auth changes, rather than a broad snapshot suite.

## 1. Separate high-priority finding: admin routes have no application authorization

**Evidence:** [GuestListPage](C:/dev/tulsivraj2027/app/guest-list/page.tsx:36) and [TaskListPage](C:/dev/tulsivraj2027/app/task-list/page.tsx:36) read private tables using the privileged client. The [guest actions](C:/dev/tulsivraj2027/app/guest-list/actions.ts:79) and [task actions](C:/dev/tulsivraj2027/app/task-list/actions.ts:11) also use it without verifying a host identity. The middleware calls `getUser()` but never checks its result or rejects a request. Unlisted URLs and robots metadata do not enforce access.

If these routes are publicly reachable without deployment protection, visitors can read guest information and invoke management operations through the application. The service key itself is not shown to be leaked. Supabase's service-role access bypasses RLS, so table policies do not compensate for missing checks in application handlers. See [Supabase API key guidance](https://supabase.com/docs/guides/getting-started/api-keys).

**Plan:** Verify whether deployment protection exists, agree on the permitted host identities, then enforce a reusable server-side host authorization check in both pages and every management action. Add a `server-only` import to the privileged client module. Keep public RSVP submission accessible through its existing validated endpoint.

**Acceptance:** Anonymous and authenticated non-host requests cannot read either management page or mutate records, including direct action requests. Approved hosts can complete all existing workflows. Public RSVP still works.

This is an access-control issue, not a performance optimization, and needs its own review decision.

## 2. Replace oversized rendered assets

**Evidence:**

| Asset | Original size | Where used |
| --- | --- | --- |
| `public/indian_mango.png` | 9.90 MB | Repeated decorative backgrounds in itinerary, guide, admin, and story styles |
| `public/SMT063.jpg` | 5.61 MB | Homepage hero and multiple CSS hero backgrounds |
| `public/first_gift.jpg` | 1.94 MB | Story photo |
| `public/SMT0123.jpg` | 1.28 MB | Story photo |

[Hero](C:/dev/tulsivraj2027/components/hero.tsx:28) uses a plain image with no responsive sources. The [shared stylesheet](C:/dev/tulsivraj2027/app/globals.css:705) references the full texture at a displayed tile size of 520px. [Story](C:/dev/tulsivraj2027/components/our-story.tsx:278) and [wardrobe](C:/dev/tulsivraj2027/components/wardrobe-planner.tsx:354) use plain images too. Some already lazy-load, which should be preserved. The global `images.unoptimized` setting also disables optimization for any future Next Image usage; simply changing that flag will not optimize existing plain images or CSS backgrounds.

**Plan:** Generate suitably resized WebP/AVIF derivatives, especially a small repeating texture. Serve responsive photos using Next Image with optimization enabled, explicit `sizes`, stable dimensions, and appropriate first-screen loading priority. Update CSS background URLs separately, or use positioned responsive images where worthwhile. Preserve crop positions, texture transparency, and wardrobe original-file downloads. Choose pre-generated responsive files if the deployment cannot run the image optimizer; verify hosting support before selecting the pipeline. These options follow the [Next.js 15 image API](https://nextjs.org/docs/15/app/api-reference/components/image).

**Acceptance:** On cold mobile page loads, the original 9.90 MB texture and 5.61 MB hero are no longer downloaded for display. Initial working budgets: texture below 250 KB and mobile hero below 500 KB, subject to visual review. Confirm equivalent appearance on mobile/desktop, no new layout shifts, correct carousel behavior, and working downloads. Repeated references to one URL can share the browser cache; they are not separate full transfers on every use.

## 3. Restrict session middleware to routes that need it

**Evidence:** [middleware matcher](C:/dev/tulsivraj2027/middleware.ts:8) covers public pages, `/api/rsvp`, and non-excluded assets such as the web manifest. [Session middleware](C:/dev/tulsivraj2027/utils/supabase/middleware.ts:8) creates a Supabase server client and calls `auth.getUser()` for every match, while no current application route uses its result for authorization.

**Plan:** After defining host authentication, limit session-refresh middleware to protected management routes and the auth routes that actually require it. Exclude public content, RSVP submission, and static files. Keep authorization inside sensitive server handlers even with the narrower matcher.

**Acceptance:** Instrumentation shows no auth client work for public content/API requests. Host login and expired-session refresh still work. Do not claim one saved remote Auth request for every visitor: without a session, `getUser()` can terminate locally. The confirmed waste is unconditional middleware/client execution; remote savings depend on session state.

## 4. Consolidate RSVP validation at the database boundary

**Evidence:** [RSVP route](C:/dev/tulsivraj2027/app/api/rsvp/route.ts:91) sequentially requests total count, per-IP count, duplicate lookup, then insert: **four application-to-database requests on the successful path**. [The database trigger](C:/dev/tulsivraj2027/supabase/migrations/20260726143000_harden_rsvp.sql:86) repeats the two counts on insert. The bounded body reader and in-memory rate limiter already reject unwanted work before reaching the database and should remain.

**Plan:** Consolidate duplicate lookup, cap checks, and insert into one restricted database function called by the server route. Return explicit outcomes for success, duplicate, daily limit, and capacity. Preserve the existing API's validation and status semantics, including the distinct total-capacity response. Ensure the function is unavailable to public database roles and validate any privileged parameters.

Treat concurrency as part of this change: existing count-then-insert trigger checks can race across transactions. Design transaction-safe cap enforcement, such as consistent locking suitable for this low-volume workload, while preserving duplicate semantics and the email unique constraint. Do not just remove the checks from the route and assume the trigger guarantees atomic limits.

**Tradeoff:** A database migration adds more complexity than parallelizing reads. One RPC is the preferred endpoint design; a smaller interim change could parallelize independent preflight checks, reducing waiting but retaining four requests and duplicated count work.

**Acceptance:** One database request on successful submission; equal or better measured response time; tests for valid/invalid requests, duplicates, honeypot, missing configuration, daily and total limits, and concurrent attempts at the limits. Roll out using an additive migration before switching the route so reverting the application remains possible.

## 5. Avoid full-list work for every small admin edit

**Evidence:** Both management pages fetch entire query results. Every mutation calls `revalidatePath`; the current page can then render updated data, as described by [Next.js revalidatePath](https://nextjs.org/docs/15/app/api-reference/functions/revalidatePath). An invitation checkbox change can therefore cause both guest and RSVP lists to be queried and serialized again. There is no additional `router.refresh()` to remove. [Event toggles](C:/dev/tulsivraj2027/components/guest-admin.tsx:358) already show optimistic state, but send one action for each click.

**Plan:** Measure actual action traffic first. If material, return the changed row and reconcile local state for frequent status/event/task toggles. Coalesce rapid changes per invitee with an explicit per-row queue and rollback behavior. Retain a defined refresh path on navigation/manual refresh and after relevant structural changes so other host sessions and new RSVPs can become visible. Keep simpler path revalidation if profiling shows negligible cost at the current size.

**Acceptance:** A single-field edit no longer transfers unrelated collections when using the optimized path. Rapid event selections finish with the final intended state; failures restore consistent UI and show an error. Linking/deleting an RSVP updates summaries correctly. Test a second host session and navigation refresh. Do not add shared caching of private data as a shortcut.

## 6. Reduce global styling and client-side work incrementally

**Evidence:** [Root layout](C:/dev/tulsivraj2027/app/layout.tsx:3) includes five font families on all routes. WindSong is used by the homepage countdown. The globally imported stylesheet is 104,481 bytes of source CSS and includes page-specific wardrobe, itinerary, guide, admin, and story rules. This is not a measurement of compressed production CSS. Entire [itinerary](C:/dev/tulsivraj2027/components/itinerary.tsx:1), [guide](C:/dev/tulsivraj2027/components/travel-guide.tsx:1), and [story](C:/dev/tulsivraj2027/components/our-story.tsx:1) components are client boundaries, despite containing substantial static content.

**Plan:** Move page-specific styles to colocated CSS Modules while retaining shared tokens and base styles globally. Scope WindSong loading to the homepage. Where bundle measurements justify it, keep static content in server components and isolate scroll controls, popovers, and the story meter as client components. Preserve current DOM structure and visual behavior during each extraction.

**Acceptance:** Production network traces show reduced CSS/font/JavaScript payloads on unrelated routes. Mobile and desktop visual checks pass, including deep links, scrollspy, story meter endpoints, popovers, and back/forward navigation. Client components are still server-rendered initially; the opportunity is less client JavaScript and hydration, not enabling initial HTML rendering.

## 7. Remove unused scaffolding and repeated maintenance work

**Evidence:** The toast hooks in [hooks](C:/dev/tulsivraj2027/hooks/use-toast.ts) and [components/ui](C:/dev/tulsivraj2027/components/ui/use-toast.ts) are byte-identical, as are the two mobile hooks. The root layout uses Sonner. [styles/globals.css](C:/dev/tulsivraj2027/styles/globals.css) has no located import; the configured stylesheet is `app/globals.css`. The UI catalog contains chart, form, and other components with no located application consumers. Package cleanup candidates include Recharts and React Hook Form if their unused UI modules are removed. These are candidates pending full import-graph verification, not an instruction to delete every currently unused primitive.

Wedding events and venue details are also repeated across [event definitions](C:/dev/tulsivraj2027/lib/events.ts:11), itinerary, wardrobe, map, calendar, and countdown. Repeated content makes later date or venue edits unnecessarily error-prone.

**Plan:** Trace reachable imports from application entry points; confirm the desired retained UI toolkit, then remove unused modules and their exclusive dependencies together. Consolidate duplicate hooks and dead CSS. Centralize shared event/venue identifiers and facts while keeping page-specific copy local. Agree on the intended wedding time zone before changing the countdown's current viewer-local date construction.

**Acceptance:** Build/typecheck/lint and key user journeys pass. The dependency/lockfile diff contains only intended removals. Venue links, calendar output, event deep links, and guest event identifiers remain consistent. Expect maintenance/install benefits; unused tree-shaken dependencies are not automatically browser bundle costs.

## Later: bounded lists and indexed duplicate checks

[Guest loading](C:/dev/tulsivraj2027/app/guest-list/page.tsx:44) and task loading have no database pagination. The guest table's infinite scroll only reveals already-downloaded rows. [Invitee duplicate detection](C:/dev/tulsivraj2027/app/guest-list/actions.ts:43) downloads the guest list on each add/edit and normalizes names, emails, and phones in JavaScript. The documented working size is about 100 households, so this is currently a modest cost.

However, [local Supabase configuration](C:/dev/tulsivraj2027/supabase/config.toml:18) caps responses at 1,000 rows while the RSVP code aims to allow 2,000. If the hosted configuration matches, totals and duplicate matching can become incomplete above the response limit. The live limit was not verified.

**Plan when growth warrants it:** Use bounded server-side pagination and search, stable ordering with an ID tie-breaker, and separately computed complete summaries. Move invitee matching to indexed normalized fields or a database function, preserving whitespace collapsing, case folding, and current phone matching rules. Audit existing collisions and desired household matching before adding uniqueness constraints; do not silently merge records.

**Acceptance:** Fixtures above 1,000 rows remain searchable with correct totals and no missing/duplicated pages. Duplicate detection works beyond the first page and matches existing rules. Verify query plans before adding indexes; do not remove existing indexes merely because today's UI filters in memory.

## Changes I do not recommend without further evidence

- Adding another singleton around [utils/supabase/client.ts](C:/dev/tulsivraj2027/utils/supabase/client.ts:3). No application imports were found, and the installed `createBrowserClient` source already caches the browser client by default.
- Sharing a cookie-bound server Supabase client across requests. Request cookies must remain isolated.
- Adding Redis, a client data library, realtime subscriptions, or virtualization for the current small guest list without measurements showing a need.
- Rewriting the story animation's scroll scheduler: it already uses animation-frame coalescing, DOM updates, and observer cleanup.
- Optimizing the wardrobe directory scan as a per-request bottleneck without confirming production route behavior. The page is eligible for prerendering, so the scan can occur at build time.

## Review decisions before implementation

1. Approve or adjust the recommended first batch: build checks, separate admin access control, image optimization, scoped middleware, and RSVP consolidation.
2. For admin access control, choose the allowed host accounts and confirm any existing deployment protection.
3. Keep the remaining cleanup and admin scaling changes as follow-up work unless the baseline measurements justify bringing them forward.

Only this review document was added. Application code, assets, dependencies, database schema, and deployment were not changed.
