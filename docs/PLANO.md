# Plataforma de Estudos — Plano de Produto e Arquitetura

> Status: **aprovado para implementação** · Última atualização: 2026-09-03
>
> Este documento é a fonte de verdade sobre *o que* estamos construindo e *por quê*.
> Decisões técnicas pontuais ficam em [`docs/adr/`](./adr).

---

## 1. Problema

O problema não é falta de material. É **excesso**.

Diante de um volume grande de informação — um curso de 80 horas, um livro de 600
páginas, uma ementa de concurso, uma base de código nova — três coisas travam ao
mesmo tempo:

1. **Não dá para saber por onde começar.** Tudo parece igualmente importante, então
   nada é priorizado e o estudo vira leitura linear até cansar.
2. **O volume impede a compreensão.** A memória de trabalho é limitada. Ao tentar
   engolir blocos grandes de uma vez, o esforço vai todo para *processar* e sobra zero
   para *entender*. A sensação é de reler a mesma página três vezes sem absorver nada.
3. **O que foi entendido evapora.** Sem revisão planejada, o entendimento conquistado
   com esforço some em semanas.

As ferramentas existentes atacam só um pedaço disso:

- **Repositórios de conteúdo** (Notion, Obsidian, pastas de PDF): ótimos para guardar,
  péssimos para decompor e para lembrar. O material acumula e o volume só cresce.
- **Apps de flashcard** (Anki): ótimos para lembrar, mas assumem que você já entendeu
  e já quebrou o conteúdo em perguntas. Não ajudam em nada na parte difícil — sair de
  600 páginas para um conjunto de unidades compreensíveis.

O resultado é o mesmo nos dois casos: sensação de produtividade sem entendimento real.

## 2. Princípio central

**Esta plataforma existe para transformar volume em entendimento, e entendimento em
memória de longo prazo.**

A pergunta que ela responde todo dia é:

> *"Tenho mais material do que consigo absorver.
> O que eu estudo agora, e o que reviso hoje para não esquecer?"*

Toda funcionalidade proposta é avaliada contra essa pergunta. Se não ajuda a
responder, fica fora do escopo.

Note que a pergunta tem **duas metades**, e as duas importam:

| Metade | Problema | Mecanismo |
|---|---|---|
| *"o que eu estudo agora"* | Volume e compreensão | Decomposição, priorização, elaboração |
| *"o que reviso hoje"* | Esquecimento | Recuperação ativa + repetição espaçada |

Um app que só resolve a segunda metade é um Anki com nome diferente.

## 3. Fundamentos pedagógicos

Quatro princípios com evidência empírica sólida, na ordem em que atuam no fluxo de
estudo. Cada um vira uma restrição concreta de produto — não é filosofia decorativa.

### 3.1 Decomposição (*chunking* / carga cognitiva)

A memória de trabalho processa poucos itens por vez. Material apresentado em blocos
grandes consome toda a capacidade disponível em *processar a estrutura*, sem sobrar
nada para *compreender o conteúdo*. Quebrar o material em unidades pequenas e
autocontidas é o que torna o volume tratável.

**Consequência de produto:** nenhum recurso grande entra direto no fluxo de estudo.
Todo material passa por uma etapa explícita de **triagem e decomposição** — o usuário
quebra o livro/curso em Módulos antes de estudar. O app trata "600 páginas não
decompostas" como um item pendente na caixa de entrada, não como progresso.

Como corolário: **priorização é obrigatória.** Quando há mais material do que tempo,
tratar tudo como igualmente importante é o mesmo que não priorizar. Cada Módulo é
classificado como **essencial**, **importante** ou **complementar** — e a ordem de
estudo respeita isso.

### 3.2 Elaboração (*efeito de geração* / auto-explicação)

Reformular uma ideia com as próprias palavras e explicá-la a si mesmo produz
entendimento muito mais profundo do que consumir a explicação pronta. É no esforço de
reescrever que as lacunas aparecem.

**Consequência de produto:** um Módulo só é marcado como **compreendido** quando tem
uma Nota escrita pelo usuário. Não existe atalho de "assisti à aula, logo entendi".
A Nota é a evidência de compreensão — e é dela que os cards nascem.

### 3.3 Recuperação ativa (*active recall*)

O ato de **tentar lembrar** é o que consolida a memória, não a releitura. Reler é a
técnica de estudo mais popular e uma das menos eficazes.

**Consequência de produto:** conteúdo compreendido precisa gerar *cards*. Não existe
botão "marcar como lido" que conte como domínio. O progresso em um módulo é medido
pela capacidade de responder às perguntas dele, não pelo tempo passado olhando.

