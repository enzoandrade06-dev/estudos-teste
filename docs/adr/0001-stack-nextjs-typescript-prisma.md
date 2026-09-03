# ADR-0001 — Stack: Next.js + TypeScript + Prisma

- **Status:** aceito
- **Data:** 2026-09-03

## Contexto

Precisamos escolher a stack da plataforma de estudos ([PLANO.md](../PLANO.md)).
Restrições relevantes:

- Aplicação **single-user**, sem autenticação na v1 ([ADR-0003](./0003-single-user-local-first.md)).
- Volume de dados pequeno: dezenas de milhares de cards no pior caso.
- A complexidade real está no **domínio** (agendamento, métricas de retenção),
  não em infraestrutura ou escala.
- Projeto mantido por uma pessoa. Tempo gasto em *plumbing* é tempo não gasto no produto.

## Decisão

**Next.js 15 (App Router) + TypeScript `strict` + Prisma + SQLite → Postgres.**

Mutações via **Server Actions**, sem camada REST manual.

## Alternativas consideradas

### Python/FastAPI + React (SPA separada)
Rejeitado. Dois projetos, dois deploys, e um contrato de API que precisa ser mantido
manualmente sincronizado entre back e front. O custo é justificável quando há um time
separado ou processamento pesado em Python — nenhum dos dois é o caso aqui.

### Vite + SPA + backend separado
Rejeitado pelo mesmo motivo, sem o ganho de ecossistema que o Python traria.

### Local-first puro (Electron/Tauri + SQLite embutido)
Tentador para um app single-user, e resolveria sozinho o requisito de privacidade.
Rejeitado por **custo de distribuição**: builds por plataforma, assinatura de binário,
mecanismo de auto-update. Next.js rodando local (`npm run dev`) entrega hoje o mesmo
benefício de privacidade com uma fração do esforço — e mantém aberta a porta para
deploy web depois, sem reescrever.

## Consequências

**Positivas**
- Um único projeto, um único deploy, tipos de domínio compartilhados entre servidor e UI.
- Prisma dá migrations versionadas e tipos gerados do schema — o modelo de domínio vira
  código verificado pelo compilador, não convenção.
- SQLite em dev e Postgres em produção com o mesmo `schema.prisma`: troca só a env var.
- Caminho de evolução claro se um dia virar multiusuário.

**Negativas / riscos aceitos**
- Acoplamento ao ecossistema Next.js e ao modelo de Server Actions.
- Server Actions ainda evoluem entre versões maiores do Next — pode exigir ajuste em
  upgrades. Aceitável: a superfície de uso é pequena e concentrada.
- Diferenças de dialeto SQLite/Postgres podem aparecer em queries de métrica mais
  complexas. Mitigação: manter as agregações no Prisma Client sempre que possível e
  testar as queries de métrica.
