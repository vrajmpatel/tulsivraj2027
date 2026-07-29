-- Harden the public RSVP path against abuse.
--
-- Previously `rsvp` carried an INSERT policy for `anon`, which meant anyone
-- could POST rows straight at the Supabase REST API using the publishable key
-- that ships in the browser bundle -- bypassing /api/rsvp along with its
-- duplicate check, size limits and rate limits. The app writes RSVPs with the
-- service-role client, which bypasses RLS entirely, so no public policy is
-- needed for the form to keep working.

drop policy if exists "Anyone can submit an RSVP" on public.rsvp;

-- Belt and braces: drop the table privileges too, so a policy added by mistake
-- later still can't hand write access to the public keys.
revoke all on public.rsvp from anon, authenticated;
revoke all on public.invitee from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Submitter fingerprint (for rate limiting)
-- ---------------------------------------------------------------------------
-- A salted SHA-256 of the client address rather than the address itself, so we
-- can count submissions per person without storing anyone's IP.
alter table public.rsvp add column if not exists ip_hash text;

create index if not exists rsvp_created_at_idx on public.rsvp (created_at desc);
create index if not exists rsvp_ip_hash_created_at_idx
  on public.rsvp (ip_hash, created_at desc);

-- ---------------------------------------------------------------------------
-- Normalised lookup columns (for duplicate detection)
-- ---------------------------------------------------------------------------
-- The duplicate check used to run `ilike` against raw user input, so a guest
-- submitting `%` as their name matched every existing row. Comparing against
-- stored, normalised values lets the check use plain equality -- no pattern
-- metacharacters, and it hits an index.
alter table public.rsvp add column if not exists full_name_norm text
  generated always as (lower(btrim(full_name))) stored;
-- nullif so a blank email normalises to NULL rather than ''. The API already
-- writes NULL for an empty field, but two rows that ever did store '' would
-- collide on the unique index below, and "no email" is not a duplicate.
alter table public.rsvp add column if not exists email_norm text
  generated always as (nullif(lower(btrim(email)), '')) stored;

create index if not exists rsvp_full_name_norm_idx on public.rsvp (full_name_norm);

-- The API checks for an existing row and then inserts, which is two steps: two
-- submissions arriving together can both pass the check before either writes.
-- A unique index is the only thing that can settle that atomically. Partial,
-- because email is optional and the rows without one must not collide.
create unique index if not exists rsvp_email_norm_uniq
  on public.rsvp (email_norm)
  where email_norm is not null;

-- ---------------------------------------------------------------------------
-- Size and range constraints
-- ---------------------------------------------------------------------------
-- The API validates all of this too; these are the backstop that holds even if
-- a bug or a future code path skips validation. Added NOT VALID so the
-- migration can't fail on pre-existing rows -- they still apply to every
-- insert and update from here on.
alter table public.rsvp drop constraint if exists rsvp_full_name_len_chk;
alter table public.rsvp add constraint rsvp_full_name_len_chk
  check (char_length(full_name) between 1 and 120) not valid;

alter table public.rsvp drop constraint if exists rsvp_email_len_chk;
alter table public.rsvp add constraint rsvp_email_len_chk
  check (email is null or char_length(email) <= 200) not valid;

alter table public.rsvp drop constraint if exists rsvp_phone_len_chk;
alter table public.rsvp add constraint rsvp_phone_len_chk
  check (phone is null or char_length(phone) <= 40) not valid;

alter table public.rsvp drop constraint if exists rsvp_message_len_chk;
alter table public.rsvp add constraint rsvp_message_len_chk
  check (message is null or char_length(message) <= 2000) not valid;

alter table public.rsvp drop constraint if exists rsvp_guest_count_chk;
alter table public.rsvp add constraint rsvp_guest_count_chk
  check (guest_count between 0 and 20) not valid;

-- ---------------------------------------------------------------------------
-- Hard caps enforced by the database itself
-- ---------------------------------------------------------------------------
-- Even with the API doing its own rate limiting, serverless instances come and
-- go and in-memory counters go with them. These two ceilings live in the
-- database, so they hold no matter how the write arrives.
create or replace function public.rsvp_enforce_caps()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  -- Total rows the table will ever hold. Raise this if the guest list grows.
  max_total_rows  constant integer := 2000;
  -- Submissions allowed from one client fingerprint per rolling 24 hours.
  max_per_ip_day  constant integer := 10;
begin
  if (select count(*) from public.rsvp) >= max_total_rows then
    raise exception 'RSVP capacity reached'
      using errcode = 'check_violation';
  end if;

  if new.ip_hash is not null and (
    select count(*)
    from public.rsvp
    where ip_hash = new.ip_hash
      and created_at > now() - interval '24 hours'
  ) >= max_per_ip_day then
    raise exception 'RSVP rate limit exceeded'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists rsvp_enforce_caps_trg on public.rsvp;
create trigger rsvp_enforce_caps_trg
  before insert on public.rsvp
  for each row execute function public.rsvp_enforce_caps();
