import { Calendar, MapPin, Star } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { EventConfigRepository } from '@/repositories/EventConfigRepository'
import { ScheduleRepository } from '@/repositories/ScheduleRepository'
import { SpeakerRepository } from '@/repositories/SpeakerRepository'
import { TicketLotRepository } from '@/repositories/TicketLotRepository'

import { ParaQuemCarousel } from '@/components/home/ParaQuemCarousel'
import { buildMetadata } from '@/components/shared/SEOWrapper'
import { LandingPageTracker } from '@/components/tracking/LandingPageTracker'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/Accordion'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Carousel } from '@/components/ui/Carousel'
import { ProgramacaoTabs } from '@/components/ui/ProgramacaoTabs'
import { Skeleton } from '@/components/ui/Skeleton'
import { StarRating } from '@/components/ui/StarRating'

import { cn } from '@/utils/cn'
import { formatLongDate } from '@/utils/dates'
import { formatCurrency, getInitials } from '@/utils/format'

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  ...buildMetadata({
    title: 'O Encontro 2026',
    description:
      'Um encontro criado para cerimonialistas, organizadores e profissionais de eventos que desejam fortalecer conexões, ampliar visão de mercado e viver uma experiência construída nos detalhes.',
  }),
}

// ---------------------------------------------------------------------------
// JSON-LD
// ---------------------------------------------------------------------------

