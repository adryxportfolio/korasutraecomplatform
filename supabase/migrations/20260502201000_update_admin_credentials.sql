alter table public.admin_users add column if not exists email text;

delete from public.admin_sessions
where admin_id in (
  select id from public.admin_users
  where username = 'korasutra_admin'
);

delete from public.user_roles
where admin_id in (
  select id from public.admin_users
  where username = 'korasutra_admin'
);

delete from public.admin_users
where username = 'korasutra_admin';

insert into public.admin_users (username, email, password_hash)
values (
  'korasutra.official@gmail.com',
  'korasutra.official@gmail.com',
  '9d3bfeceeeab8f06130d094b83f2bd5f574dc495ab1c6927ad5f77ed8d0d3061'
)
on conflict (username) do update
set email = excluded.email,
    password_hash = excluded.password_hash;
