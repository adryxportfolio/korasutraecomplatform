-- Create a secure view that excludes customer_email for public access
CREATE OR REPLACE VIEW public.reviews_public AS
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

-- Grant access to the view
GRANT SELECT ON public.reviews_public TO anon, authenticated;

-- Drop the old permissive SELECT policy that exposes all columns
DROP POLICY IF EXISTS "Reviews are publicly readable " ON public.reviews;

-- Create a more restrictive policy - only allow SELECT through authenticated users who need it
-- Public reads should go through the view
CREATE POLICY "Authenticated users can read approved reviews"
ON public.reviews
FOR SELECT
TO authenticated
USING (is_approved = true);

-- Add comment for documentation
COMMENT ON VIEW public.reviews_public IS 'Public-facing view of reviews that excludes sensitive customer email data';