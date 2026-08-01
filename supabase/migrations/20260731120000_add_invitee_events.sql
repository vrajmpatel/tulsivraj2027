-- Which of the wedding's five events each invitee household is invited to.
--
-- An array rather than a single value: a household is routinely invited to some
-- events but not all -- close family to the whole week, extended family often to
-- just the Sangeet and the Lagna. A single column could not express that.
--
-- Ids match lib/events.ts. Empty array means "not decided yet", which is where
-- every existing row starts.

alter table public.invitee
  add column if not exists events text[] not null default '{}';

-- `<@` is "contained by": every element must be one of the known event ids.
-- An empty array trivially passes, which is what we want for undecided rows.
alter table public.invitee drop constraint if exists invitee_events_chk;
alter table public.invitee add constraint invitee_events_chk
  check (events <@ array['mehendi','haldi-tulsi','haldi-vraj','sangeet','lagna']::text[]);

-- GIN so "who is coming to the Sangeet?" (events @> '{sangeet}') stays fast.
create index if not exists invitee_events_idx on public.invitee using gin (events);

-- The public keys were revoked from this table in 20260726143000_harden_rsvp;
-- restated here so a new column never widens that surface by accident.
revoke all on public.invitee from anon, authenticated;
