-- Drop the permissive SELECT policy on the base reviews table
DROP POLICY IF EXISTS "Select approved reviews for public view" ON public.reviews;

-- Create a database function that returns reviews without the email column
-- This is the secure way to provide read access without exposing customer_email
CREATE OR REPLACE FUNCTION public.get_approved_reviews(p_product_handle TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  product_id TEXT,
  product_handle TEXT,
  customer_name TEXT,
  rating INTEGER,
  title TEXT,
  content TEXT,
  is_verified_purchase BOOLEAN,
  is_approved BOOLEAN,
  helpful_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.product_id,
    r.product_handle,
    r.customer_name,
    r.rating,
    r.title,
    r.content,
    r.is_verified_purchase,
    r.is_approved,
    r.helpful_count,
    r.created_at,
    r.updated_at
  FROM public.reviews r
  WHERE r.is_approved = true
    AND (p_product_handle IS NULL OR r.product_handle = p_product_handle)
  ORDER BY r.created_at DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_approved_reviews TO anon, authenticated;

-- Drop the view since we'll use the function instead
DROP VIEW IF EXISTS public.reviews_public;

-- Also add a function to increment helpful count securely
CREATE OR REPLACE FUNCTION public.increment_review_helpful(p_review_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.reviews
  SET helpful_count = helpful_count + 1
  WHERE id = p_review_id AND is_approved = true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_review_helpful TO anon, authenticated;