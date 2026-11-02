import { spawn } from "node:child_process"
import { once } from "node:events"
import { mkdir, writeFile } from "node:fs/promises"
import { chromium } from "@playwright/test"
import assert from "node:assert/strict"
import { reviewEnvironment, startFixtures } from "./review-fixtures.mjs"

const env = { ...process.env, ...reviewEnvironment }
const origin = "http://127.0.0.1:3100"
const output = "test-results/review"
await mkdir(output, { recursive: true })
const fixtures = await startFixtures()
let app
let browser
let serverLog = ""
let reviewPage
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const launch = (args) => spawn(process.execPath, args, { env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] })

try {
  if (!process.argv.includes("--skip-build")) {
    console.log("Building isolated production app with local fixture services...")
    const build = launch(["node_modules/next/dist/bin/next", "build"])
    let buildLog = ""
    for (const stream of [build.stdout, build.stderr]) stream.on("data", (chunk) => { buildLog += chunk; process.stdout.write(chunk) })
    const [buildCode] = await once(build, "exit")
    await writeFile(`${output}/build.log`, buildLog)
    assert.equal(buildCode, 0, "Review production build failed")
  }

  app = launch(["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3100"])
  for (const stream of [app.stdout, app.stderr]) stream.on("data", (chunk) => { serverLog += chunk })
  let ready = false
  for (let attempt = 0; attempt < 60; attempt++) {
    try { if ((await fetch(`${origin}/host-login`)).ok) { ready = true; break } } catch { /* startup */ }
    await delay(500)
  }
  assert.ok(ready, `Review server did not start: ${serverLog}`)
  browser = await chromium.launch({ headless: true, ...(process.env.REVIEW_BROWSER_CHANNEL ? { channel: process.env.REVIEW_BROWSER_CHANNEL } : {}) })
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  const page = await context.newPage()
  reviewPage = page
  const errors = []
  page.on("pageerror", (error) => errors.push(error.message))

  for (const route of ["/guest-list", "/task-list"]) {
    const reads = fixtures.stats.reads
    await page.goto(origin + route)
    assert.ok(new URL(page.url()).pathname === "/host-login", "Anonymous admin request should redirect")
    assert.equal(fixtures.stats.reads, reads, "Anonymous request must not read private tables")
  }
  await page.getByLabel("Email", { exact: true }).fill("outsider@example.test")
  await page.getByLabel("Password", { exact: true }).fill("fixture-password")
  await page.getByRole("button", { name: "Sign in", exact: true }).click()
  await page.getByRole("alert").waitFor()
  assert.equal(new URL(page.url()).pathname, "/host-login")
  await page.goto(`${origin}/host-login?next=/task-list`)
  await page.getByLabel("Email", { exact: true }).fill("host@example.test")
  await page.getByLabel("Password", { exact: true }).fill("fixture-password")
  await page.getByRole("button", { name: "Sign in", exact: true }).click()
  await page.waitForURL(`${origin}/task-list`, { timeout: 15000 })
  assert.ok((await page.textContent("body")).includes("Fixture task"))
  // Simulate expiry in the real SSR cookie; middleware must refresh it.
  const cookie = (await context.cookies()).find((item) => item.name.endsWith("-auth-token"))
  assert.ok(cookie, "Expected a fixture Supabase session cookie")
  const expiredSession = JSON.parse(Buffer.from(cookie.value.slice(7), "base64url").toString())
  expiredSession.expires_at = Math.floor(Date.now() / 1000) - 60
  const expiredCookie = `base64-${Buffer.from(JSON.stringify(expiredSession)).toString("base64url")}`
  await context.addCookies([{ ...cookie, value: expiredCookie }])
  await page.goto(`${origin}/task-list`)
  assert.equal(new URL(page.url()).pathname, "/task-list")
  assert.ok(fixtures.stats.authAttempts.some((attempt) => attempt.grant === "refresh_token"), "Expired session should use Auth refresh")
  await page.screenshot({ path: `${output}/tasks-mobile.png` })

  const title = page.locator('input[name="title"]')
  await title.fill("Review added task")
  await title.locator("xpath=ancestor::form").locator('button[type="submit"]').click()
  await page.getByText("Review added task", { exact: true }).waitFor()
  assert.ok(fixtures.tables.task.some((task) => task.title === "Review added task"))

  await page.goto(`${origin}/guest-list`)
  await page.getByRole("heading", { name: "Guest List & RSVPs" }).waitFor()
  await page.screenshot({ path: `${output}/guests-mobile.png` })
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 }, storageState: await context.storageState() })
  const desktopPage = await desktop.newPage()
  await desktopPage.goto(`${origin}/guest-list`)
  await desktopPage.screenshot({ path: `${output}/guests-desktop.png` })
  await desktop.close()

  const authState = await context.storageState()
  const baselines = []
  for (const route of ["/", "/our-story", "/wardrobe-planner", "/guest-list", "/task-list", "/host-login"]) {
    const measured = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
      ...(["/guest-list", "/task-list"].includes(route) ? { storageState: authState } : {}) })
    const tab = await measured.newPage()
    const cdp = await measured.newCDPSession(tab)
    await cdp.send("Network.enable")
    await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 20, downloadThroughput: 2_500_000, uploadThroughput: 625_000 })
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 })
    await tab.addInitScript(() => {
      window.__reviewMetrics = { lcp: null, cls: 0 }
      new PerformanceObserver((list) => { const entries = list.getEntries(); window.__reviewMetrics.lcp = entries[entries.length - 1].startTime }).observe({ type: "largest-contentful-paint", buffered: true })
      new PerformanceObserver((list) => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__reviewMetrics.cls += entry.value }).observe({ type: "layout-shift", buffered: true })
    })
    for (const cache of ["cold", "warm"]) {
      console.log(`Measuring ${route} (${cache})...`)
      const before = { ...fixtures.stats }
      await tab.goto(origin + route, { waitUntil: "load", timeout: 90000 })
      await tab.evaluate(() => document.fonts.ready)
      await tab.waitForTimeout(1500)
      const metrics = await tab.evaluate(() => {
        const resources = performance.getEntriesByType("resource")
        const navigation = performance.getEntriesByType("navigation")[0]
        return { ...window.__reviewMetrics, ttfbMs: navigation.responseStart, loadMs: navigation.loadEventEnd,
          transferredBytes: navigation.transferSize + resources.reduce((sum, item) => sum + item.transferSize, 0),
          jsBytes: resources.filter((item) => /\.js(?:\?|$)/.test(item.name)).reduce((sum, item) => sum + item.encodedBodySize, 0),
          cssBytes: resources.filter((item) => /\.css(?:\?|$)/.test(item.name)).reduce((sum, item) => sum + item.encodedBodySize, 0),
          fonts: resources.filter((item) => /\.woff2?(?:\?|$)/.test(item.name)).map((item) => ({ path: new URL(item.name).pathname, transferredBytes: item.transferSize })),
          images: resources.filter((item) => /\.(jpg|jpeg|png|webp|avif)(?:\?|$)/.test(item.name)).map((item) => ({ path: new URL(item.name).pathname, transferredBytes: item.transferSize })),
          requests: resources.length + 1 }
      })
      baselines.push({ route, cache, audience: ["/guest-list", "/task-list"].includes(route) ? "host" : "anonymous", ...metrics, databaseRequests: fixtures.stats.reads - before.reads + fixtures.stats.writes - before.writes, authRequests: fixtures.stats.auth - before.auth })
      if (route === "/host-login" && cache === "cold") await tab.screenshot({ path: `${output}/login-mobile.png` })
    }
    await measured.close()
  }

  const writes = fixtures.stats.writes
  const reads = fixtures.stats.reads
  const started = performance.now()
  const publicContext = await browser.newContext()
  const response = await publicContext.request.post(`${origin}/api/rsvp`, { data: { full_name: "Review public guest", email: "review-guest@example.test", attending: true, guest_count: 2 } })
  assert.equal(response.status(), 200)
  assert.equal(fixtures.stats.writes, writes + 1)
  const rsvp = { durationMs: performance.now() - started, databaseRequests: fixtures.stats.reads - reads + fixtures.stats.writes - writes, status: response.status() }
  await publicContext.close()
  await page.getByRole("button", { name: "Sign out", exact: true }).click()
  await page.waitForURL(`${origin}/host-login`)
  await page.goto(`${origin}/guest-list`)
  assert.equal(new URL(page.url()).pathname, "/host-login")
  // A forged/stale cookie cannot pass remote user verification.
  await context.addCookies(authState.cookies)
  fixtures.sessions.clear()
  await page.goto(`${origin}/task-list`)
  assert.equal(new URL(page.url()).pathname, "/host-login")
  assert.deepEqual(errors, [], "Browser should not report uncaught runtime errors")
  await writeFile(`${output}/baseline.json`, JSON.stringify({ measuredAt: new Date().toISOString(), environment: "Local production build; fixture Auth/database; 390x844; CPU 4x; 20 Mbps down / 5 Mbps up; 20ms latency; single cold/warm samples; first viewport", fixtureRows: { invitees: 100, rsvps: 40, tasks: 25 }, baselines, rsvp, browserErrors: errors }, null, 2))
  await writeFile(`${output}/server.log`, serverLog)
  console.log(`Review passed. Baselines, screenshots, and build output saved in ${output}.`)
} catch (error) {
  if (reviewPage) {
    await reviewPage.screenshot({ path: `${output}/failure.png` }).catch(() => {})
    console.error("Review page:", await reviewPage.locator("body").innerText().catch(() => "unavailable"))
  }
  console.error("Fixture request counts:", fixtures.stats)
  throw error
} finally {
  await writeFile(`${output}/server.log`, serverLog)
  if (browser) await browser.close()
  if (app) { app.kill(); await once(app, "exit").catch(() => {}) }
  fixtures.server.closeAllConnections()
  fixtures.server.close()
}
