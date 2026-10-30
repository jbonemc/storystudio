-- Step 2 of 2: close the open policies.
--
-- Apply this AFTER the code that uses check_participant_login and
-- accept_my_terms is live. Before this, anyone holding the public key (it ships
-- in the browser) could list every participant's email, name, cohort and
-- expiry, change their records, add themselves as a participant, and read the
-- login log with emails and IP addresses.

-- participants: no more open read, update or insert.
drop policy if exists "Allow email check for login" on public.participants;
drop policy if exists "Allow terms acceptance" on public.participants;
drop policy if exists "Allow participant insert" on public.participants;

-- Signed-in participants may still read their own record, and only their own.
drop policy if exists "Participants can read own record" on public.participants;
create policy "Participants can read own record" on public.participants
  for select to authenticated
  using (lower(trim(email)) = lower(auth.jwt() ->> 'email'));

-- auth_logs: the server may still write log lines, but nobody can read them
-- with the public key. Jonathan reads them in the Supabase dashboard.
drop policy if exists "Allow select from anon" on public.auth_logs;
