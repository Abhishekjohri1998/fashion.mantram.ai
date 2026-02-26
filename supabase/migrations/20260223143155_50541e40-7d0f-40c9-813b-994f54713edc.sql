
-- Store generated customization assets (customized images, lifestyle images, mood boards, customized tech drawings)
CREATE TABLE public.customization_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  asset_type TEXT NOT NULL, -- 'customized_image', 'lifestyle_image', 'mood_board', 'customized_drawing'
  url TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.customization_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own customization assets"
  ON public.customization_assets
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_customization_assets_project ON public.customization_assets(project_id);
