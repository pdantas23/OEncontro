// ---------------------------------------------------------------------------
// Templates de e-mail — HTML inline (compatível com clientes de e-mail)
//
// Cores da marca:
//   background: #F2EFE9 (off-white quente)
//   card:       #EDE6DA (bege)
//   accent:     #CFA550 (dourado)
//   primary:    #FF2400 (vermelho guará)
//   foreground: #1C1410
//   muted:      #7A6E6A
//   border:     #D8D0C5
// ---------------------------------------------------------------------------

interface ApprovalData {
  buyerName: string
  orderShort: string
  formattedTotal: string
}

export function buildApprovalHtml({ buyerName, orderShort, formattedTotal }: ApprovalData): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#F2EFE9;font-family:'Inter','Helvetica Neue',Helvetica,Arial,sans-serif;color:#1C1410;">
  <div style="max-width:560px;margin:0 auto;padding:40px 16px;">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <span style="color:#CFA550;font-size:22px;font-weight:700;letter-spacing:0.08em;font-family:'Cormorant Garamond',Georgia,serif;">O ENCONTRO 2026</span>
    </div>

    <!-- Card principal -->
    <div style="background-color:#EDE6DA;border-radius:12px;border:1px solid #D8D0C5;padding:36px 32px;">
      <p style="font-size:36px;text-align:center;margin:0 0 16px 0;">✅</p>
      <h1 style="color:#1C1410;font-size:24px;font-weight:700;text-align:center;margin:0 0 8px 0;font-family:'Cormorant Garamond',Georgia,serif;">Pagamento confirmado!</h1>
      <p style="color:#2C2018;font-size:15px;text-align:center;margin:0 0 24px 0;line-height:1.6;">
        Olá, <strong>${buyerName}</strong>!<br/>Sua participação no <strong>O Encontro 2026</strong> está garantida.
      </p>

      <hr style="border:none;border-top:1px solid #D8D0C5;margin:0 0 24px 0;" />

      <!-- Detalhes do pedido -->
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:0 0 16px 0;">
            <span style="color:#7A6E6A;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:4px;">Número do pedido</span>
            <span style="color:#1C1410;font-size:15px;font-weight:600;">#${orderShort}</span>
          </td>
          <td style="padding:0 0 16px 0;text-align:right;">
            <span style="color:#7A6E6A;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:4px;">Total pago</span>
            <span style="color:#CFA550;font-size:20px;font-weight:700;">${formattedTotal}</span>
          </td>
        </tr>
      </table>

      <hr style="border:none;border-top:1px solid #D8D0C5;margin:0 0 24px 0;" />

      <p style="color:#2C2018;font-size:15px;text-align:center;margin:0 0 8px 0;line-height:1.6;">
        Parabéns pela sua compra!<br/>Fique atento ao seu e-mail para mais informações sobre o evento.
      </p>

      <p style="color:#7A6E6A;font-size:13px;text-align:center;margin:0;">
        Guarde este e-mail como comprovante da sua inscrição.
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:24px;">
      <p style="color:#7A6E6A;font-size:12px;margin:0;">
        Este e-mail foi enviado automaticamente. Em caso de dúvidas, entre em contato pelo WhatsApp de suporte.
      </p>
    </div>
  </div>
</body>
</html>`
}
