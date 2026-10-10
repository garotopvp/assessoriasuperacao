-- Add Quality Management fields to support_sessions
ALTER TABLE public.support_sessions
ADD COLUMN IF NOT EXISTS sentiment_score float4, -- -1.0 to 1.0
ADD COLUMN IF NOT EXISTS sentiment_label text, -- POSITIVE, NEUTRAL, NEGATIVE
ADD COLUMN IF NOT EXISTS summary text, -- Auto-generated summary of the issue
ADD COLUMN IF NOT EXISTS tags text[]; -- Auto-generated tags (e.g. ['FINANCEIRO', 'URGENTE'])

-- Create index for sentiment analysis
CREATE INDEX IF NOT EXISTS idx_support_sessions_sentiment ON public.support_sessions(sentiment_label);
