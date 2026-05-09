-- Drop and recreate the reviews_public view with SECURITY INVOKER explicitly set
-- This ensures RLS policies apply to the querying user, not the view creator

DROP VIEW IF EXISTS public.reviews_public;

CREATE VIEW public.reviews_public
    WITH (security_invoker=on)
    AS
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
COMMENT ON VIEW public.reviews_public IS 'Public view of approved reviews without customer_email for privacy. Uses SECURITY INVOKER to respect RLS policies.';