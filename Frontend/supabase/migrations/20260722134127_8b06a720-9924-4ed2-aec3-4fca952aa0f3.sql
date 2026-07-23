
CREATE TABLE public.players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.players TO authenticated;
GRANT ALL ON public.players TO service_role;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read players" ON public.players FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert players" ON public.players FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update players" ON public.players FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth delete players" ON public.players FOR DELETE TO authenticated USING (true);

CREATE TABLE public.peladas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT (now()::date),
  location text NOT NULL DEFAULT 'Hawai Sport Goiânia',
  status text NOT NULL DEFAULT 'active', -- 'active' | 'finished'
  arrival_order jsonb NOT NULL DEFAULT '[]'::jsonb, -- array of {player_id, active}
  created_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.peladas TO authenticated;
GRANT ALL ON public.peladas TO service_role;
ALTER TABLE public.peladas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read peladas" ON public.peladas FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert peladas" ON public.peladas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update peladas" ON public.peladas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth delete peladas" ON public.peladas FOR DELETE TO authenticated USING (true);

CREATE TABLE public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pelada_id uuid NOT NULL REFERENCES public.peladas(id) ON DELETE CASCADE,
  match_number int NOT NULL,
  yellow_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  blue_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  winner text, -- 'yellow' | 'blue' | 'draw' | null (in progress)
  score_yellow int NOT NULL DEFAULT 0,
  score_blue int NOT NULL DEFAULT 0,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
CREATE INDEX matches_pelada_idx ON public.matches(pelada_id, match_number);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.matches TO authenticated;
GRANT ALL ON public.matches TO service_role;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read matches" ON public.matches FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert matches" ON public.matches FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update matches" ON public.matches FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth delete matches" ON public.matches FOR DELETE TO authenticated USING (true);
