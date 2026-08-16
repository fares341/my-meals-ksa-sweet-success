-- 1. إنشاء جدول الكوبونات
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

-- 2. إنشاء فهرس الفرادة مع تحويل الكود للحروف الصغيرة
CREATE UNIQUE INDEX coupons_code_lower_key ON public.coupons (lower(code));

-- 3. صلاحيات الوصول
GRANT SELECT ON public.coupons TO anon, authenticated;
GRANT ALL ON public.coupons TO service_role;

-- 4. إعدادات سياسة الأمان (RLS)
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- تسمح للجميع بالبحث عن الكوبونات للتحقق من وجودها وحالتها
CREATE POLICY "Anyone can read coupons"
ON public.coupons FOR SELECT TO anon, authenticated
USING (true);

-- 5. إضافة الأعمدة لجدول الاشتراكات
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS coupon_code text,
  ADD COLUMN IF NOT EXISTS discount_amount numeric NOT NULL DEFAULT 0;

-- 6. إضافة الكوبونات بالحروف الصغيرة لضمان تطابق البحث دائماً
INSERT INTO public.coupons (code, discount_type, discount_value, is_active, usage_limit) VALUES
  ('ka5', 'percentage', 5, true, NULL),
  ('meals5', 'percentage', 5, true, NULL),
  ('meals10', 'percentage', 10, true, NULL),
  ('meals50', 'fixed', 50, true, NULL),
  ('meals100', 'fixed', 100, true, NULL);
