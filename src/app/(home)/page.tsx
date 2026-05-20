import Image from 'next/image'
import type { Metadata } from 'next'

import { ParaQuemCarousel } from '@/components/home/ParaQuemCarousel'
import {
  HeroDynamic,
  ProgramacaoSection,
  PalestrantesSection,
  IngressosSection,
} from '@/components/home/DynamicSections'
import { buildMetadata } from '@/components/shared/SEOWrapper'
import { LandingPageTracker } from '@/components/tracking/LandingPageTracker'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/Accordion'
import { Avatar } from '@/components/ui/Avatar'
import { Carousel } from '@/components/ui/Carousel'
import { StarRating } from '@/components/ui/StarRating'

// ---------------------------------------------------------------------------
// Metadata (estática — funciona em static export)
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  ...buildMetadata({
    title: 'O Encontro 2026',
    description:
      'Um encontro criado para cerimonialistas, organizadores e profissionais de eventos que desejam fortalecer conexões, ampliar visão de mercado e viver uma experiência construída nos detalhes.',
  }),
}

// ---------------------------------------------------------------------------
// FAQ data (estático)
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
// Page (Server Component — layout estático, seções dinâmicas via Client)
// ---------------------------------------------------------------------------

export default function HomePage() {
  return (
    <main id="main-content">
      <LandingPageTracker />

      {/* SEÇÃO 1 — HERO */}
      <section
        id="hero"
        className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden px-container-x py-2 pb-12 text-center"
        aria-labelledby="hero-title"
      >
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
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 72% 60% at 50% 48%, rgba(242,239,233,0.88) 0%, rgba(237,230,218,0.55) 60%, rgba(237,230,218,0.0) 100%)',
          }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-32"
          style={{ background: 'linear-gradient(to bottom, transparent, #EDE6DA)' }}
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col items-center">
          <Image
            src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/logo2.png`}
            alt="O Encontro 2026"
            width={920}
            height={200}
            className="mb-10 h-auto w-[200px] sm:w-[180px] lg:w-[250px]"
            priority
          />

          <h1
            id="hero-title"
            className="font-display text-4xl font-semibold leading-[1.15] text-foreground sm:text-5xl lg:text-6xl"
          >
            O encontro entre experiência,<br />
            <span className="text-accent">mercado e conexões reais.</span>
          </h1>

          <p className="mt-8 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Um encontro criado para cerimonialistas, organizadores e profissionais de eventos
            que desejam fortalecer conexões, ampliar visão de mercado e viver uma experiência
            construída nos detalhes.
          </p>

          {/* Data, local e CTAs vêm da API em runtime */}
          <HeroDynamic />
        </div>
      </section>

      <div style={{ background: 'linear-gradient(180deg, #EDE6DA 0%, #F2EFE9 100%)' }}>
        {/* SEÇÃO 2 — SOBRE O EVENTO */}
        <section
          id="sobre"
          className="relative overflow-hidden px-container-x py-10"
          aria-labelledby="sobre-title"
        >
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

      {/* SEÇÃO 4 — PROGRAMAÇÃO (dinâmica via API) */}
      <section
        id="programacao"
        className="relative overflow-hidden px-container-x py-section-y"
        style={{ background: 'linear-gradient(180deg, #EAE3D8 0%, #F2EFE9 100%)' }}
        aria-labelledby="programacao-title"
      >
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
            <ProgramacaoSection />
          </div>
        </div>
      </section>

      {/* SEÇÃO 5 — PALESTRANTES (dinâmica via API) */}
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
            <PalestrantesSection />
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

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { name: 'Participante A', role: 'Cerimonialista', rating: 5, text: 'Depoimento real em breve.' },
              { name: 'Participante B', role: 'Organizadora de eventos', rating: 5, text: 'Depoimento real em breve.' },
              { name: 'Participante C', role: 'Produtora de eventos', rating: 5, text: 'Depoimento real em breve.' },
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

      {/* SEÇÃO 8 — INGRESSOS (dinâmica via API) */}
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
            Pagamento seguro via Mercado Pago.
          </p>

          <div className="mt-12">
            <IngressosSection />
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
