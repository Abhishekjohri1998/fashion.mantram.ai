
CREATE TABLE public.body_measurement_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  category text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  measurements jsonb DEFAULT '{}'::jsonb,
  image_url text,
  height_cm numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.body_measurement_sessions ENABLE ROW LEVEL SECURITY;

-- Authenticated users can manage their own sessions
CREATE POLICY "Users can manage own sessions"
  ON public.body_measurement_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Anyone can read a session by id (for mobile page)
CREATE POLICY "Anyone can read session by id"
  ON public.body_measurement_sessions FOR SELECT
  USING (true);

-- Anyone can update a session (for mobile page to post results)
CREATE POLICY "Anyone can update session by id"
  ON public.body_measurement_sessions FOR UPDATE
  USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.body_measurement_sessions;
