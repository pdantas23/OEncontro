/**
 * src/config/survey.ts
 *
 * FONTE ÚNICA DE VERDADE DA PESQUISA DE SATISFAÇÃO.
 *
 * Perguntas, opções, etapas e rótulos ficam aqui. O wizard, a tela de
 * revisão, o schema Zod e o insert no Supabase derivam deste arquivo —
 * mudar um rótulo aqui muda em todos os lugares.
 *
 * Linguagem: os enunciados originais foram reescritos em português simples.
 * O termo técnico original de cada item fica registrado no comentário ao lado
 * para preservar a rastreabilidade com o questionário aprovado.
 */

export const SURVEY_VERSION = '2026.1'

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface RatingItem {
  /** Sufixo da coluna no banco (asp_* / spk_*) */
  key: string
  label: string
  /** Explicação curta exibida abaixo do rótulo — usada onde o termo original era técnico */
  hint?: string
}

export interface ChoiceOption<T extends string | number = string> {
  value: T
  label: string
  description?: string
}

// ---------------------------------------------------------------------------
// Escala 1–5 — rótulos usados em todas as avaliações
// ---------------------------------------------------------------------------

export const SCALE_OPTIONS: ChoiceOption<number>[] = [
  { value: 1, label: 'Muito ruim' },
  { value: 2, label: 'Ruim' },
  { value: 3, label: 'Regular' },
  { value: 4, label: 'Muito bom' },
  { value: 5, label: 'Excelente' },
]

export function scaleLabel(value: number): string {
  return SCALE_OPTIONS.find((o) => o.value === value)?.label ?? '—'
}

// ---------------------------------------------------------------------------
// Q1 — Avaliação geral
// ---------------------------------------------------------------------------

// Ordem crescente — é assim que as estrelas são desenhadas na tela
export const OVERALL_OPTIONS: ChoiceOption<number>[] = [
  { value: 1, label: 'Ruim' },
  { value: 2, label: 'Regular' },
  { value: 3, label: 'Boa' },
  { value: 4, label: 'Muito boa' },
  { value: 5, label: 'Excelente' },
]

export function overallLabel(value: number): string {
  return OVERALL_OPTIONS.find((o) => o.value === value)?.label ?? '—'
}

// ---------------------------------------------------------------------------
// Q2 — Aspectos da imersão
// ---------------------------------------------------------------------------

export const EVENT_ASPECTS: RatingItem[] = [
  // original: "Organização e planejamento"
  { key: 'organizacao', label: 'Organização do evento', hint: 'Estava tudo no lugar e funcionando?' },
  // original: "Credenciamento e receptividade"
  { key: 'credenciamento', label: 'A chegada e a recepção', hint: 'Retirar o crachá, ser recebido e encontrar seu lugar' },
  // original: "Estrutura e conforto do local"
  { key: 'local', label: 'O local', hint: 'Espaço, cadeiras, som, ar-condicionado, banheiros' },
  // original: "Alimentação"
  { key: 'alimentacao', label: 'A comida e a bebida', hint: 'Coffee break, almoço, água' },
  // original: "Programação"
  { key: 'programacao', label: 'A programação', hint: 'A agenda do evento: o que aconteceu e em que ordem' },
  // original: "Pontualidade e cumprimento dos horários"
  { key: 'pontualidade', label: 'Os horários', hint: 'Começou e terminou na hora combinada?' },
  // original: "Experiência proporcionada"
  { key: 'experiencia', label: 'A experiência como um todo', hint: 'O clima, a energia, como você se sentiu no evento' },
  // original: "Comunicação antes e durante o evento"
  { key: 'comunicacao', label: 'As informações que você recebeu', hint: 'Avisos, e-mails e mensagens antes e durante o evento' },
  // original: "Networking e oportunidades de conexão"
  { key: 'networking', label: 'As conexões com outros profissionais', hint: 'Conhecer gente nova e trocar contatos' },
  // original: "Atendimento da equipe O ENCONTRO"
  { key: 'equipe', label: 'O atendimento da equipe', hint: 'Como a equipe do O ENCONTRO te tratou' },
]

// ---------------------------------------------------------------------------
// Q3 — Relevância do conteúdo
// ---------------------------------------------------------------------------

export const RELEVANCE_OPTIONS: ChoiceOption[] = [
  { value: 'muito_relevante', label: 'Muito útil', description: 'Vou usar bastante coisa no meu trabalho' },
  { value: 'relevante', label: 'Útil', description: 'Levei boas ideias' },
  { value: 'razoavelmente_relevante', label: 'Mais ou menos', description: 'Algumas partes serviram' },
  { value: 'pouco_relevante', label: 'Pouco útil', description: 'Quase nada se aplica ao que eu faço' },
  { value: 'nada_relevante', label: 'Não foi útil', description: 'Não vou usar no meu trabalho' },
]

// ---------------------------------------------------------------------------
// Q4 — Palestra de Jaeder Barreto
// ---------------------------------------------------------------------------

export const SPEAKER_NAME = 'Jaeder Barreto'

