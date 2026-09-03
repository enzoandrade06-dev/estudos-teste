# Plataforma de Estudos — Plano de Produto e Arquitetura

> Status: **aprovado para implementação** · Última atualização: 2026-09-03
>
> Este documento é a fonte de verdade sobre *o que* estamos construindo e *por quê*.
> Decisões técnicas pontuais ficam em [`docs/adr/`](./adr).

---

## 1. Problema

Ferramentas de estudo geralmente falham em um de dois extremos:

- **Repositórios de conteúdo** (Notion, Obsidian, pastas de PDF): ótimos para guardar,
  péssimos para lembrar. O material acumula e nada garante que você revisite.
- **Apps de flashcard puros** (Anki): ótimos para lembrar, mas desconectados do
  material de origem. Você tem 3.000 cards e nenhuma noção de progresso em um assunto.

O resultado é o mesmo nos dois casos: sensação de produtividade sem retenção real.

## 2. Princípio central

**Esta plataforma é um motor de revisão, não um repositório de conteúdo.**

A pergunta que ela responde todo dia é:

> *"O que eu preciso revisar hoje para não esquecer, e o que estudo de novo?"*

Toda funcionalidade proposta é avaliada contra essa pergunta. Se não ajuda a
responder, fica fora do escopo.

## 3. Fundamentos pedagógicos

Três princípios com evidência empírica sólida. Cada um vira uma restrição concreta
de produto — não é filosofia decorativa.

### 3.1 Recuperação ativa (*active recall*)

O ato de **tentar lembrar** é o que consolida a memória, não a releitura. Reler é a
técnica de estudo mais popular e uma das menos eficazes.

**Consequência de produto:** todo conteúdo estudado precisa gerar *cards*. Não existe
botão "marcar como lido" que conte como progresso. O progresso em um módulo é medido
pela sua capacidade de responder às perguntas dele, não pelo tempo que passou olhando.

### 3.2 Repetição espaçada (*spaced repetition*)

Revisar no limiar do esquecimento maximiza a retenção por unidade de esforço.
Revisar cedo demais é desperdício; tarde demais é reaprender do zero.

**Consequência de produto:** a fila diária é **calculada, não montada à mão**. O
usuário não escolhe o que revisar — o algoritmo escolhe. Ver [ADR-0002](./adr/0002-fsrs-como-algoritmo-de-agendamento.md).

### 3.3 Intercalação (*interleaving*)

Misturar tópicos diferentes numa mesma sessão supera estudar em blocos isolados,
mesmo que subjetivamente pareça mais difícil e menos eficiente.

**Consequência de produto:** a fila diária **mistura** cards de trilhas diferentes por
padrão, em vez de agrupar por matéria. Existe um modo "focar em um módulo" para quando
o usuário está aprendendo algo novo, mas não é o padrão da revisão.

---

## 4. Modelo de domínio

```
Área              (Programação, Idiomas, Concursos…)
 └── Trilha       (objetivo + prazo + pré-requisitos + ordem dos módulos)
      └── Módulo  (unidade temática: "Ponteiros", "Pretérito imperfeito")
           ├── Recurso  (livro / vídeo / artigo + progresso de consumo)
           ├── Nota     (markdown — o que você entendeu, com suas palavras)
           └── Card     (unidade de revisão + estado FSRS)
                └── Review  (log imutável: nota 1–4, intervalo, dificuldade, data)

Sessão   (pomodoro: início, fim, módulos tocados, cards revisados)
Meta     (ex.: 30 cards/dia, 5h/semana) → alimenta streak e métricas
```

### Decisões de modelagem que importam

**O Card é a unidade atômica, sempre ligado a um Módulo.**
É isso que permite responder *"minha retenção em Redes de Computadores é 72%"* sem
processamento extra. Um card órfão não existe no modelo.

**Review é append-only.**
Nunca sobrescrevemos histórico de revisão. Cada revisão é uma linha nova. Isso custa
espaço (irrelevante nessa escala) e compra três coisas:
- gráficos honestos de evolução ao longo do tempo;
- possibilidade de trocar de algoritmo depois e **re-simular** o histórico inteiro;
- diagnóstico de cards problemáticos ("esse eu erro sempre").

**Nota e Card são entidades separadas.**
A Nota serve para *entender*; o Card serve para *lembrar*. Misturar os dois é o erro
clássico que transforma o app num bloco de notas com timer. A ponte entre eles é a
ação de criar card a partir de um trecho selecionado da nota.

**Trilha tem objetivo e prazo obrigatórios.**
"Estudar Go" não é trilha. "Conseguir escrever uma API em Go até dezembro" é. Sem
objetivo, não há critério de conclusão e a trilha vira lista infinita.

---

## 5. Fluxos de uso

### 5.1 Onboarding
Criar Área → criar Trilha (objetivo + prazo) → adicionar Módulos na ordem de estudo.
Nenhum cadastro, nenhum login. Abre e usa. Ver [ADR-0003](./adr/0003-single-user-local-first.md).

