-- Host-only wedding task list (planning to-dos), shown on the hidden /task-list page.

create table if not exists public.task (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  title       text not null,
  assignee    text,                                    -- person responsible
  priority    text not null default 'medium'
                check (priority in ('low', 'medium', 'high')),
  due_date    date,
  event_type  text,                                     -- e.g. 'Mehendi', 'Sangeet', 'General'
  done        boolean not null default false
);

create index if not exists task_done_idx on public.task (done);
create index if not exists task_due_date_idx on public.task (due_date);

-- Row Level Security. Like `invitee`, this is host-only data with no public
-- policies at all — the hidden /task-list page reads and writes it exclusively
-- through the server-only service-role client.
alter table public.task enable row level security;
