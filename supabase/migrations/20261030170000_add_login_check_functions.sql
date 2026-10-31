-- Step 1 of 2: narrow login functions (safe to apply at any time).
--
-- The login page used to read and update the participants table directly with
-- the public key that ships in the browser. These two functions do only what
-- login needs, so the open table policies can be dropped in step 2.
--
-- Apply this BEFORE deploying the code that calls these functions.

-- Answers "may this email sign in?" with a single word and nothing else:
-- 'allowed', 'needs_terms', 'revoked', 'expired' or 'not_found'.
-- Matching ignores case and stray spaces (some participants were saved with
-- capital letters and were being turned away).
create or replace function public.check_participant_login(p_email text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select case
               when p.status = 'revoked' then 'revoked'
               when p.expires_at < now() then 'expired'
               when p.accepted_terms_at is null then 'needs_terms'
               else 'allowed'
             end
        from public.participants p
       where lower(trim(p.email)) = lower(trim(p_email))
       limit 1
    ),
    'not_found'
  );
$$;

revoke all on function public.check_participant_login(text) from public, anon, authenticated;
grant execute on function public.check_participant_login(text) to anon, authenticated;

-- Records that the signed-in participant accepted the fair use terms.
-- Only works for a signed-in user and only for their own record (the email in
-- their login), so nobody can mark terms as accepted on someone else's behalf.
-- Keeps the first acceptance date if called again.
create or replace function public.accept_my_terms()
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_email text := lower(trim(coalesce(auth.jwt() ->> 'email', '')));
  v_count integer;
begin
  if v_email = '' then
    return false;
  end if;

  update public.participants p
     set accepted_terms_at = coalesce(p.accepted_terms_at, now())
   where lower(trim(p.email)) = v_email;

  get diagnostics v_count = row_count;
  return v_count > 0;
end;
$$;

revoke all on function public.accept_my_terms() from public, anon, authenticated;
grant execute on function public.accept_my_terms() to authenticated;
