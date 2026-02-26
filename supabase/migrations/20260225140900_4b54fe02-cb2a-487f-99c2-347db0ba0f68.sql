
-- Create shared_decks table for interactive design decks
CREATE TABLE public.shared_decks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  title TEXT NOT NULL DEFAULT 'Design Deck',
  deck_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  theme JSONB NOT NULL DEFAULT '{"primary": "#1a1a2e", "accent": "#e94560", "background": "#0f0f23", "text": "#ffffff", "muted": "#a0a0b0"}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shared_decks ENABLE ROW LEVEL SECURITY;

-- Owner can CRUD
CREATE POLICY "Users can manage own decks"
ON public.shared_decks
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Anyone can view by token (public sharing)
CREATE POLICY "Anyone can view shared decks by token"
ON public.shared_decks
FOR SELECT
USING (true);
