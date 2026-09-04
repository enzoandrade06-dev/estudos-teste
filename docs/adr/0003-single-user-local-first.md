# ADR-0003 — Single-user sem autenticação na v1

- **Status:** aceito
- **Data:** 2026-09-03

## Contexto

A plataforma precisa decidir, antes de qualquer código, se o modelo de dados é
multiusuário. Essa decisão contamina praticamente todas as tabelas e queries, então
mudar depois é caro — e assumir multiusuário "por precaução" também tem custo alto,
pago desde o primeiro dia.

O repositório é **público** e o conteúdo de estudo é pessoal.

## Decisão

**V1 é single-user, roda localmente e não tem autenticação.**

Sem cadastro, sem login, sem coluna `userId`. Abre e usa.

## Justificativa

- **Entrega valor mais rápido.** Autenticação, recuperação de senha, sessão e
  isolamento de dados por usuário somam semanas de trabalho que não respondem à
  pergunta central do produto ([PLANO.md §2](../PLANO.md)).
- **Privacidade por construção.** Sem servidor multiusuário, não há banco central com
  anotações de estudo de ninguém. Os dados ficam no SQLite local, ignorado pelo git.
- **Superfície de ataque quase nula** num repositório público. Sem sessão, sem token,
  sem endpoint autenticado, não há credencial para vazar.

## Consequências

**Positivas**
- Modelo de dados e queries significativamente mais simples.
- Zero risco de vazar dados de um usuário para outro — a classe de bug não existe.
- Nenhum segredo de auth no repositório.

**Negativas / riscos aceitos**
- **Sem sincronização entre dispositivos.** Estudar no desktop e no celular não
  funciona na v1. Mitigado parcialmente pelo export/import JSON da Fase 5.
- **Migrar para multiusuário depois exige migration.** Aceito conscientemente: adicionar
  `userId` às tabelas e um backfill apontando para um usuário único é mecânico e de
  baixo risco, ainda mais com o volume de dados envolvido.
- O app **não pode ser deployado publicamente como está** — qualquer visitante veria e
  editaria os mesmos dados. Isso precisa estar claro no README quando o código chegar.

## Gatilho para revisão desta decisão

Reabrir se: (a) surgir necessidade real de estudar em mais de um dispositivo e o
export/import não resolver; ou (b) houver intenção de outras pessoas usarem a
plataforma. Nesse ponto, a decisão vira [ADR-0001](./0001-stack-nextjs-typescript-prisma.md)
+ Auth.js com provider OAuth.
