"use server"

import { revalidatePath } from "next/cache"
import { requireHost } from "@/lib/host-auth"
import { createAdminClient } from "@/utils/supabase/admin"

const PATH = "/task-list"

export type ActionResult = { ok: true } | { ok: false; error: string }

/** Add a new planning task. */
export async function addTask(formData: FormData): Promise<ActionResult> {
  await requireHost(PATH)
  const title = String(formData.get("title") ?? "").trim()
  if (!title) return { ok: false, error: "A task title is required." }

  const assignee = String(formData.get("assignee") ?? "").trim()
  const priority = String(formData.get("priority") ?? "medium").trim()
  const due_date = String(formData.get("due_date") ?? "").trim()
  const event_type = String(formData.get("event_type") ?? "").trim()

  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from("task").insert({
      title,
      assignee: assignee || null,
      priority: ["low", "medium", "high"].includes(priority) ? priority : "medium",
      due_date: due_date || null,
      event_type: event_type || null,
    })
    if (error) throw error
  } catch (e) {
    console.error("addTask failed:", e)
    return { ok: false, error: "Could not add task. Please try again." }
  }

  revalidatePath(PATH)
  return { ok: true }
}

/** Toggle a task's completion state. */
export async function toggleTaskDone(id: string, done: boolean): Promise<ActionResult> {
  await requireHost(PATH)
  if (!id) return { ok: false, error: "Missing task id." }
  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from("task").update({ done }).eq("id", id)
    if (error) throw error
  } catch (e) {
    console.error("toggleTaskDone failed:", e)
    return { ok: false, error: "Could not update the task. Please try again." }
  }
  revalidatePath(PATH)
  return { ok: true }
}

/** Delete a task. */
export async function deleteTask(id: string): Promise<ActionResult> {
  await requireHost(PATH)
  if (!id) return { ok: false, error: "Missing task id." }
  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from("task").delete().eq("id", id)
    if (error) throw error
  } catch (e) {
    console.error("deleteTask failed:", e)
    return { ok: false, error: "Could not delete task. Please try again." }
  }
  revalidatePath(PATH)
  return { ok: true }
}
