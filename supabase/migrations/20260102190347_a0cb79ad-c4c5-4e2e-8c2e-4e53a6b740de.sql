-- Drop the security definer view and recreate as a regular view
DROP VIEW IF EXISTS public.reviews_public;

-- Create a simple view (not security definer) that excludes customer_email
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
  helpful_count,
  created_at,
  updated_at,
  is_approved
FROM public.reviews
WHERE is_approved = true;

-- Revoke direct table access from anon role to force use of view
REVOKE SELECT ON public.reviews FROM anon;

-- Grant SELECT on the safe view to anon
GRANT SELECT ON public.reviews_public TO anon, authenticated;