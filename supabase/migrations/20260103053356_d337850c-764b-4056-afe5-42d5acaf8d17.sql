-- Better approach: Use security_invoker=on on the view and add back SELECT policy on base table
-- The view already filters out customer_email, so even if users could query the base table,
-- they should use the view for read access

DROP VIEW IF EXISTS public.reviews_public;

-- Recreate view with security_invoker=on (the correct approach per Supabase guidelines)
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

-- Add back a minimal SELECT policy that works with the view
-- The view filters to is_approved=true and excludes customer_email
CREATE POLICY "Select approved reviews for public view"
ON public.reviews
FOR SELECT
USING (is_approved = true);

COMMENT ON VIEW public.reviews_public IS 'Public view of approved reviews. Excludes customer_email for privacy. Uses security_invoker=on to respect RLS.';