-- ============================================================
-- Migration: 016 — Pesquisa de satisfação pós-evento
-- Convenção: todas as tabelas usam sufixo _encontro
--
-- Migration ADITIVA: cria uma tabela nova, não altera nenhuma
-- tabela existente. Nenhum dado atual é tocado.
--
-- ROLLBACK:
--   DROP TABLE IF EXISTS public.survey_responses_encontro;
-- ============================================================

CREATE TABLE IF NOT EXISTS public.survey_responses_encontro (
  id                 uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at         timestamptz NOT NULL DEFAULT now(),

  -- Versão do questionário — permite comparar edições sem quebrar histórico
  survey_version     text NOT NULL DEFAULT '2026.1',

  -- Q1 — Avaliação geral da imersão (1–5)
  overall_rating     smallint NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),

  -- Q2 — Aspectos da imersão (1–5 cada)
  asp_organizacao    smallint NOT NULL CHECK (asp_organizacao BETWEEN 1 AND 5),
  asp_credenciamento smallint NOT NULL CHECK (asp_credenciamento BETWEEN 1 AND 5),
  asp_local          smallint NOT NULL CHECK (asp_local BETWEEN 1 AND 5),
  asp_alimentacao    smallint NOT NULL CHECK (asp_alimentacao BETWEEN 1 AND 5),
  asp_programacao    smallint NOT NULL CHECK (asp_programacao BETWEEN 1 AND 5),
  asp_pontualidade   smallint NOT NULL CHECK (asp_pontualidade BETWEEN 1 AND 5),
  asp_experiencia    smallint NOT NULL CHECK (asp_experiencia BETWEEN 1 AND 5),
  asp_comunicacao    smallint NOT NULL CHECK (asp_comunicacao BETWEEN 1 AND 5),
  asp_networking     smallint NOT NULL CHECK (asp_networking BETWEEN 1 AND 5),
  asp_equipe         smallint NOT NULL CHECK (asp_equipe BETWEEN 1 AND 5),

  -- Q3 — Relevância do conteúdo para a atuação profissional
  content_relevance  text NOT NULL CHECK (content_relevance IN (
                       'muito_relevante', 'relevante', 'razoavelmente_relevante',
                       'pouco_relevante', 'nada_relevante')),

  -- Q4 — Palestra de Jaeder Barreto (1–5 cada)
  spk_qualidade      smallint NOT NULL CHECK (spk_qualidade BETWEEN 1 AND 5),
  spk_relevancia     smallint NOT NULL CHECK (spk_relevancia BETWEEN 1 AND 5),
  spk_aplicabilidade smallint NOT NULL CHECK (spk_aplicabilidade BETWEEN 1 AND 5),
  spk_didatica       smallint NOT NULL CHECK (spk_didatica BETWEEN 1 AND 5),
  spk_dominio        smallint NOT NULL CHECK (spk_dominio BETWEEN 1 AND 5),
  spk_inspiracao     smallint NOT NULL CHECK (spk_inspiracao BETWEEN 1 AND 5),
  spk_experiencia    smallint NOT NULL CHECK (spk_experiencia BETWEEN 1 AND 5),

  -- Q5 — Gostaria de ver o palestrante novamente
  speaker_return     text NOT NULL CHECK (speaker_return IN (
                       'sim_com_certeza', 'sim_outros_formatos', 'talvez', 'nao')),

  -- Q8 — Grande diferencial desta edição (uma das áreas avaliadas na Q2/Q4)
  highlight          text NOT NULL CHECK (highlight IN (
                       'organizacao', 'credenciamento', 'local', 'alimentacao',
                       'programacao', 'pontualidade', 'experiencia', 'comunicacao',
                       'networking', 'equipe', 'palestra')),

  -- Q10 — NPS (0–10)
  nps                smallint NOT NULL CHECK (nps BETWEEN 0 AND 10),

  -- Respostas abertas (opcionais)
  wanted_speakers    text,   -- Q6
  wanted_topics      text,   -- Q7
  improvement        text,   -- Q9
  one_word           text    -- Q11
);

COMMENT ON TABLE public.survey_responses_encontro IS
  'Respostas da pesquisa de satisfação pós-evento (rota /pesquisa). Uma linha por participante.';

CREATE INDEX IF NOT EXISTS idx_survey_responses_encontro_created_at
  ON public.survey_responses_encontro (created_at DESC);

-- ------------------------------------------------------------
-- RLS
-- Insert público (participante responde sem login, igual tracking_events)
-- Select apenas para usuários do painel
-- ------------------------------------------------------------
ALTER TABLE public.survey_responses_encontro ENABLE ROW LEVEL SECURITY;

CREATE POLICY "survey_responses_encontro_insert_public" ON public.survey_responses_encontro
  FOR INSERT WITH CHECK (true);

CREATE POLICY "survey_responses_encontro_select_admin" ON public.survey_responses_encontro
  FOR SELECT USING (public.is_admin());
