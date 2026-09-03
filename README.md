# Plataforma de Estudos

Uma plataforma pessoal de estudos construída em torno de **repetição espaçada**,
**recuperação ativa** e **intercalação** — focada em aprendizado contínuo e retenção
de longo prazo, não em acumular material.

> **Status atual: Fase 0 — planejamento.**
> Ainda não há código. Este repositório contém, por enquanto, apenas o plano de produto
> e as decisões de arquitetura, para revisão antes da implementação começar.

## Documentação

| Documento | Conteúdo |
|---|---|
| **[docs/PLANO.md](docs/PLANO.md)** | Plano de produto e arquitetura — comece por aqui |
| [ADR-0001](docs/adr/0001-stack-nextjs-typescript-prisma.md) | Stack: Next.js + TypeScript + Prisma |
| [ADR-0002](docs/adr/0002-fsrs-como-algoritmo-de-agendamento.md) | FSRS como algoritmo de agendamento |
| [ADR-0003](docs/adr/0003-single-user-local-first.md) | Single-user sem autenticação na v1 |

## Em uma frase

> *"O que eu preciso revisar hoje para não esquecer, e o que estudo de novo?"*

Se uma funcionalidade não ajuda a responder essa pergunta, ela está fora de escopo.

## Privacidade

O aplicativo é **single-user e roda localmente**. Não há telemetria, analytics de
terceiros ou envio de dados para servidores. As anotações de estudo ficam num banco
SQLite local, ignorado pelo git.

Este repositório é público: nenhum segredo ou dado pessoal real é commitado.
Ver [PLANO.md §8](docs/PLANO.md).

## Próximos passos

Fase 1 — scaffold do projeto, Prisma e CI. Ver o roadmap completo em
[PLANO.md §7](docs/PLANO.md).
