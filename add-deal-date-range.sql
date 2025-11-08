ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS start_date date DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS end_date date;

UPDATE public.deals
SET start_date = COALESCE(start_date, CURRENT_DATE)
WHERE start_date IS NULL;

CREATE INDEX IF NOT EXISTS deals_active_date_range_idx
  ON public.deals (is_active, start_date, end_date);