export const SPEAKER_ASPECTS: RatingItem[] = [
  // original: "Qualidade do conteúdo"
  { key: 'qualidade', label: 'A qualidade do que foi falado' },
  // original: "Relevância para o mercado de eventos"
  { key: 'relevancia', label: 'Tem a ver com o mercado de eventos', hint: 'O assunto conversa com o seu dia a dia na área' },
  // original: "Aplicabilidade prática"
  { key: 'aplicabilidade', label: 'Dá para colocar em prática', hint: 'Você consegue aplicar no seu trabalho' },
  // original: "Didática e comunicação"
  { key: 'didatica', label: 'A clareza ao explicar', hint: 'Foi fácil de entender e acompanhar' },
  // original: "Conhecimento e domínio do tema"
  { key: 'dominio', label: 'O domínio do assunto', hint: 'Ele mostrou conhecer bem o tema' },
  // original: "Capacidade de inspirar e provocar reflexões"
  { key: 'inspiracao', label: 'Inspirou e fez você repensar coisas' },
  // original: "Experiência proporcionada durante a palestra"
  { key: 'experiencia', label: 'A experiência durante a palestra' },
]

// ---------------------------------------------------------------------------
// Q5 — Voltar em outras edições
// ---------------------------------------------------------------------------

export const SPEAKER_RETURN_OPTIONS: ChoiceOption[] = [
  { value: 'sim_com_certeza', label: 'Sim, com certeza!' },
  { value: 'sim_outros_formatos', label: 'Sim, mas em outro formato', description: 'Por exemplo: workshop, bate-papo, mesa redonda' },
  { value: 'talvez', label: 'Talvez' },
  { value: 'nao', label: 'Não' },
]

// ---------------------------------------------------------------------------
// Q8 — Grande diferencial desta edição
// Opções derivadas das próprias áreas avaliadas nas questões 2 e 4.
// ---------------------------------------------------------------------------

export const HIGHLIGHT_OPTIONS: ChoiceOption[] = [
  { value: 'experiencia', label: 'A experiência como um todo' },
  { value: 'palestra', label: `A palestra do ${SPEAKER_NAME}` },
  { value: 'programacao', label: 'A programação' },
  { value: 'networking', label: 'As conexões que fiz' },
  { value: 'organizacao', label: 'A organização' },
  { value: 'local', label: 'O local' },
  { value: 'equipe', label: 'O atendimento da equipe' },
  { value: 'credenciamento', label: 'A chegada e a recepção' },
  { value: 'alimentacao', label: 'A comida e a bebida' },
  { value: 'pontualidade', label: 'Os horários em dia' },
  { value: 'comunicacao', label: 'As informações que recebi' },
]

// ---------------------------------------------------------------------------
// Q10 — Indicação (NPS)
// ---------------------------------------------------------------------------

export const NPS_MIN = 0
export const NPS_MAX = 10

// ---------------------------------------------------------------------------
// Limites dos campos abertos — curtos e objetivos, por decisão de UX
// ---------------------------------------------------------------------------

export const TEXT_LIMITS = {
  wantedSpeakers: 120,
  wantedTopics: 160,
  improvement: 280,
  oneWord: 60,
} as const

// ---------------------------------------------------------------------------
// Etapas do wizard — UMA PERGUNTA POR TELA
//
// A ordem é a mesma do questionário original (Q1 → Q11). As etapas 2 e 4
// são as únicas com vários itens, e mesmo elas mostram um item por vez.
// ---------------------------------------------------------------------------

export type SurveyStepKind = 'stars' | 'deck' | 'choice' | 'text' | 'nps' | 'review'

export interface SurveyStepMeta {
  /** Rótulo curto da seção, exibido acima da barra de progresso */
  section: string
  /** Questão do questionário original coberta nesta etapa */
  question: string
  kind: SurveyStepKind
  /** Etapas de escolha avançam sozinhas depois da resposta */
  autoAdvance: boolean
}

export const SURVEY_STEPS: SurveyStepMeta[] = [
  { section: 'Sua nota geral',   question: 'Q1',  kind: 'stars',  autoAdvance: true },
  { section: 'O evento',         question: 'Q2',  kind: 'deck',   autoAdvance: false },
  { section: 'O conteúdo',       question: 'Q3',  kind: 'choice', autoAdvance: true },
  { section: 'A palestra',       question: 'Q4',  kind: 'deck',   autoAdvance: false },
  { section: 'A palestra',       question: 'Q5',  kind: 'choice', autoAdvance: true },
  { section: 'Próxima edição',   question: 'Q6',  kind: 'text',   autoAdvance: false },
  { section: 'Próxima edição',   question: 'Q7',  kind: 'text',   autoAdvance: false },
  { section: 'O que marcou',     question: 'Q8',  kind: 'choice', autoAdvance: true },
  { section: 'O que marcou',     question: 'Q9',  kind: 'text',   autoAdvance: false },
  { section: 'Para fechar',      question: 'Q10', kind: 'nps',    autoAdvance: true },
  { section: 'Para fechar',      question: 'Q11', kind: 'text',   autoAdvance: false },
  { section: 'Revisão',          question: '—',   kind: 'review', autoAdvance: false },
]

export const TOTAL_STEPS = SURVEY_STEPS.length

/** Etapa onde cada resposta foi dada — usado pelo "Editar" da revisão */
export const STEP_OF = {
  overall: 1,
  eventAspects: 2,
  contentRelevance: 3,
  speakerAspects: 4,
  speakerReturn: 5,
  wantedSpeakers: 6,
  wantedTopics: 7,
  highlight: 8,
  improvement: 9,
  nps: 10,
  oneWord: 11,
} as const
