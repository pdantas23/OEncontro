# Encontro API — Mercado Pago Checkout Pro

API HTTP que intermedia o checkout com Mercado Pago e recebe webhooks IPN.
Roda como container Node.js independente, deployado via EasyPanel.

## Endpoints

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/health` | Healthcheck (retorna `{ ok: true }`) |
| POST | `/create-preference` | Cria Preference no MP, retorna `{ init_point }` |
| POST | `/mp-webhook` | Recebe notificações IPN do MP |

### POST /create-preference

```json
{
  "order_id": "uuid",
  "buyer_name": "Nome",
  "buyer_email": "email@exemplo.com",
  "buyer_cpf": "12345678901",
  "items": [{ "title": "Ingresso", "quantity": 1, "unit_price": 10000 }],
  "total": 10000
}
```

Retorna: `{ "init_point": "https://...", "preference_id": "..." }`

### POST /mp-webhook

Recebe payload IPN do Mercado Pago. Consulta a API do MP para obter
status real, atualiza `payment_status` no banco, envia e-mail de
confirmação (best-effort), libera vaga se rejeitado.

## Rodar localmente

```bash
cd api
npm install
npm run dev
```

A API sobe na porta 3000 por padrão.

## Variáveis de ambiente

```env
# Mercado Pago
MP_ACCESS_TOKEN=                    # Token do painel MP (TEST- para sandbox)
MP_SANDBOX=true                     # false em produção

# Supabase (service role — NÃO expor no frontend)
SUPABASE_URL=                       # ex: https://supabase.flexofertas.shop
SUPABASE_SERVICE_ROLE_KEY=          # service role key

# URLs públicas
PUBLIC_API_URL=                     # ex: https://api.seudominio.com.br
APP_URL=                            # ex: https://seudominio.com.br/encontro
CORS_ALLOWED_ORIGINS=               # OBRIGATÓRIA em produção. Comma-separated.
                                    # Se vazia, NENHUMA origem cross-origin é aceita
                                    # (o frontend não consegue chamar /create-preference).
                                    # ex: https://seudominio.com.br,https://www.seudominio.com.br

# Resend (opcional nesta fase)
RESEND_API_KEY=                     # deixar vazio para desabilitar
RESEND_FROM_EMAIL=                  # default: noreply@seudominio.com.br
RESEND_FROM_NAME=                   # default: O Encontro 2026

# Servidor
PORT=3000                           # default 3000
```

## Deploy no EasyPanel

1. Criar app tipo **App** no EasyPanel
2. Fonte: GitHub, apontar para este repo
3. Build path: `/api`
4. Dockerfile path: `/api/Dockerfile`
5. Porta: `3000`
6. Domínio: configurar o domínio da API no EasyPanel
7. Configurar env vars no painel "Ambiente" (valores reais)
8. Cadastrar `https://<DOMINIO_API>/mp-webhook` como
   `notification_url` no painel do Mercado Pago
