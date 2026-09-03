# Plataforma de Estudos

Ferramenta pessoal de estudos que **roda localmente**, feita para um problema
específico: **volume de material grande demais para entender**.

Ela transforma um curso de 80 horas ou um livro de 600 páginas em um plano de estudo
decomposto e priorizado — e depois garante, por repetição espaçada, que o que foi
entendido não evapore.

> **Status atual: Fase 0 — planejamento.**
> Ainda não há código. Este repositório contém, por enquanto, apenas o plano de produto
> e as decisões de arquitetura, para revisão antes da implementação começar.

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

## Próximos passos

Fase 1 — scaffold do projeto, Prisma e CI. Ver o roadmap completo em
[PLANO.md §7](docs/PLANO.md).