### 5.2 Estudar (aprender algo novo)
Abrir Módulo → consumir Recurso → escrever Nota com as próprias palavras →
selecionar trechos da nota e transformar em Cards (pergunta/resposta ou *cloze*).

### 5.3 Revisar — **o fluxo principal**
A home **é** a fila do dia. Para cada card:
1. Pergunta aparece sozinha.
2. Usuário tenta lembrar (sem atalho para pular direto).
3. Revela a resposta.
4. Auto-avalia: **De novo · Difícil · Bom · Fácil**.
5. FSRS reagenda e vai para o próximo.

Esse fluxo precisa ser rápido, teclável (1–4 e espaço) e sem fricção. É onde o
usuário passa 90% do tempo no app.

### 5.4 Acompanhar
Dashboard com:
- **Streak** de dias com a fila zerada;
- **Previsão de carga** dos próximos 30 dias (evita a bola de neve do Anki);
- **Retenção por área** (% de acertos em cards maduros);
- **Cards em aprendizado vs. maduros** por trilha;
- **Tempo investido** por área, vindo das sessões.

---

## 6. Arquitetura

**Next.js 15 (App Router) + TypeScript + Prisma + SQLite → Postgres.**
Justificativa completa em [ADR-0001](./adr/0001-stack-nextjs-typescript-prisma.md).

| Camada | Escolha | Motivo |
|---|---|---|
| Framework | Next.js 15, App Router | Um projeto, um deploy, tipos compartilhados front/back |
| Linguagem | TypeScript (`strict`) | O modelo de domínio tem invariantes que o compilador segura |
| Mutações | Server Actions | Sem camada REST manual para um app single-user |
| ORM | Prisma | Migrations versionadas, tipos gerados do schema |
| Banco | SQLite (dev) → Postgres (prod) | Mesmo schema; troca só a env var |
| SRS | [`ts-fsrs`](https://github.com/open-spaced-repetition/ts-fsrs) (MIT) | Implementação de referência do FSRS — não reimplementar |
| UI | Tailwind + shadcn/ui | Componentes acessíveis sem gastar tempo em CSS |
| Testes | Vitest | Foco na lógica de agendamento e nas queries de métrica |

### Estrutura de pastas prevista

```
app/            rotas (dashboard, revisar, trilhas, notas)
lib/srs/        agendamento FSRS + testes  ← o núcleo do produto
lib/db/         Prisma client + queries de métrica
prisma/         schema.prisma + migrations + seed (dados fictícios)
components/     UI
docs/           este plano + ADRs
```

`lib/srs/` é a única parte com **cobertura de teste obrigatória**. Se o agendamento
estiver errado, todo o resto é decoração.

---

## 7. Roadmap

Cada fase é um PR próprio para `main`, com critério de pronto verificável.

| Fase | Entrega | Critério de pronto |
|---|---|---|
| **0** | Este plano + ADRs | PR revisado e mergeado ✅ *(atual)* |
| **1** | Scaffold Next.js, Prisma, CI (lint + test), `.gitignore`, `.env.example` | `npm run build` e testes verdes no CI |
| **2** | **Núcleo SRS**: modelo, criar card, fila diária, revisar, testes do FSRS | Revisar 20 cards com reagendamento correto e verificável |
| **3** | Trilhas, módulos, recursos, notas em markdown, card a partir da nota | Montar uma trilha completa e estudar por ela |
| **4** | Dashboard: streak, retenção, previsão de carga | Gráficos com dados reais do histórico |
| **5** | Import/export JSON, busca, sessões pomodoro | Dados portáveis, sem lock-in |

**A Fase 2 é a que prova o produto.** Se a experiência de revisão não for boa, o resto
não importa. As fases 3+ só fazem sentido depois que revisar for prazeroso.

### Fora de escopo (por enquanto)
Multiusuário, app mobile nativo, geração de cards por IA, compartilhamento de baralhos,
gamificação com pontos/badges. Nenhum desses ajuda a responder a pergunta central da
Seção 2 — e cada um deles é um projeto por si só.

---

## 8. Repositório público — cuidados com dados sensíveis

Este repositório é **público**. As regras abaixo valem para todo PR:

- **Nenhum segredo commitado.** `.env*` no `.gitignore`, exceto `.env.example` —
  que contém apenas *nomes* de variáveis e valores placeholder óbvios.
- **Nenhum dado pessoal real.** O seed usa conteúdo fictício. Anotações de estudo
  reais ficam no banco local, que é ignorado pelo git (`*.db`, `*.sqlite`).
- **Sem telemetria e sem analytics de terceiros.** Nada sai da máquina do usuário.
- **Autenticação:** não existe na v1 por design (single-user local). Se um dia entrar,
  será via Auth.js com provider OAuth — sem armazenar senha em banco próprio.
- **Recomendado no GitHub:** ativar *secret scanning* e *push protection* em
  Settings → Code security. Bloqueia vazamento acidental de credenciais no push.

## 9. Fluxo de trabalho no git

```
branch de fase  →  PR para main  →  squash merge  →  branch deletada
```

Squash merge mantém o histórico da `main` legível: **um commit por fase entregue**.
O detalhe do desenvolvimento fica no PR, que permanece consultável.
