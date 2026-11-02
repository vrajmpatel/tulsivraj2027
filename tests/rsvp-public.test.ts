import { beforeEach, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ admin: vi.fn(), from: vi.fn(), insert: vi.fn() }))
vi.mock("server-only", () => ({}))
vi.mock("@/utils/supabase/admin", () => ({ createAdminClient: mocks.admin }))
import { POST } from "@/app/api/rsvp/route"

beforeEach(() => {
  const query = {
    select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(), or: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(),
    insert: mocks.insert.mockResolvedValue({ error: null }),
    then: (resolve: (value: unknown) => void) => resolve({ data: [], count: 0, error: null }),
  }
  mocks.from.mockReturnValue(query)
  mocks.admin.mockReturnValue({ from: mocks.from })
})

function request(body: unknown) {
  return new Request("http://localhost/api/rsvp", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  })
}

it("accepts a valid public RSVP without a host session", async () => {
  const response = await POST(request({ full_name: "Fixture Guest", email: "guest@example.com", attending: true, guest_count: 2 }))
  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({ ok: true })
  expect(mocks.insert).toHaveBeenCalled()
})

it("rejects invalid data before opening a privileged client", async () => {
  expect((await POST(request({ full_name: "" }))).status).toBe(400)
  expect(mocks.admin).not.toHaveBeenCalled()
})

it("ignores honeypot submissions without database access", async () => {
  expect((await POST(request({ full_name: "Bot", website: "spam.example" }))).status).toBe(200)
  expect(mocks.admin).not.toHaveBeenCalled()
})
