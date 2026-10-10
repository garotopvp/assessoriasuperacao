ALTER TABLE financial_expenses ADD COLUMN receipt_url TEXT;

INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Give public access to receipts 1o2m3n" ON storage.objects FOR SELECT USING (bucket_id = 'receipts');
CREATE POLICY "Allow authenticated uploads to receipts 1o2m3n" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'receipts' AND auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated updates to receipts 1o2m3n" ON storage.objects FOR UPDATE USING (bucket_id = 'receipts' AND auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated deletes to receipts 1o2m3n" ON storage.objects FOR DELETE USING (bucket_id = 'receipts' AND auth.role() = 'authenticated');
