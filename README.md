# Plataforma de Estudos

Ferramenta pessoal de estudos que **roda localmente**, feita para um problema
específico: **volume de material grande demais para entender**.

Ela transforma um curso de 80 horas ou um livro de 600 páginas em um plano de estudo
decomposto e priorizado — e depois garante, por repetição espaçada, que o que foi
entendido não evapore.

> **Status atual: Fase 2 — fatia vertical funcionando.**
> Já é possível criar áreas, trilhas, módulos e cards, e revisá-los com agendamento
> FSRS. A decomposição de material volumoso (caixa de entrada, triagem,
> pré-requisitos) e as notas em markdown são as próximas fases.

## Em uma frase

> *"Tenho mais material do que consigo absorver.
> O que eu estudo agora, e o que reviso hoje para não esquecer?"*

Se uma funcionalidade não ajuda a responder essa pergunta, ela está fora de escopo.

## Como funciona

| Etapa | O que resolve |
|---|---|
| **Capturar** | Material bruto entra numa caixa de entrada. Capturar não é progresso. |
| **Decompor** | Quebrar o volume em módulos pequenos, priorizados e com pré-requisitos. |
| **Compreender** | Escrever uma nota com as próprias palavras — a evidência de que entendeu. |
| **Fixar** | Cards nascem da nota; o FSRS agenda a revisão no momento certo. |
| **Acompanhar** | Quanto do material já virou entendimento, e qual a retenção real. |

As duas primeiras etapas são o que diferencia esta ferramenta de um app de flashcards:
elas atacam o volume, não só o esquecimento.

## Documentação

| Documento | Conteúdo |
|---|---|
| **[docs/PLANO.md](docs/PLANO.md)** | Plano de produto e arquitetura — comece por aqui |
| [ADR-0001](docs/adr/0001-stack-nextjs-typescript-prisma.md) | Stack: Next.js + TypeScript + Prisma |
| [ADR-0002](docs/adr/0002-fsrs-como-algoritmo-de-agendamento.md) | FSRS como algoritmo de agendamento |
| [ADR-0003](docs/adr/0003-single-user-local-first.md) | Single-user sem autenticação na v1 |

## Privacidade

O aplicativo é **single-user e roda localmente**. Não há telemetria, analytics de
terceiros ou envio de dados para servidores. As anotações de estudo ficam num banco
SQLite local, ignorado pelo git.

Este repositório é público: nenhum segredo ou dado pessoal real é commitado.
Ver [PLANO.md §8](docs/PLANO.md).

## Rodando localmente

Requer Node 24+.

```bash
npm install
cp .env.example .env      # DATABASE_URL aponta para um SQLite local
npx prisma migrate dev    # cria o banco e aplica as migrations
npm run db:seed           # opcional: dados fictícios para experimentar
npm run dev               # http://localhost:3000
```

> O app **não deve ser exposto publicamente**: não há autenticação por design
> ([ADR-0003](docs/adr/0003-single-user-local-first.md)), então qualquer visitante veria
> e editaria os mesmos dados.

### Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm test` | Testes (agendamento, fila e persistência) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:migrate` | Cria/aplica migrations |
| `npm run db:seed` | Popula com dados fictícios |
| `npm run db:studio` | Abre o Prisma Studio |
| `npm run db:reset` | Zera o banco e reaplica tudo |

## Onde está a lógica que importa

| Caminho | Responsabilidade |
|---|---|
| `lib/srs/agendamento.ts` | Adapta o FSRS ao nosso modelo — o núcleo de retenção |
| `lib/srs/fila.ts` | Monta a fila do dia: intercalação entre módulos + priorização |
| `lib/estudo/prioridade.ts` | Níveis de prioridade e sua ordenação |
| `lib/db/consultas.ts` | Leituras e métricas |
| `app/acoes.ts` | Server Actions (escrita) |

Essas quatro primeiras têm cobertura de teste obrigatória: se o agendamento ou a
ordenação estiverem errados, o resto é decoração.

## Próximos passos

Fase 3 — caixa de entrada, triagem e decomposição de material volumoso. Ver o roadmap
completo em [PLANO.md §7](docs/PLANO.md).
