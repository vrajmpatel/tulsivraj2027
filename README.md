# Wedding Website

A Next.js site for the wedding, including the itinerary, guest list, wardrobe planner, and our story.

## Quick Start

```bash
pnpm install
pnpm dev
```

## Environment Variables

See `.env.example` for the required Supabase configuration.

## Host access

`/guest-list` and `/task-list` require a verified Supabase Auth account listed in
the server-only `ADMIN_EMAILS` environment variable. Every management action
checks the host again before accessing the database. Missing configuration,
unverified accounts, non-host accounts, and failed Auth verification deny access.

For this installation, the requested host is `vrajtulsi@gmail.com`. The local
`.env.local` allowlist is configured. A read-only check on September 13, 2026 found
that this email does **not** yet have a Supabase Auth account.

1. In the project's Supabase dashboard, create an email/password user for the
   host under **Authentication → Users**, and complete email verification.
   Keep the password in your password manager, not in this repository.
2. Set `ADMIN_EMAILS=vrajtulsi@gmail.com` in the deployment's server environment
   as well. Multiple approved addresses can be comma-separated. Do not use a
   `NEXT_PUBLIC_` prefix.
3. Restart locally, or deploy the reviewed changes with that configuration,
   then visit `/host-login`. Guest/task links and **Sign out** are available
   after login. Public RSVP submission does not require host login.

There is no public signup form. Existing deployment protection, if any, can
remain in place; the application checks do not depend on it. Removing an email
from `ADMIN_EMAILS` revokes host access on subsequent server requests after the
new environment configuration takes effect.

## Verification

Use Node.js 22 or newer and pnpm 10 (the lockfile was updated with pnpm 10.32.1).

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
# Or all four checks:
pnpm check
```

The lint baseline has zero errors and three existing image warnings, retained
for the separately planned image optimization work. Build-time lint and type
error enforcement is enabled. The tests check the actual management actions,
authorization helper, blocked page reads, sign-in/out, and public RSVP behavior
with mocked external services.

## Local browser review and performance baseline

```bash
pnpm exec playwright install chromium
pnpm test:review
```

On Windows, an installed Edge browser can be used without downloading Chromium:

```powershell
$env:REVIEW_BROWSER_CHANNEL = 'msedge'
pnpm test:review
```

The review command starts fake Auth/database services on `127.0.0.1:54329`, builds
a separate production app in `.next-review`, and starts it on `127.0.0.1:3100`.
Both ports must be free. It overrides Supabase configuration for its child
processes with fixture-only values; it does not modify your live database,
create real accounts, send email, or alter your regular `.next` build. The first
build needs network access for Google Fonts. Browser processes run headlessly
and the local servers are shut down at the end.

The fixture dataset starts with 100 invitees, 40 RSVPs, and 25 tasks. The review
checks redirects, rejected non-host login, approved login and management access,
a task write, public RSVP submission, sign-out, and revoked-session rejection.
It saves build output, mobile/desktop screenshots, and cold/warm measurements
for home, story, wardrobe, both management pages, and login in
`test-results/review/`. Measurements include transferred bytes, image/font
resources, JavaScript/CSS bytes, LCP, layout shifts, and database/Auth request
counts. They are single local samples at a 390×844 viewport, 4× CPU slowdown,
20 Mbps download / 5 Mbps upload, and 20 ms latency; they are not production
latency claims. RSVP timings use the local fixture database.

After a successful review build, `pnpm test:review --skip-build` reruns the browser
checks. Rebuild after application changes. See
`docs/order-0-1-implementation-review.md` for the recorded results and limitations.
