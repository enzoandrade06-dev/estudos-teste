# ADR-0002 — FSRS como algoritmo de agendamento

- **Status:** aceito
- **Data:** 2026-09-03

## Contexto

O agendamento das revisões é o **núcleo do produto** ([PLANO.md §3.2](../PLANO.md)).
Se ele estiver errado, o usuário revisa cedo demais (desperdício) ou tarde demais
(reaprende do zero) — e nos dois casos o app não entrega o que promete.

## Decisão

Usar **FSRS** (Free Spaced Repetition Scheduler) através da biblioteca
[`ts-fsrs`](https://github.com/open-spaced-repetition/ts-fsrs), licença MIT.

**Não reimplementar o algoritmo.** A implementação de referência é mantida pelos
autores do FSRS e testada contra datasets reais de revisão.

## Alternativas consideradas

### SM-2 (o algoritmo clássico do Anki)
Rejeitado. É mais simples de entender e implementar, mas modela a memória com um único
fator de facilidade. O FSRS modela **estabilidade** e **dificuldade** separadamente e é
ajustado sobre dados empíricos de revisão em larga escala — entrega retenção
comparável com menos revisões. Para um produto cuja tese é "revisar no momento certo",
usar o algoritmo pior de propósito não se sustenta.

### Implementar FSRS do zero
Rejeitado. Nenhum ganho e vários riscos: os pesos e a fórmula de estabilidade têm
sutilezas que só aparecem em casos de borda (lapsos, cards muito maduros, intervalos
longos). Bug aqui é silencioso — o usuário só descobre meses depois, esquecendo coisas.

### Intervalos fixos (1d, 3d, 7d, 30d…)
Rejeitado. Ignora a dificuldade individual de cada card e o desempenho do usuário.
Simples, previsível e ineficaz.

## Consequências

**Positivas**
- Agendamento com qualidade de estado da arte desde o primeiro dia.
- Menos revisões para a mesma retenção → menos chance de abandono por sobrecarga.
- Curva de aprendizado do algoritmo terceirizada para quem o mantém.

**Negativas / riscos aceitos**
- Dependência externa no caminho crítico do produto. **Mitigação:** `Review` é
  append-only ([PLANO.md §4](../PLANO.md)); se for preciso trocar de algoritmo, o
  histórico completo permite re-simular e reagendar todos os cards.
- O estado do FSRS (estabilidade, dificuldade, `state`) precisa ser persistido por card
  e migrado se a lib mudar o formato. **Mitigação:** guardar esse estado em colunas
  explícitas do schema, não em JSON opaco.

## Nota de implementação

`lib/srs/` é a única parte do código com **cobertura de teste obrigatória**. Os testes
verificam a nossa integração — sequências de revisão, casos de borda de fuso horário,
construção da fila diária — não o algoritmo em si, que já é testado upstream.
