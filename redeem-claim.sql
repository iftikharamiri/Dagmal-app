create or replace function public.redeem_claim(claim_id uuid)
returns setof public.claims
language plpgsql
security definer
as $$
begin
  return query
  update public.claims c
  set status = 'completed', redeemed_at = now()
  where c.id = claim_id
    and c.redeemed_at is null
  returning c.*;
end;
$$;
