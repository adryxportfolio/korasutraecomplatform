-- Drop and recreate the reviews_public view without SECURITY DEFINER
-- This makes it use SECURITY INVOKER (default) so RLS policies apply to the querying user

DROP VIEW IF EXISTS public.reviews_public;

CREATE VIEW public.reviews_public AS
SELECT 
  id,
  product_id,
  product_handle,
  customer_name,
  rating,
  title,
  content,
  is_verified_purchase,
  is_approved,
  helpful_count,
  created_at,
  updated_at
FROM public.reviews
WHERE is_approved = true;

-- Add comment explaining the view purpose
COMMENT ON VIEW public.reviews_public IS 'Public view of approved reviews without customer_email for privacy';