begin;

alter table public.customer_activities
  drop constraint if exists customer_activities_activity_type_check;

alter table public.customer_activities
  add constraint customer_activities_activity_type_check
  check (activity_type in ('just_visit', 'product_added_to_cart', 'checkout', 'cart_snapshot'));

create or replace function public.decrement_variant_inventory(
  p_variant_id uuid,
  p_quantity integer,
  p_reference text default null
)
returns integer
language plpgsql
set search_path = public
as $$
declare
  v_track_inventory boolean;
  v_current_qty integer;
  v_next_qty integer;
begin
  if p_variant_id is null then
    raise exception 'VARIANT_NOT_FOUND' using errcode = 'P0002';
  end if;

  if p_quantity is null or p_quantity <= 0 then
    raise exception 'INVALID_QUANTITY' using errcode = '22023';
  end if;

  select track_inventory, inventory_qty
    into v_track_inventory, v_current_qty
  from public.product_variants
  where id = p_variant_id
  for update;

  if not found then
    raise exception 'VARIANT_NOT_FOUND' using errcode = 'P0002';
  end if;

  if v_track_inventory and v_current_qty < p_quantity then
    raise exception 'OUT_OF_STOCK' using errcode = 'P0001';
  end if;

  if v_track_inventory then
    update public.product_variants
      set inventory_qty = inventory_qty - p_quantity
    where id = p_variant_id
    returning inventory_qty into v_next_qty;
  else
    v_next_qty := v_current_qty;
  end if;

  insert into public.inventory_movements (variant_id, delta, reason, reference)
  values (p_variant_id, -p_quantity, 'purchase', p_reference);

  return v_next_qty;
end;
$$;

revoke all on function public.decrement_variant_inventory(uuid, integer, text) from public;
grant execute on function public.decrement_variant_inventory(uuid, integer, text) to service_role;

create or replace function public.decrement_order_inventory(p_order_id uuid)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_item record;
  v_track_inventory boolean;
  v_current_qty integer;
  v_next_qty integer;
  v_updates jsonb := '[]'::jsonb;
begin
  if p_order_id is null then
    raise exception 'ORDER_NOT_FOUND' using errcode = 'P0002';
  end if;

  if not exists (select 1 from public.orders where id = p_order_id) then
    raise exception 'ORDER_NOT_FOUND' using errcode = 'P0002';
  end if;

  for v_item in
    select variant_id, sum(quantity)::integer as quantity
    from public.order_items
    where order_id = p_order_id
      and variant_id is not null
    group by variant_id
    order by variant_id
  loop
    select track_inventory, inventory_qty
      into v_track_inventory, v_current_qty
    from public.product_variants
    where id = v_item.variant_id
    for update;

    if not found then
      raise exception 'VARIANT_NOT_FOUND' using errcode = 'P0002';
    end if;

    if v_item.quantity <= 0 then
      raise exception 'INVALID_QUANTITY' using errcode = '22023';
    end if;

    if v_track_inventory and v_current_qty < v_item.quantity then
      raise exception 'OUT_OF_STOCK' using errcode = 'P0001';
    end if;

    if v_track_inventory then
      update public.product_variants
        set inventory_qty = inventory_qty - v_item.quantity
      where id = v_item.variant_id
      returning inventory_qty into v_next_qty;
    else
      v_next_qty := v_current_qty;
    end if;

    insert into public.inventory_movements (variant_id, delta, reason, reference)
    values (v_item.variant_id, -v_item.quantity, 'purchase', p_order_id::text);

    v_updates := v_updates || jsonb_build_array(jsonb_build_object(
      'variantId', v_item.variant_id,
      'inventoryQty', v_next_qty
    ));
  end loop;

  return v_updates;
end;
$$;

revoke all on function public.decrement_order_inventory(uuid) from public;
grant execute on function public.decrement_order_inventory(uuid) to service_role;

do $$
begin
  if to_regclass('public.customer_activities') is not null then
    begin
      alter publication supabase_realtime add table public.customer_activities;
    exception
      when duplicate_object then null;
      when undefined_object then null;
    end;
    alter table public.customer_activities replica identity full;
  end if;

  if to_regclass('public.product_variants') is not null then
    begin
      alter publication supabase_realtime add table public.product_variants;
    exception
      when duplicate_object then null;
      when undefined_object then null;
    end;
    alter table public.product_variants replica identity full;
  end if;

  if to_regclass('public.inventory_movements') is not null then
    begin
      alter publication supabase_realtime add table public.inventory_movements;
    exception
      when duplicate_object then null;
      when undefined_object then null;
    end;
    alter table public.inventory_movements replica identity full;
  end if;
end $$;

commit;
