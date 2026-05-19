'use client'

/**
 * CheckoutWizard — Gerencia o fluxo de 3 etapas do checkout via useReducer.
 *
 * Etapas:
 *   1. Dados pessoais
 *   2. Order bumps
 *   3. Resumo → redireciona para Mercado Pago Checkout Pro
 *
 * Estado local via useReducer — se o usuário fechar e reabrir, começa do zero.
 * Após criação do pedido: redireciona para Mercado Pago (init_point).
 * MP redireciona de volta para /obrigado?order_id=xxx após pagamento.
 */

import { useEffect, useReducer } from 'react'
import { CheckoutSteps } from '@/components/ui/CheckoutSteps'
import { trackSelectTicket, trackCheckoutStep } from '@/utils/tracking'
import { Step1Dados } from './steps/Step1Dados'
import { Step2OrderBumps } from './steps/Step2OrderBumps'
import { Step3Resumo } from './steps/Step3Resumo'
import type { OrderBump } from '@/repositories/OrderBumpRepository'
import type { TicketLot } from '@/repositories/TicketLotRepository'
import type {
  CheckoutState,
  CheckoutAction,
  BuyerData,
  SelectedBump,
  CheckoutStep,
} from '@/types/checkout'

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function checkoutReducer(state: CheckoutState, action: CheckoutAction): CheckoutState {
  switch (action.type) {
    case 'SET_BUYER':
      return { ...state, buyer: action.buyer }
    case 'SET_BUMPS':
      return { ...state, bumps: action.bumps }
    case 'SET_QUANTITY':
      return { ...state, quantity: Math.max(1, Math.min(action.quantity, state.lotAvailable)) }
    case 'NEXT_STEP':
      return { ...state, step: Math.min(state.step + 1, 3) as CheckoutStep }
    case 'PREV_STEP':
      return { ...state, step: Math.max(state.step - 1, 1) as CheckoutStep }
    case 'GO_TO_STEP':
      return { ...state, step: action.step }
    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CheckoutWizardProps {
  lot: TicketLot
  activeBumps: OrderBump[]
}

// ---------------------------------------------------------------------------
// Constantes de UI
// ---------------------------------------------------------------------------

const STEP_LABELS = ['Seus dados', 'Adicionais', 'Pagamento']

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function CheckoutWizard({ lot, activeBumps }: CheckoutWizardProps) {
  const available = lot.total_limit - lot.sold_count

  const [state, dispatch] = useReducer(checkoutReducer, {
    step: 1,
    lotId: lot.id,
    lotName: lot.name,
    lotPrice: lot.price,
    lotAvailable: available,
    quantity: 1,
    buyer: null,
    bumps: [],
  } satisfies CheckoutState)

  // T100 — select_ticket ao montar o wizard
  useEffect(() => {
    trackSelectTicket(lot.id, lot.name, lot.price)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // CheckoutSteps usa índice base 0
  const currentStepIndex = state.step - 1

  function handleStep1Next(buyer: BuyerData) {
    dispatch({ type: 'SET_BUYER', buyer })
    dispatch({ type: 'NEXT_STEP' })
    // T101 — etapa 1 concluída
    trackCheckoutStep(1, 'Seus dados')
  }

  function handleStep2Next(bumps: SelectedBump[]) {
    dispatch({ type: 'SET_BUMPS', bumps })
    dispatch({ type: 'NEXT_STEP' })
    // T101 — etapa 2 concluída
    trackCheckoutStep(2, 'Adicionais')
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      {/* Indicador de etapas */}
      <CheckoutSteps
        steps={STEP_LABELS}
        currentStep={currentStepIndex}
        className="mb-8"
      />

      {/* Conteúdo da etapa */}
      {state.step === 1 && (
        <Step1Dados
          defaultValues={state.buyer ?? undefined}
          onNext={handleStep1Next}
        />
      )}

      {state.step === 2 && (
        <Step2OrderBumps
          bumps={activeBumps}
          defaultSelected={state.bumps}
          onNext={handleStep2Next}
          onBack={() => dispatch({ type: 'PREV_STEP' })}
        />
      )}

      {state.step === 3 && (
        <Step3Resumo
          state={state}
          onBack={() => dispatch({ type: 'PREV_STEP' })}
        />
      )}
    </div>
  )
}
