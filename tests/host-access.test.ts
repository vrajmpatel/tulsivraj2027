import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(), signIn: vi.fn(), signOut: vi.fn(), from: vi.fn(), admin: vi.fn(),
}))
vi.mock("server-only", () => ({}))
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`REDIRECT:${url}`) } }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/utils/supabase/server", () => ({ createClient: async () => ({
  auth: { getUser: mocks.getUser, signInWithPassword: mocks.signIn, signOut: mocks.signOut },
}) }))
vi.mock("@/utils/supabase/admin", () => ({
  createAdminClient: mocks.admin, isAdminConfigured: () => true,
}))
vi.mock("@/components/guest-admin", () => ({ GuestAdmin: () => null }))
vi.mock("@/components/task-admin", () => ({ TaskAdmin: () => null }))
vi.mock("@/components/back-button", () => ({ BackButton: () => null }))
vi.mock("@/components/host-navigation", () => ({ HostNavigation: () => null }))

import { getHostUser, hostDestination, isHostUser, requireHost } from "@/lib/host-auth"
import * as guests from "@/app/guest-list/actions"
import * as tasks from "@/app/task-list/actions"
import GuestListPage from "@/app/guest-list/page"
import TaskListPage from "@/app/task-list/page"
import { signIn, signOut } from "@/app/host-login/actions"

const host = { id: "host-id", email: "vrajtulsi@gmail.com", email_confirmed_at: "2026-01-01", is_anonymous: false }
const outsider = { ...host, id: "other-id", email: "someone@example.com" }
function form(values: Record<string, string>) {
  const data = new FormData()
  for (const [key, value] of Object.entries(values)) data.set(key, value)
  return data
}
const guestForm = () => form({ full_name: "Fixture Guest", max_guests: "2" })
const operations = [
  ["addInvitee", () => guests.addInvitee(guestForm())],
  ["updateInvitee", () => guests.updateInvitee("id", guestForm())],
  ["deleteInvitee", () => guests.deleteInvitee("id")],
  ["setInvitationSent", () => guests.setInvitationSent("id", "digital")],
  ["setInviteeEvents", () => guests.setInviteeEvents("id", ["lagna"])],
  ["linkRsvp", () => guests.linkRsvp("rsvp", "invitee")],
  ["deleteRsvp", () => guests.deleteRsvp("id")],
  ["addTask", () => tasks.addTask(form({ title: "Fixture task" }))],
  ["toggleTaskDone", () => tasks.toggleTaskDone("id", true)],
  ["deleteTask", () => tasks.deleteTask("id")],
] as const

beforeEach(() => {
  vi.stubEnv("ADMIN_EMAILS", "vrajtulsi@gmail.com")
  mocks.getUser.mockResolvedValue({ data: { user: host }, error: null })
  mocks.signIn.mockResolvedValue({ data: { user: host }, error: null })
  mocks.signOut.mockResolvedValue({ error: null })
  const query = {
    select: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(), update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
    then: (resolve: (value: unknown) => void) => resolve({ data: [], error: null }),
  }
  mocks.from.mockReturnValue(query)
  mocks.admin.mockReturnValue({ from: mocks.from })
})

describe("verified host identity", () => {
  it("matches a verified email exactly, ignoring case and surrounding whitespace", () => {
    vi.stubEnv("ADMIN_EMAILS", " OTHER@example.com, VRAJTULSI@gmail.com ")
    expect(isHostUser(host)).toBe(true)
    expect(isHostUser({ ...host, email: "vrajtulsi@gmail.com.attacker.test" })).toBe(false)
  })
  it.each([null, outsider, { ...host, email_confirmed_at: undefined }, { ...host, is_anonymous: true }])(
    "rejects missing, non-host, unverified, or anonymous identities", (user) => expect(isHostUser(user)).toBe(false),
  )
  it("denies access when the allowlist is missing", async () => {
    vi.stubEnv("ADMIN_EMAILS", "")
    expect(await getHostUser()).toBeNull()
    expect(mocks.getUser).not.toHaveBeenCalled()
  })
  it("rejects an Auth error even if a user accompanies it", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: host }, error: new Error("revoked") })
    expect(await getHostUser()).toBeNull()
  })
  it("fails closed when Auth cannot be reached", async () => {
    mocks.getUser.mockRejectedValue(new Error("offline"))
    expect(await getHostUser()).toBeNull()
  })
  it("rechecks identity on subsequent requests", async () => {
    expect(await requireHost()).toEqual(host)
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null })
    await expect(requireHost()).rejects.toThrow("REDIRECT:/host-login")
  })
  it.each(["https://evil.test", "//evil.test", "/guest-list?next=evil", ["/task-list"], null])(
    "does not accept an arbitrary redirect destination", (value) => expect(hostDestination(value)).toBe("/guest-list"),
  )
})

describe.each([
  ["anonymous", null], ["authenticated non-host", outsider],
  ["unverified host", { ...host, email_confirmed_at: undefined }],
] as const)("%s requests", (_label, user) => {
  beforeEach(() => mocks.getUser.mockResolvedValue({ data: { user }, error: null }))
  it.each(operations)("blocks direct %s calls before constructing a privileged client", async (_name, call) => {
    await expect(call()).rejects.toThrow("REDIRECT:/host-login")
    expect(mocks.admin).not.toHaveBeenCalled()
    expect(mocks.from).not.toHaveBeenCalled()
  })
  it.each([GuestListPage, TaskListPage])("blocks management page reads", async (page) => {
    await expect(page()).rejects.toThrow("REDIRECT:/host-login")
    expect(mocks.admin).not.toHaveBeenCalled()
  })
})

describe("approved host", () => {
  it.each(operations)("allows %s", async (_name, call) => {
    await expect(call()).resolves.toEqual({ ok: true })
    expect(mocks.from).toHaveBeenCalled()
  })
})

describe("host sign in and sign out", () => {
  const loginForm = () => form({ email: host.email, password: "fixture-password", next: "/task-list" })
  it("redirects an approved host to the requested management page", async () => {
    await expect(signIn({ error: null }, loginForm())).rejects.toThrow("REDIRECT:/task-list")
  })
  it("clears a non-host session and returns a generic failure", async () => {
    mocks.signIn.mockResolvedValue({ data: { user: outsider }, error: null })
    const result = await signIn({ error: null }, loginForm())
    expect(result.error).toContain("Unable to sign in")
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "local" })
  })
  it("returns a generic failure for invalid credentials", async () => {
    mocks.signIn.mockResolvedValue({ data: { user: null }, error: new Error("invalid") })
    expect((await signIn({ error: null }, loginForm())).error).toContain("Unable to sign in")
  })
  it("signs out the current browser session", async () => {
    await expect(signOut()).rejects.toThrow("REDIRECT:/host-login")
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "local" })
  })
})
