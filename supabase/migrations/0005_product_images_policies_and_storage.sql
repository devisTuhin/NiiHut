-- Add missing RLS policies for product_images table
-- (RLS is already enabled but no policies exist)

-- Public read
CREATE POLICY "Public read product images" ON product_images
  FOR SELECT
  TO public
  USING (true);

-- Admin manage (insert/update/delete)
CREATE POLICY "Admin manage product images" ON product_images
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public read product images storage" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'product-images');

CREATE POLICY "Admin upload product images" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Admin delete product images" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images');
