// Local test services only. Never imported by application code.
import { createServer } from "node:http"
import { randomUUID } from "node:crypto"

export const reviewEnvironment = {
  NEXT_BUILD_DIR: ".next-review",
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54329",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "review-publishable-key",
  SUPABASE_SERVICE_ROLE_KEY: "review-service-key",
  SUPABASE_SECRET_KEY: "",
  RSVP_IP_SALT: "review-fixture-salt",
  ADMIN_EMAILS: "host@example.test",
  NEXT_TELEMETRY_DISABLED: "1",
}

export function startFixtures() {
  const tables = {
    invitee: Array.from({ length: 100 }, (_, i) => ({
      id: `invitee-${i}`, created_at: "2026-08-01T12:00:00Z", full_name: `Fixture Household ${String(i).padStart(3, "0")}`,
      email: `guest${i}@example.test`, phone: null, side: "both", max_guests: 2,
      notes: null, invitation_sent: "not_yet", events: ["lagna"],
    })),
    rsvp: Array.from({ length: 40 }, (_, i) => ({
      id: `rsvp-${i}`, created_at: "2026-08-01T12:00:00Z", invitee_id: `invitee-${i}`,
      full_name: `Fixture Household ${String(i).padStart(3, "0")}`, email: `guest${i}@example.test`,
      phone: null, attending: true, guest_count: 2, message: null,
    })),
    task: Array.from({ length: 25 }, (_, i) => ({
      id: `task-${i}`, created_at: "2026-08-01T12:00:00Z", title: `Fixture task ${i}`,
      assignee: "Host", priority: "medium", due_date: "2027-01-01", event_type: "General", done: false,
    })),
  }
  const sessions = new Map()
  const stats = { auth: 0, reads: 0, writes: 0, authAttempts: [] }
  function session(email) {
    const user = { id: email === "host@example.test" ? "host-id" : "other-id", aud: "authenticated", role: "authenticated",
      email, email_confirmed_at: "2026-08-01T12:00:00Z", confirmed_at: "2026-08-01T12:00:00Z",
      created_at: "2026-08-01T12:00:00Z", app_metadata: { provider: "email", providers: ["email"] }, user_metadata: {}, is_anonymous: false }
    const exp = Math.floor(Date.now() / 1000) + 3600
    const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url")
    const access_token = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: user.id, email, role: "authenticated", aud: "authenticated", exp })}.${randomUUID()}`
    const result = { access_token, refresh_token: randomUUID(), expires_in: 3600, expires_at: exp, token_type: "bearer", user }
    sessions.set(access_token, result)
    return result
  }
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, reviewEnvironment.NEXT_PUBLIC_SUPABASE_URL)
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    const raw = Buffer.concat(chunks).toString()
    let body
    try { body = raw ? JSON.parse(raw) : {} } catch { body = {} }
    const send = (status, data, headers = {}) => {
      res.writeHead(status, { "Content-Type": "application/json", ...headers })
      res.end(req.method === "HEAD" ? undefined : JSON.stringify(data))
    }
    const token = req.headers.authorization?.replace(/^Bearer /, "")
    if (url.pathname.startsWith("/auth/")) stats.auth++
    if (url.pathname === "/auth/v1/token") {
      stats.authAttempts.push({ grant: url.searchParams.get("grant_type"), host: body.email === "host@example.test", validPassword: body.password === "fixture-password" })
      if (url.searchParams.get("grant_type") === "refresh_token") {
        const prior = [...sessions.values()].find((entry) => entry.refresh_token === body.refresh_token)
        return prior ? send(200, session(prior.user.email)) : send(400, { message: "Invalid refresh token" })
      }
      if (!["host@example.test", "outsider@example.test"].includes(body.email) || body.password !== "fixture-password") {
        return send(400, { error_code: "invalid_credentials", msg: "Invalid login credentials" })
      }
      return send(200, session(body.email))
    }
    if (url.pathname === "/auth/v1/user") {
      const active = sessions.get(token)
      return active ? send(200, active.user) : send(401, { message: "Invalid token", code: "bad_jwt" })
    }
    if (url.pathname === "/auth/v1/logout") {
      sessions.delete(token)
      return send(204, null)
    }
    const table = url.pathname.split("/").pop()
    if (!url.pathname.startsWith("/rest/v1/") || !tables[table]) return send(404, {})
    if (token !== reviewEnvironment.SUPABASE_SERVICE_ROLE_KEY) return send(403, { message: "Forbidden" })
    let rows = tables[table]
    for (const [key, filter] of url.searchParams) {
      if (filter.startsWith("eq.")) rows = rows.filter((row) => String(row[key]) === filter.slice(3))
      if (filter.startsWith("gte.")) rows = rows.filter((row) => row[key] >= filter.slice(4))
    }
    if (url.searchParams.has("or")) {
      const filters = url.searchParams.get("or").slice(1, -1).split(",")
      rows = rows.filter((row) => filters.some((filter) => {
        const [field, , ...rest] = filter.split(".")
        const expected = rest.join(".").replace(/^"|"$/g, "")
        const actual = field.endsWith("_norm") ? row[field.slice(0, -5)]?.trim().toLowerCase() : row[field]
        return actual === expected
      }))
    }
    if (req.method === "GET" || req.method === "HEAD") {
      stats.reads++
      const count = rows.length
      const order = url.searchParams.get("order")?.split(",") ?? []
      rows = [...rows].sort((a, b) => {
        for (const rule of order) {
          const [key, direction] = rule.split(".")
          const comparison = String(a[key] ?? "").localeCompare(String(b[key] ?? ""))
          if (comparison) return direction === "desc" ? -comparison : comparison
        }
        return 0
      })
      if (url.searchParams.has("limit")) rows = rows.slice(0, Number(url.searchParams.get("limit")))
      return send(200, rows, { "Content-Range": `0-${Math.max(0, rows.length - 1)}/${count}` })
    }
    stats.writes++
    if (req.method === "POST") tables[table].push({ id: randomUUID(), created_at: new Date().toISOString(), events: [], ...body })
    if (req.method === "PATCH") rows.forEach((row) => Object.assign(row, body))
    if (req.method === "DELETE") tables[table] = tables[table].filter((row) => !rows.includes(row))
    return send(201, null)
  })
  return new Promise((resolve, reject) => {
    server.on("error", reject)
    server.listen(54329, "127.0.0.1", () => resolve({ server, stats, tables, sessions }))
  })
}