### 3.4 Repetição espaçada e intercalação

Revisar no limiar do esquecimento maximiza a retenção por unidade de esforço — cedo
demais é desperdício, tarde demais é reaprender do zero. E misturar tópicos numa mesma
sessão supera estudar em blocos isolados, mesmo parecendo subjetivamente pior.

**Consequência de produto:** a fila diária é **calculada, não montada à mão** (o
algoritmo escolhe, não o usuário — ver [ADR-0002](./adr/0002-fsrs-como-algoritmo-de-agendamento.md))
e **mistura** cards de trilhas diferentes por padrão. Existe um modo "focar em um
módulo" para quando se está aprendendo algo novo, mas não é o padrão da revisão.

---

## 4. Modelo de domínio

```
Caixa de entrada  →  material capturado, ainda não decomposto
                     (é aqui que o volume bruto espera triagem)

Área              (Programação, Idiomas, Concursos…)
 └── Trilha       (objetivo + prazo + ordem dos módulos)
      └── Módulo  (unidade temática pequena e autocontida)
           │      + prioridade: essencial | importante | complementar
           │      + estado de compreensão (ver abaixo)
           │      + pré-requisitos (outros módulos)
           ├── Recurso  (material de origem + progresso de consumo)
           ├── Nota     (markdown — evidência de compreensão)
           └── Card     (unidade de revisão + estado FSRS)
                └── Review  (log imutável: nota 1–4, intervalo, dificuldade, data)

Sessão   (pomodoro: início, fim, módulos tocados, cards revisados)
Meta     (ex.: 30 cards/dia, 5h/semana) → alimenta streak e métricas
```

### 4.1 Estado de compreensão do Módulo

O ciclo de vida de um módulo é explícito — é o que dá visibilidade de progresso dentro
de um volume grande de material:

```
não iniciado → em estudo → compreendido → em fixação → dominado
                             (tem Nota)   (tem Cards)  (cards maduros)
```

Isso responde, a qualquer momento: *"desse curso de 80 horas, o que eu já entendi de
verdade, o que só li, e o que nem comecei?"* — que é a pergunta que o volume torna
impossível de responder de cabeça.

### 4.2 Decisões de modelagem que importam

**A caixa de entrada é uma entidade de primeira classe.**
Material capturado e não decomposto **não** conta como progresso e fica visível como
dívida. É o antídoto contra a pasta de PDFs que só cresce.

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

**Módulos têm pré-requisitos entre si.**
Estudar na ordem errada é uma das causas de "não estou entendendo". O grafo de
pré-requisitos permite ao app sugerir o próximo módulo *estudável*, não só o próximo
da lista.

**Trilha tem objetivo e prazo obrigatórios.**
"Estudar Go" não é trilha. "Conseguir escrever uma API em Go até dezembro" é. Sem
objetivo, não há critério de conclusão e a trilha vira lista infinita — exatamente o
problema que viemos resolver.

---

## 5. Fluxos de uso

### 5.1 Capturar
Jogar o material na caixa de entrada: link, livro, curso, PDF. Rápido e sem fricção —
capturar não exige decidir nada. Só não conta como progresso.

### 5.2 Triar e decompor — **o fluxo que ataca o volume**
Pegar um item da caixa de entrada e quebrá-lo:
1. A que Área/Trilha isso pertence? (ou é descartável?)
2. Quebrar em **Módulos** pequenos e autocontidos.
3. Classificar cada módulo: **essencial · importante · complementar**.
4. Marcar pré-requisitos entre eles.

Ao fim, um item opaco de 600 páginas virou uma lista ordenada e priorizada de unidades
estudáveis. Esse é o momento em que "volume" vira "plano".

### 5.3 Estudar (compreender)
Abrir o Módulo → consumir o Recurso → **escrever uma Nota com as próprias palavras**.
Ao salvar a nota, o módulo passa a *compreendido*. Em seguida, selecionar trechos da
nota e transformá-los em Cards (pergunta/resposta ou *cloze*).

### 5.4 Revisar — **o fluxo mais frequente**
A home mostra a fila do dia. Para cada card:
1. Pergunta aparece sozinha.
2. Usuário tenta lembrar (sem atalho para pular direto).
3. Revela a resposta.
4. Auto-avalia: **De novo · Difícil · Bom · Fácil**.
5. FSRS reagenda e vai para o próximo.

Esse fluxo precisa ser rápido, teclável (1–4 e espaço) e sem fricção. É onde o
usuário passa a maior parte do tempo no app.

