begin;

delete from public.admin_sessions
where admin_id in (select id from public.admin_users where username = 'korasutra_admin');

delete from public.user_roles
where admin_id in (select id from public.admin_users where username = 'korasutra_admin');

delete from public.admin_users where username = 'korasutra_admin';

update public.admin_users
set email = 'korasutra.official@gmail.com'
where username = 'korasutra.official@gmail.com';

update public.product_variants v
set inventory_qty = 1
from public.products p
where p.id = v.product_id
  and p.status = 'active'
  and v.track_inventory = true
  and v.inventory_qty <= 0;

with classified as (
  select
    id,
    coalesce(tags, '{}'::text[]) as existing_tags,
    lower(coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(fabric,'') || ' ' || coalesce(technique,'') || ' ' || coalesce(color,'')) as txt
  from public.products
), tag_rows as (
  select id, unnest(existing_tags) as tag from classified
  union all select id, 'fabric:tussar' from classified where txt like '%tussar%'
  union all select id, 'fabric:matka' from classified where txt like '%matka%'
  union all select id, 'fabric:muslin' from classified where txt like '%muslin%'
  union all select id, 'fabric:katan-silk' from classified where txt like '%katan%'
  union all select id, 'fabric:linen' from classified where txt like '%linen%'
  union all select id, 'fabric:cotton' from classified where txt like '%cotton%'
  union all select id, 'fabric:silk' from classified where txt like '%silk%'
  union all select id, 'pattern:jamdani' from classified where txt like '%jamdani%'
  union all select id, 'pattern:kantha-stitch' from classified where txt like '%kantha%'
  union all select id, 'pattern:baluchari' from classified where txt like '%baluchari%'
  union all select id, 'pattern:hand-paint' from classified where txt like '%hand paint%' or txt like '%hand-painted%' or txt like '%painted%'
  union all select id, 'pattern:block-print' from classified where txt like '%block print%'
  union all select id, 'pattern:batik' from classified where txt like '%batik%'
  union all select id, 'pattern:digital-print' from classified where txt like '%digital%'
  union all select id, 'pattern:paithani' from classified where txt like '%paithani%'
  union all select id, 'occasion:party-wear' from classified where txt like '%party%'
  union all select id, 'occasion:office-wear' from classified where txt like '%office%'
  union all select id, 'occasion:casual' from classified where txt like '%casual%'
  union all select id, 'occasion:traditional' from classified
), clean_tags as (
  select id, array_agg(distinct tag order by tag) filter (where tag is not null and tag <> '') as tags
  from tag_rows
  group by id
)
update public.products p
set tags = coalesce(clean_tags.tags, '{}'::text[])
from clean_tags
where clean_tags.id = p.id;

commit;
