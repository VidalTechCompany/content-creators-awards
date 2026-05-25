-- Allow admins to read raw votes for moderation and exports.
create policy "admins_votes_select" on public.votes
  for select to authenticated using (
    exists (select 1 from public.admins a where a.user_id = auth.uid())
  );