### 5.5 Acompanhar
Dashboard com as duas metades da pergunta central:

**Compreensão (volume)**
- Módulos por estado, por trilha — quanto do material já virou entendimento;
- Itens parados na caixa de entrada (dívida de triagem);
- Próximo módulo sugerido (essencial + pré-requisitos satisfeitos).

**Retenção (memória)**
- Streak de dias com a fila zerada;
- Previsão de carga dos próximos 30 dias (evita a bola de neve do Anki);
- Retenção por área (% de acerto em cards maduros);
- Tempo investido por área, vindo das sessões.

---

## 6. Arquitetura

**Next.js 16 (App Router) + TypeScript + Prisma 7 + SQLite → Postgres.**
Justificativa completa em [ADR-0001](./adr/0001-stack-nextjs-typescript-prisma.md).

| Camada | Escolha | Motivo |
|---|---|---|
| Framework | Next.js 16, App Router | Um projeto, um deploy, tipos compartilhados front/back |
| Linguagem | TypeScript (`strict`) | O modelo de domínio tem invariantes que o compilador segura |
| Mutações | Server Actions | Sem camada REST manual para um app single-user |
| ORM | Prisma | Migrations versionadas, tipos gerados do schema |
| Banco | SQLite (dev) → Postgres (prod) | Mesmo schema; troca só a env var |
| SRS | [`ts-fsrs`](https://github.com/open-spaced-repetition/ts-fsrs) (MIT) | Implementação de referência do FSRS — não reimplementar |
| UI | Tailwind | Sem gastar tempo em CSS |
| Testes | Vitest | Foco na lógica de agendamento e nas queries de métrica |

### Estrutura de pastas prevista

```
app/            rotas (dashboard, revisar, trilhas, módulos, entrada)
lib/srs/        agendamento FSRS + testes  ← núcleo de retenção
lib/estudo/     estado de compreensão, priorização, próximo módulo  ← núcleo de volume
lib/db/         Prisma client + queries de métrica
prisma/         schema.prisma + migrations + seed (dados fictícios)
components/     UI
docs/           este plano + ADRs
```

`lib/srs/` e `lib/estudo/` são as partes com **cobertura de teste obrigatória**. Se o
agendamento ou a ordenação de módulos estiverem errados, todo o resto é decoração.
`lib/db/revisao.integracao.test.ts` cobre a transação de escrita contra um SQLite
temporário — é o que os testes de unidade não alcançam.

---

## 7. Roadmap

Cada fase é um PR próprio para `main`, com critério de pronto verificável.

| Fase | Entrega | Critério de pronto |
|---|---|---|
| **0** | Plano + ADRs | PR revisado e mergeado ✅ |
| **1** | Scaffold Next.js, Prisma, CI, `.gitignore`, `.env.example` | `npm run build` e testes verdes ✅ |
| **2** | **Fatia vertical**: criar módulo → criar card → revisar com FSRS | O loop completo funciona de ponta a ponta ✅ |
| **3** | **Decomposição**: caixa de entrada, triagem, prioridade, pré-requisitos, estados | Quebrar um recurso grande num plano de estudo priorizado |
| **4** | **Elaboração**: notas em markdown, card a partir de trecho da nota | Módulo vira *compreendido* ao ter nota; cards nascem dela |
| **5** | Dashboard: compreensão + retenção + previsão de carga | Gráficos com dados reais do histórico |
| **6** | Import/export JSON, busca, sessões pomodoro | Dados portáveis, sem lock-in |

**A Fase 2 prova que o loop fecha; a Fase 3 é a que ataca o problema real.** A ordem é
essa porque um loop de revisão quebrado inviabiliza tudo que vem depois — mas se
pararmos na Fase 2, teremos só mais um app de flashcard.

### Fora de escopo (por enquanto)
Multiusuário, app mobile nativo, compartilhamento de baralhos, gamificação com
pontos/badges.

**Geração automática de cards por IA** também fica de fora — e essa merece explicação,
porque é a mais tentadora quando o problema é volume. O motivo é o §3.2: **é no esforço
de formular a pergunta que o entendimento acontece.** Terceirizar isso devolve o volume
ao usuário em outro formato (agora são 400 cards que ele não escreveu e não entende) e
desfaz justamente o mecanismo que faz a ferramenta funcionar. Se um dia entrar, será
como *assistente de decomposição* na triagem — sugerir como quebrar um sumário em
módulos —, nunca gerando o conteúdo das perguntas.

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
