CREATE TABLE public.coupons (

  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,

  code text NOT NULL,

  discount_type text NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage','fixed')),

  discount_value numeric NOT NULL CHECK (discount_value > 0),

  is_active boolean NOT NULL DEFAULT true,

  usage_limit integer,

  times_used integer NOT NULL DEFAULT 0,

  created_at timestamptz NOT NULL DEFAULT now()

);



CREATE UNIQUE INDEX coupons_code_lower_key ON public.coupons (lower(code));



GRANT SELECT ON public.coupons TO anon, authenticated;

GRANT ALL ON public.coupons TO service_role;



ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;



CREATE POLICY "Anyone can read active coupons"

ON public.coupons FOR SELECT TO anon, authenticated

USING (is_active = true);



ALTER TABLE public.subscriptions

  ADD COLUMN coupon_code text,

  ADD COLUMN discount_amount numeric NOT NULL DEFAULT 0;



INSERT INTO public.coupons (code, discount_type, discount_value, is_active, usage_limit) VALUES

  ('WELCOME10', 'percentage', 10, true, NULL),

  ('TAIF50', 'fixed', 50, true, 100);

