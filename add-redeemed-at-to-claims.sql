alter table if exists public.claims
  add column if not exists redeemed_at timestamp with time zone;

create index if not exists idx_claims_redeemed_at on public.claims (redeemed_at);
