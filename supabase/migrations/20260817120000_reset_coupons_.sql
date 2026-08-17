-- Reset the coupon catalogue.
--
-- Removes every previously seeded coupon (WELCOME10, TAIF50, and anything else
-- added by hand) and replaces them with the current five codes.
--
-- subscriptions.coupon_code is plain text (no foreign key), so deleting rows here
-- does not affect historical orders — they keep the code they were placed with.

DELETE FROM public.coupons;

-- Matching is case-insensitive (see coupons_code_lower_key and validateCoupon),
-- so the casing below is only what gets echoed back to the customer in the UI.
INSERT INTO public.coupons (code, discount_type, discount_value, is_active, usage_limit) VALUES
  ('Ka5',      'percentage',   5, true, NULL),
  ('Meals5',   'percentage',   5, true, NULL),
  ('Meals10',  'percentage',  10, true, NULL),
  ('Meals50',  'fixed',       50, true, NULL),
  ('Meals100', 'fixed',      100, true, NULL);
