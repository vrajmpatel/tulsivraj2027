-- RSVP feature schema: invitee (the guest list) + rsvp (responses from the site).
-- Columns are a reasonable starting point; adjust as the guest list firms up.

-- People who have been invited (the host-managed guest list).
create table if not exists public.invitee (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  full_name        text not null,
  email            text,
  phone            text,
  side             text,                       -- e.g. 'tulsi' | 'vraj' | 'both'
  max_guests       integer not null default 1, -- how many people this invite covers
  invitation_code  text unique,                -- optional lookup code for the invite
  notes            text
);

-- Responses submitted through the public RSVP form.
create table if not exists public.rsvp (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  invitee_id   uuid references public.invitee(id) on delete set null,
  full_name    text not null,
  email        text,
  phone        text,
  attending    boolean not null default true,
  guest_count  integer not null default 1,
  message      text
);

create index if not exists rsvp_invitee_id_idx on public.rsvp (invitee_id);
create index if not exists rsvp_email_idx on public.rsvp (email);

-- Row Level Security.
alter table public.invitee enable row level security;
alter table public.rsvp enable row level security;

-- The public form (anon/publishable key) only needs to insert RSVPs.
-- No select/update/delete policies are granted to the public, and the
-- invitee table has no public policies at all (locked to the service role),
-- so the guest list stays private.
create policy "Anyone can submit an RSVP"
  on public.rsvp
  for insert
  to anon, authenticated
  with check (true);
