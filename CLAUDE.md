@AGENTS.md

## Revisão por agente revisor (strategy-reviewer)

Há um sub-agente especializado em revisão tática em `.claude/agents/strategy-reviewer.md`.

**Triggers de invocação OBRIGATÓRIA** (antes de pedir aprovação ao humano):
- Plano de task que envolva migration de DB
- Mudança em /create-order ou /mp-webhook
- Mudança em CheckoutWizard, Step1/2/3
- Decisão arquitetural não coberta no plano original
- Mudança de cadência (acelerar/desacelerar blocos)
- Relatório de fim de bloco
- Falha de tsc/build/vitest

**Fluxo**:
1. Apresenta plano/decisão internamente
2. Invoca @strategy-reviewer com o plano completo
3. Recebe análise estruturada do revisor
4. Apresenta AMBOS (plano original + análise do revisor) ao humano
5. Humano aprova/ajusta com base nas duas visões

**NÃO invocar** para:
- Updates curtos de progresso ("Task X concluída")
- Implementação direta de algo já aprovado em plano detalhado
- Tasks de tipo/refactor sem decisão de arquitetura

O revisor COMPLEMENTA a revisão humana, não substitui. Humano sempre é a aprovação final.
