ALTER TABLE public.subscriptions
  ADD COLUMN height_cm numeric,
  ADD COLUMN weight_kg numeric,
  ADD COLUMN birth_date date;