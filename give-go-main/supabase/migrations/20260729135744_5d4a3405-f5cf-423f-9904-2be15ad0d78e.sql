-- Storage policies for the private donation-images bucket
create policy "Users manage own donation images"
on storage.objects for all to authenticated
using (
  bucket_id = 'donation-images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'donation-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Volunteers and admins read donation images"
on storage.objects for select to authenticated
using (
  bucket_id = 'donation-images'
  and (public.has_role(auth.uid(), 'volunteer') or public.has_role(auth.uid(), 'admin'))
);
