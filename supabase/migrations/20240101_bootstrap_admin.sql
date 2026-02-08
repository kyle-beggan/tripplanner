-- update the most recently created user to be an admin and approved
-- RUN THIS to unlock your own account
update profiles
set 
  role = 'admin',
  status = 'approved'
where id in (
  select id from profiles order by created_at desc limit 1
);
