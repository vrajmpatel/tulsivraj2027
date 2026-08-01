-- Track whether each invitee household has actually been sent its invitation,
-- and by which route.
--
-- Three states rather than a boolean: "how it went out" is what decides how to
-- chase a non-response. A physical card that may still be in the post is a
-- different conversation from a WhatsApp message that was delivered and read.

alter table public.invitee
  add column if not exists invitation_sent text not null default 'not_yet';

-- The API validates this too; the constraint is the backstop that holds even if
-- a future code path skips validation. Existing rows all take the default, so
-- this can be added validated rather than NOT VALID.
alter table public.invitee drop constraint if exists invitee_invitation_sent_chk;
alter table public.invitee add constraint invitee_invitation_sent_chk
  check (invitation_sent in ('not_yet', 'physical', 'digital'));

-- Supports the "who still hasn't been invited?" filter, which is the whole
-- point of the column once the send actually starts.
create index if not exists invitee_invitation_sent_idx
  on public.invitee (invitation_sent);

-- The public keys were revoked from this table in 20260726143000_harden_rsvp;
-- restated here so a new column never widens that surface by accident.
revoke all on public.invitee from anon, authenticated;
