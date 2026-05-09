-- Add length constraints to reviews table for data validation
ALTER TABLE public.reviews
ADD CONSTRAINT customer_name_length CHECK (length(customer_name) <= 100),
ADD CONSTRAINT title_length CHECK (title IS NULL OR length(title) <= 150),
ADD CONSTRAINT content_length CHECK (length(content) <= 2000);

-- Update INSERT policy to validate required fields with proper lengths
DROP POLICY IF EXISTS "Anyone can submit reviews" ON public.reviews;

CREATE POLICY "Anyone can submit valid reviews"
ON public.reviews
FOR INSERT
WITH CHECK (
  -- Validate required fields are present and reasonable
  product_id IS NOT NULL AND length(product_id) > 0 AND
  product_handle IS NOT NULL AND length(product_handle) > 0 AND
  customer_name IS NOT NULL AND length(customer_name) BETWEEN 1 AND 100 AND
  rating BETWEEN 1 AND 5 AND
  content IS NOT NULL AND length(content) BETWEEN 1 AND 2000 AND
  (title IS NULL OR length(title) <= 150)
);