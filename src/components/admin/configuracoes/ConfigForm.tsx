'use client'

import { useState, useTransition } from 'react'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { saveConfigAction } from '@/app/admin/configuracoes/actions'
import type { Database } from '@/types/database'

type EventConfig = Database['public']['Tables']['event_config_encontro']['Row']

interface ConfigFormProps {
  config: EventConfig
}

export function ConfigForm({ config }: ConfigFormProps) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMessage(null)
    const data = Object.fromEntries(new FormData(e.currentTarget))

    startTransition(async () => {
      const result = await saveConfigAction(config.id, data)
      setMessage(
        result.success
          ? { type: 'success', text: 'Configurações salvas com sucesso.' }
          : { type: 'error', text: result.error ?? 'Erro ao salvar.' },
      )
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {message && (
        <Alert variant={message.type === 'success' ? 'success' : 'destructive'}>
          {message.text}
        </Alert>
      )}

      {/* Evento */}
      <section className="space-y-4">
        <h2 className="font-display text-base font-semibold text-foreground border-b border-border pb-2">
          Informações do evento
        </h2>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Nome do evento</label>
          <Input name="name" defaultValue={config.name ?? ''} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Data</label>
            <Input name="date" type="datetime-local" defaultValue={config.date ? config.date.slice(0, 16) : ''} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Local</label>
            <Input name="location" defaultValue={config.location ?? ''} />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Descrição</label>
          <Textarea name="description" defaultValue={config.description ?? ''} rows={4} />
        </div>
      </section>

      {/* Vendas */}
      <section className="space-y-4">
        <h2 className="font-display text-base font-semibold text-foreground border-b border-border pb-2">
          Configurações de vendas
        </h2>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Status de vendas</label>
            <select
              name="sale_status"
              defaultValue={config.sale_status ?? 'open'}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="open">Aberto</option>
              <option value="closed">Fechado</option>
              <option value="sold_out">Esgotado</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Limite total</label>
            <Input name="total_ticket_limit" type="number" min="1" defaultValue={config.total_ticket_limit ?? ''} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Alerta de baixo estoque</label>
            <Input name="low_stock_threshold" type="number" min="1" defaultValue={config.low_stock_threshold ?? 10} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Link do grupo (WhatsApp/Telegram)</label>
            <Input name="group_link" defaultValue={config.group_link ?? ''} placeholder="https://…" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">WhatsApp suporte</label>
            <Input name="whatsapp_support" defaultValue={config.whatsapp_support ?? ''} placeholder="5511999999999" />
          </div>
        </div>
      </section>

      {/* Tracking */}
      <section className="space-y-4">
        <h2 className="font-display text-base font-semibold text-foreground border-b border-border pb-2">
          Tracking e analytics {/* TODO TF08 */}
        </h2>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Meta Pixel ID</label>
            <Input name="meta_pixel_id" defaultValue={config.meta_pixel_id ?? ''} placeholder="123456789" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">GTM ID</label>
            <Input name="gtm_id" defaultValue={config.gtm_id ?? ''} placeholder="GTM-XXXXXX" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Google Ads ID</label>
            <Input name="google_ads_id" defaultValue={config.google_ads_id ?? ''} placeholder="AW-XXXXXXXXX" />
          </div>
        </div>
      </section>

      <div className="flex justify-end pt-2">
        <Button type="submit" loading={isPending} className="min-w-32">
          Salvar configurações
        </Button>
      </div>
    </form>
  )
}
