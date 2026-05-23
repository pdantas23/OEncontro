@AGENTS.md

## Protocolo de revisão e aprovação (2 sub-agentes)

Há 2 sub-agentes especializados em .claude/agents/:
- **strategy-reviewer**: análise tática profunda. Lê código, valida implementação, identifica buracos. NÃO aprova.
- **strategic-overseer**: aprovação final autônoma. Decide cadência, autoriza prosseguimento. Substitui aprovação humana exceto em backups.

### Fluxo padrão (toda decisão táctica ou estratégica)

1. Apresenta plano/decisão internamente
2. Se trigger técnico aplica (ver lista abaixo), invoca @strategy-reviewer com plano completo
3. Invoca @strategic-overseer com plano + análise do reviewer (se houver)
4. Overseer responde com VEREDITO (APROVAR / APROVAR COM AJUSTES / PEDIR INFO / ESCALAR)
5. Executa conforme veredito do overseer

### Triggers de invocação do strategy-reviewer (análise técnica)
- Plano de task com migration de DB
- Mudança em /create-order ou /mp-webhook
- Mudança em CheckoutWizard, Step1/2/3
- Decisão arquitetural não coberta no plano original
- Mudança de cadência
- Relatório de fim de bloco
- Falha de tsc/build/vitest

NÃO invocar reviewer para: updates curtos de progresso, refactor simples, tasks já planejadas em detalhe.

### Triggers de ESCALAÇÃO AO HUMANO (overseer NÃO aprova sozinho)
1. Aplicação de migration de DB (humano roda backup + aprova texto)
2. Falha catastrófica (tsc/build/vitest com múltiplos consertos falhados)
3. Decisão arquitetural que muda contrato público já em uso
4. Erro em produção identificado durante execução
5. Mudança de escopo maior (adicionar/remover tasks)
6. Custo/risco fora do esperado (task >2x estimativa)
7. Conflito irresolvido entre overseer e strategy-reviewer
8. Humano pediu inline ("me avisa quando X")

### Tudo o resto
Overseer decide. Não pause pra perguntar ao humano fora dos triggers acima.
