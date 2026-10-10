-- Create feedbacks table
CREATE TABLE IF NOT EXISTS feedbacks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can insert their own feedback" ON feedbacks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own feedback" ON feedbacks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedbacks" ON feedbacks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid() 
      AND profiles.is_admin = true
    )
    OR
    (auth.jwt() ->> 'email') = 'boracorrerclub@gmail.com'
  );

-- Grant permissions
GRANT ALL ON feedbacks TO authenticated;
GRANT SELECT ON feedbacks TO anon;
GRANT ALL ON feedbacks TO service_role;