function EventJsonLd({ config }: { config: Awaited<ReturnType<typeof EventConfigRepository.find>> }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: config?.name ?? 'O Encontro 2026',
    description:
      config?.description ??
      'Um encontro criado para cerimonialistas e profissionais de eventos que desejam fortalecer conexões, ampliar visão de mercado e viver uma experiência construída nos detalhes.',
    startDate: config?.date ?? '2026-01-01',
    location: {
      '@type': 'Place',
      name: config?.location ?? 'A confirmar',
    },
    offers: {
      '@type': 'Offer',
      availability:
        config?.sale_status === 'soldout'
          ? 'https://schema.org/SoldOut'
          : 'https://schema.org/InStock',
      url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout`,
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

// ---------------------------------------------------------------------------
// FAQ data
// ---------------------------------------------------------------------------

const FAQ_ITEMS = [
  {
    q: 'Onde será o evento?',
    a: 'O local será confirmado em breve. Fique de olho no seu e-mail e WhatsApp.',
  },
  {
    q: 'Qual o horário?',
    a: 'O horário completo será divulgado junto com a programação oficial do evento.',
  },
  {
    q: 'O ingresso é individual?',
    a: 'Sim. Cada ingresso dá acesso a uma pessoa. Para grupos, adquira o número de ingressos correspondente.',
  },
  {
    q: 'Posso pagar via Pix?',
    a: 'Sim. O pagamento via Pix é confirmado imediatamente. Após a confirmação, você recebe os detalhes por e-mail.',
  },
  {
    q: 'Posso pagar no cartão de crédito?',
    a: 'Sim. Aceitamos cartão de crédito. O acesso é liberado após a aprovação da transação.',
  },
  {
    q: 'O almoço está incluso?',
    // TODO TF06 — confirmar política de almoço conforme lotes
    a: 'Depende do tipo de ingresso escolhido. Verifique os benefícios de cada lote na seção de ingressos.',
  },
  {
    q: 'A camisa está inclusa?',
    a: 'A camisa do evento pode ser adicionada ao seu pedido como item opcional no momento da compra.',
  },
  {
    q: 'Posso comprar a camisa separadamente?',
    a: 'Sim. A camisa está disponível como item adicional no checkout, com seleção de tamanho (P, M, G, GG, XG).',
  },
  {
    q: 'Receberei confirmação por e-mail?',
    a: 'Sim. Você receberá a confirmação por e-mail imediatamente após o pagamento ser processado.',
  },
  {
    q: 'Como funciona a entrada no dia do evento?',
    a: 'Você receberá as instruções de acesso por e-mail antes do evento. Apresente o comprovante na entrada.',
  },
]

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function HomePage() {
  const [lots, speakers, schedule, config] = await Promise.all([
    TicketLotRepository.findActive(),
    SpeakerRepository.findAll(),
    ScheduleRepository.findAll(),
    EventConfigRepository.find(),
  ])

  const isSaleOpen = !config || config.sale_status === 'open'
  const isSoldOut = config?.sale_status === 'soldout'
  const lowStockThreshold = config?.low_stock_threshold ?? 20

  return (
    <main id="main-content">
      <EventJsonLd config={config} />
      <LandingPageTracker />

      {/* SEÇÃO 1 — HERO */}
      <section
        id="hero"
        className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden px-container-x py-2 pb-12 text-center"
        aria-labelledby="hero-title"
      >
        {/* Fundo: padrão guará full-width */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `url(${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/texturas/fundo-guara.png)`,
            backgroundSize: 'auto',
            backgroundRepeat: 'repeat',
            opacity: 0.68,
          }}
          aria-hidden="true"
        />

        {/* Vignette central — garante leitura do texto sem apagar a textura nas bordas */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 72% 60% at 50% 48%, rgba(242,239,233,0.88) 0%, rgba(237,230,218,0.55) 60%, rgba(237,230,218,0.0) 100%)',
          }}
          aria-hidden="true"
        />

        {/* Fade bottom para transição suave com a próxima seção */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-32"
          style={{
            background: 'linear-gradient(to bottom, transparent, #EDE6DA)',
          }}
          aria-hidden="true"
        />

        {/* Conteúdo */}
        <div className="relative z-10 flex flex-col items-center">
          {/* Logo */}
          <Image
            src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/logo2.png`}
            alt="O Encontro 2026"
            width={920}
            height={200}
            className="mb-10 h-auto w-[200px] sm:w-[180px] lg:w-[250px]"
            priority
          />

          {/* Título */}
          <h1
            id="hero-title"
            className="font-display text-4xl font-semibold leading-[1.15] text-foreground sm:text-5xl lg:text-6xl"
          >
            O encontro entre experiência,<br />
            <span className="text-accent">mercado e conexões reais.</span>
          </h1>

          {/* Subtítulo */}
          <p className="mt-8 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Um encontro criado para cerimonialistas, organizadores e profissionais de eventos
            que desejam fortalecer conexões, ampliar visão de mercado e viver uma experiência
            construída nos detalhes.
          </p>

          {/* Data e local */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-5 font-detail text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-accent" aria-hidden="true" />
              {/* TODO TF04 — substituir pela data real */}
              <span>{config?.date ? formatLongDate(config.date) : 'Data a confirmar'}</span>
            </div>
            <div className="h-1 w-1 rounded-full bg-muted-foreground/40" aria-hidden="true" />
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-accent" aria-hidden="true" />
              {/* TODO TF04 — substituir pelo local real */}
              <span>{config?.location ?? 'Local a confirmar'}</span>
            </div>
          </div>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:mt-10 sm:flex-row">
            {isSoldOut ? (
              <Button size="lg" className="w-[280px] rounded-full sm:w-[220px]" disabled>Esgotado</Button>
            ) : isSaleOpen ? (
              <Button size="lg" className="w-[280px] rounded-full sm:w-[220px]" asChild>
                <a href="#ingressos">Garantir meu ingresso</a>
              </Button>
            ) : (
              <Button size="lg" className="w-[280px] rounded-full sm:w-[220px]" disabled>Vendas encerradas</Button>
            )}
            <Button variant="outline" size="lg" className="w-[280px] rounded-full sm:w-[220px]" asChild>
              <a href="#programacao">Ver programação</a>
            </Button>
          </div>
        </div>
      </section>
      
      <div style={{ background: 'linear-gradient(180deg, #EDE6DA 0%, #F2EFE9 100%)' }}>
        {/* SEÇÃO 2 — SOBRE O EVENTO */}
        <section
          id="sobre"
          className="relative overflow-hidden px-container-x py-10"
          aria-labelledby="sobre-title"
        >
          {/* Guará decorativo — espalhado ao fundo, texto sempre acima via z-10 */}
          <div className="pointer-events-none absolute inset-0 z-0 flex items-end justify-end" aria-hidden="true">
            <Image
              src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/assets/guara-realista.png`}
              alt=""
              width={1100}
              height={650}
              className="h-auto w-[95%] translate-x-[8%] translate-y-[-80%] sm:w-[80%] sm:translate-y-[30%]"
              style={{ opacity: 0.63 }}
            />
          </div>

          {/* Fade — protege apenas o título no desktop, sem afetar a imagem abaixo */}
          <div
            className="pointer-events-none absolute inset-0 z-[5] hidden sm:block"
            style={{
              background:
                'linear-gradient(to bottom, rgba(242,239,233,0.74) 0%, rgba(237,230,218,0.52) 22%, transparent 55%)',
            }}
            aria-hidden="true"
          />

          <div className="relative z-10 mx-auto max-w-4xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-primary" aria-hidden="true" />
              <span className="font-detail text-xs font-medium uppercase tracking-[0.2em] text-primary">
                O encontro
              </span>
              <div className="h-px flex-1 bg-primary" aria-hidden="true" />
            </div>

            <h2
              id="sobre-title"
              className="text-center font-display text-3xl font-semibold text-foreground sm:text-4xl"
            >
              Por que O Encontro existe
            </h2>

            <div className="mt-12 grid gap-8 text-muted-foreground md:grid-cols-2">
              <div className="flex flex-col gap-5 leading-relaxed">
                <p>
                  O Encontro nasce da necessidade de criar um espaço onde profissionais
                  do mercado de eventos possam compartilhar experiências, ampliar conexões
                  e discutir os movimentos que transformam o setor.
                </p>
                <p>
                  A proposta não é apenas reunir pessoas, mas criar uma experiência
                  relevante para quem vive os bastidores dos eventos e entende o valor
                  dos detalhes.
                </p>
              </div>

              <div className="flex flex-col gap-5 leading-relaxed">
                <p>
                  As palestras, conversas e experiências foram pensadas para profissionais
                  que desejam evoluir posicionamento, atendimento, gestão e visão
                  de mercado.
                </p>
                <p>
                  Uma programação construída com cuidado. Um ambiente pensado para a
                  troca genuína. Uma edição que reconhece o valor de quem move o mercado
                  de eventos.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SEÇÃO 3 — PARA QUEM É */}
        <section
        id="para-quem"
        className="relative overflow-hidden px-container-x py-section-y"
        aria-labelledby="para-quem-title"
        >
          <div className="pointer-events-none absolute inset-0 z-0 flex items-end justify-start" aria-hidden="true">
            <Image
              src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/assets/guara.png`}
              alt=""
              width={1100}
              height={650}
              className="h-auto w-[55%] -translate-x-[20%] translate-y-[30%] scale-x-[1] sm:w-[30%] sm:translate-y-[30%]"
              style={{ opacity: 0.63 }}
            />
          </div>

          <div className="relative z-10 mx-auto max-w-5xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-primary" aria-hidden="true" />
              <span className="font-detail text-xs font-medium uppercase tracking-[0.2em] text-primary">
                Para quem é
              </span>
              <div className="h-px flex-1 bg-primary" aria-hidden="true" />
            </div>

            <h2
              id="para-quem-title"
              className="text-center font-display text-3xl font-semibold text-foreground sm:text-4xl"
            >
              Para quem vive o mercado de eventos
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-center text-foreground/60">
              E entende que cada detalhe constrói uma experiência.
            </p>

            <div className="mt-12">
              <ParaQuemCarousel />
            </div>
          </div>
        </section>
      </div>

      {/* SEÇÃO 4 — PROGRAMAÇÃO */}
      <section
        id="programacao"
        className="relative overflow-hidden px-container-x py-section-y"
        style={{ background: 'linear-gradient(180deg, #EAE3D8 0%, #F2EFE9 100%)' }}
        aria-labelledby="programacao-title"
      >
        {/* Guará decorativo — espalhado ao fundo, texto sempre acima via z-10 */}
        <div className="pointer-events-none absolute inset-0 z-0 flex items-end justify-end" aria-hidden="true">
          <Image
            src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/assets/guara-realista.png`}
            alt=""
            width={1100}
            height={650}
            className="h-auto w-[95%] -translate-x-[-18%] translate-y-[-20%] scale-x-[1] sm:w-[80%] sm:translate-y-[30%]"
            style={{ opacity: 0.63 }}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-3xl">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-accent" aria-hidden="true" />
            <span className="font-detail text-xs font-medium uppercase tracking-[0.2em] text-accent">
              Programação
            </span>
            <div className="h-px flex-1 bg-accent" aria-hidden="true" />
          </div>

          <h2
            id="programacao-title"
            className="text-center font-display text-3xl font-semibold text-foreground sm:text-4xl"
          >
            Uma programação construída para o mercado
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
            Conteúdos pensados para profissionais que desejam acompanhar os movimentos
            do setor e fortalecer sua atuação.
          </p>

          <div className="mt-12">
            {schedule.length > 0 ? (
              <ProgramacaoTabs schedule={schedule} />
            ) : (
              <div className="space-y-6" aria-label="Programação em breve">
                <p className="text-center text-sm text-muted-foreground">
                  A programação completa será divulgada em breve.
                </p>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SEÇÃO 5 — PALESTRANTES */}
      <section
        id="palestrantes"
        className="bg-background px-container-x py-section-y"
        aria-labelledby="palestrantes-title"
      >
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-primary" aria-hidden="true" />
            <span className="font-detail text-xs font-medium uppercase tracking-[0.2em] text-primary">
              Palestrantes
            </span>
            <div className="h-px flex-1 bg-primary" aria-hidden="true" />
          </div>

          <h2
            id="palestrantes-title"
            className="text-center font-display text-3xl font-semibold text-foreground sm:text-4xl"
          >
            Profissionais convidados
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
            Experiências, visões de mercado e aprendizados construídos na prática.
          </p>

          <div className="mt-12">
            {speakers.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {speakers.map((speaker) => (
                  <article
                    key={speaker.id}
                    className="group flex flex-col gap-4 rounded-lg border border-border bg-secondary p-6 transition-colors duration-300 hover:border-accent/40"
                  >
                    <div className="flex items-center gap-4">
                      {speaker.photo_url ? (
                        <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-accent/20">
                          <Image
                            src={speaker.photo_url}
                            alt={speaker.name}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="64px"
                          />
                        </div>
                      ) : (
                        <Avatar
                          fallback={getInitials(speaker.name)}
                          size="lg"
                          className="border-2 border-accent/20"
                        />
                      )}
                      <div className="min-w-0">
                        <h3 className="font-display font-semibold text-foreground leading-tight">
                          {speaker.name}
                        </h3>
                        {speaker.role && (
                          <p className="font-detail text-xs text-muted-foreground mt-0.5">{speaker.role}</p>
                        )}
                      </div>
                    </div>

                    {speaker.bio && (
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                        {speaker.bio}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <p className="col-span-full text-center text-sm text-muted-foreground">
                  Os convidados serão anunciados em breve.
                </p>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex flex-col gap-4 rounded-lg border border-border bg-secondary p-6">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-16 w-16 rounded-full shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SEÇÃO 6 — MEMÓRIAS DE EDIÇÕES ANTERIORES */}
      <section
        id="memorias"
        className="px-container-x py-section-y"
        style={{ background: 'linear-gradient(180deg, #EDE6DA 0%, #F2EFE9 100%)' }}
        aria-labelledby="memorias-title"
      >
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-accent" aria-hidden="true" />
            <span className="font-detail text-xs font-medium uppercase tracking-[0.2em] text-accent">
              Edições anteriores
            </span>
            <div className="h-px flex-1 bg-accent" aria-hidden="true" />
          </div>

          <h2
            id="memorias-title"
            className="text-center font-display text-3xl font-semibold text-foreground sm:text-4xl"
          >
            Momentos que continuam presentes
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
            Experiências, conexões e histórias construídas em cada edição.
          </p>

          {/* Carrossel de fotos — TODO TF11 */}
          <div className="mt-12">
            <Carousel
              items={[
                {
                  id: 'placeholder-1',
                  content: (
                    <div className="flex aspect-video items-center justify-center rounded-lg bg-muted border border-border">
                      <p className="font-detail text-sm text-muted-foreground">Fotos da edição anterior em breve</p>
                    </div>
                  ),
                },
              ]}
              showArrows={false}
            />
          </div>
        </div>
      </section>

      {/* SEÇÃO 7 — DEPOIMENTOS */}
      <section
        id="feedbacks"
        className="bg-background px-container-x py-section-y"
        aria-labelledby="feedbacks-title"
      >
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-accent" aria-hidden="true" />
            <span className="font-detail text-xs font-medium uppercase tracking-[0.2em] text-accent">
              Depoimentos
            </span>
            <div className="h-px flex-1 bg-accent" aria-hidden="true" />
          </div>

          <h2
            id="feedbacks-title"
            className="text-center font-display text-3xl font-semibold text-foreground sm:text-4xl"
          >
            O que ficou após cada edição
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
            Experiências compartilhadas por profissionais que viveram o encontro.
          </p>

          {/* Depoimentos — TODO TF12 */}
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: 'Participante A',
                role: 'Cerimonialista',
                rating: 5,
                text: 'Depoimento real em breve.',
              },
              {
                name: 'Participante B',
                role: 'Organizadora de eventos',
                rating: 5,
                text: 'Depoimento real em breve.',
              },
              {
                name: 'Participante C',
                role: 'Produtora de eventos',
                rating: 5,
                text: 'Depoimento real em breve.',
              },
            ].map(({ name, role, rating, text }) => (
              <article
                key={name}
                className="flex flex-col gap-4 rounded-lg border border-border bg-secondary p-6"
              >
                <StarRating value={rating} />
                <p className="flex-1 text-sm text-muted-foreground leading-relaxed italic">
                  &ldquo;{text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <Avatar fallback={name[0]} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{name}</p>
                    <p className="font-detail text-xs text-muted-foreground">{role}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* SEÇÃO 8 — INGRESSOS */}
      <section
        id="ingressos"
        className="px-container-x py-section-y"
        style={{ background: 'linear-gradient(180deg, #EAE3D8 0%, #EDE6DA 100%)' }}
        aria-labelledby="ingressos-title"
      >
        <div className="mx-auto max-w-4xl">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-primary" aria-hidden="true" />
            <span className="font-detail text-xs font-medium uppercase tracking-[0.2em] text-primary">
              Garanta sua participação
            </span>
            <div className="h-px flex-1 bg-primary" aria-hidden="true" />
          </div>

          <h2
            id="ingressos-title"
            className="text-center font-display text-3xl font-semibold text-foreground sm:text-4xl"
          >
            Escolha sua forma de participação
          </h2>
          <p className="mx-auto mt-4 max-w-md text-center font-detail text-sm text-muted-foreground">
            Vagas limitadas para preservar a experiência do encontro.
            Pagamento via Pix ou cartão de crédito.
          </p>

          <div className="mt-12">
            {lots.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {lots.map((lot) => {
                  const available = lot.total_limit - lot.sold_count
                  const isLotSoldOut = lot.status === 'soldout' || available <= 0
                  const isLowStock = !isLotSoldOut && available <= lowStockThreshold
                  const benefits = Array.isArray(lot.benefits) ? lot.benefits as string[] : []

                  return (
                    <article
                      key={lot.id}
                      className={cn(
                        'relative flex flex-col gap-4 rounded-lg border p-6 transition-colors duration-300',
                        isLotSoldOut
                          ? 'border-border bg-secondary opacity-60'
                          : 'border-accent/30 bg-background hover:border-accent/60',
                      )}
                      aria-label={`Lote ${lot.name}${isLotSoldOut ? ' — esgotado' : ''}`}
                    >
                      {isLowStock && !isLotSoldOut && (
                        <Badge variant="warning" className="absolute -top-2.5 left-4">
                          Últimas {available} vagas
                        </Badge>
                      )}

                      {isLotSoldOut && (
                        <Badge variant="secondary" className="absolute -top-2.5 left-4">
                          Esgotado
                        </Badge>
                      )}

                      <div>
                        <h3 className="font-display text-lg font-semibold text-foreground">
                          {lot.name}
                        </h3>
                        {lot.description && (
                          <p className="font-detail mt-1 text-xs text-muted-foreground">{lot.description}</p>
                        )}
                      </div>

                      <p className="font-display text-3xl font-semibold text-accent">
                        {formatCurrency(lot.price)}
                      </p>

                      {benefits.length > 0 && (
                        <ul className="flex flex-col gap-1.5">
                          {benefits.map((b, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <Star className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
                              {b}
                            </li>
                          ))}
                        </ul>
                      )}

                      {!isLotSoldOut && (
                        <p className="font-detail text-xs text-muted-foreground">
                          {available} {available === 1 ? 'vaga disponível' : 'vagas disponíveis'}
                        </p>
                      )}

                      <Button
                        className="mt-auto w-full"
                        disabled={isLotSoldOut || !isSaleOpen}
                        asChild
                      >
                        <Link
                          href={isLotSoldOut || !isSaleOpen ? '#' : `/checkout?lot=${lot.id}`}
                          aria-disabled={isLotSoldOut || !isSaleOpen}
                          tabIndex={isLotSoldOut || !isSaleOpen ? -1 : undefined}
                        >
                          {isLotSoldOut ? 'Esgotado' : !isSaleOpen ? 'Vendas encerradas' : 'Garantir minha participação'}
                        </Link>
                      </Button>
                    </article>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border bg-background/60 p-12 text-center">
                <p className="font-detail text-sm text-muted-foreground">
                  Os lotes de ingresso serão publicados em breve.
                </p>
                {[1, 2].map((i) => (
                  <div key={i} className="w-full max-w-xs space-y-3 rounded-lg border border-border bg-secondary p-6">
                    <Skeleton className="h-5 w-1/2" />
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-10 w-full rounded" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SEÇÃO 9 — PERGUNTAS FREQUENTES */}
      <section
        id="faq"
        className="bg-background px-container-x py-section-y"
        aria-labelledby="faq-title"
      >
        <div className="mx-auto max-w-2xl">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-accent" aria-hidden="true" />
            <span className="font-detail text-xs font-medium uppercase tracking-[0.2em] text-accent">
              Dúvidas frequentes
            </span>
            <div className="h-px flex-1 bg-accent" aria-hidden="true" />
          </div>

          <h2
            id="faq-title"
            className="text-center font-display text-3xl font-semibold text-foreground sm:text-4xl"
          >
            Tire suas dúvidas
          </h2>

          <div className="mt-12">
            <Accordion type="single" collapsible className="w-full">
              {FAQ_ITEMS.map((item, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger>{item.q}</AccordionTrigger>
                  <AccordionContent>{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>
    </main>
  )
}
