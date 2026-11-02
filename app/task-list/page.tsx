import { requireHost } from "@/lib/host-auth"
import { HostNavigation } from "@/components/host-navigation"
import type { Metadata } from "next"
import { BackButton } from "@/components/back-button"
import { TaskAdmin, type Task } from "@/components/task-admin"
import { createAdminClient, isAdminConfigured } from "@/utils/supabase/admin"

// Host authorization is checked before setup details or private data are read.
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Task List",
  robots: { index: false, follow: false, nocache: true },
}

export default async function TaskListPage() {
  await requireHost("/task-list")
  if (!isAdminConfigured()) {
    return (
      <main className="admin-root" style={{ minHeight: "100vh" }}>
        <HostNavigation />
        <BackButton />
        <div className="wrap" style={{ paddingTop: 120, paddingBottom: 120 }}>
          <span className="kicker">Setup needed</span>
          <h1 className="sec-title">Almost there</h1>
          <p className="sec-intro">
            To view the task list, add your Supabase service-role (secret) key
            to <code>.env.local</code> as{" "}
            <code>SUPABASE_SERVICE_ROLE_KEY</code>, then restart the dev
            server. You&apos;ll find it in your Supabase dashboard under{" "}
            <em>Project Settings → API Keys</em>.
          </p>
        </div>
      </main>
    )
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("task")
    .select("id, created_at, title, assignee, priority, due_date, event_type, done")
    .order("done", { ascending: true })
    .order("due_date", { ascending: true, nullsFirst: false })

  const tasks = (data ?? []) as Task[]

  return (
    <main className="min-h-screen">
      <HostNavigation />
      <BackButton />
      <TaskAdmin tasks={tasks} loadError={error?.message ?? null} />
    </main>
  )
}
