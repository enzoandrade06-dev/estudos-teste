/**
 * Seed de desenvolvimento.
 *
 * Conteúdo deliberadamente FICTÍCIO: este repositório é público e nenhuma
 * anotação de estudo real entra no git (PLANO.md §8).
 */
import 'dotenv/config'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '../lib/db/gerado/client.ts'
import { novoEstado } from '../lib/srs/agendamento.ts'

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! }),
})

const TRILHAS = [
  {
    area: 'Programação',
    titulo: 'Fundamentos de bancos de dados relacionais',
    objetivo: 'Modelar e consultar um banco relacional sem depender de ORM',
    modulos: [
      {
        titulo: 'Modelo relacional e chaves',
        prioridade: 'essencial',
        cards: [
          ['O que é uma chave primária?', 'Coluna (ou conjunto) que identifica unicamente cada linha de uma tabela.'],
          ['Para que serve uma chave estrangeira?', 'Referenciar a chave primária de outra tabela, garantindo integridade referencial.'],
        ],
      },
      {
        titulo: 'Índices e planos de execução',
        prioridade: 'essencial',
        cards: [
          ['Por que um índice acelera leituras e desacelera escritas?', 'A busca passa a ser logarítmica em vez de varredura completa, mas toda escrita precisa atualizar a estrutura do índice.'],
        ],
      },
      {
        titulo: 'Normalização até a 3ª forma normal',
        prioridade: 'importante',
        cards: [
          ['O que a 3ª forma normal elimina?', 'Dependências transitivas: atributos que dependem de outro atributo não-chave.'],
        ],
      },
      {
        titulo: 'Histórico dos bancos hierárquicos',
        prioridade: 'complementar',
        cards: [
          ['Que modelo antecedeu o relacional?', 'O modelo hierárquico, em que os dados formam uma árvore de registros pai-filho.'],
        ],
      },
    ],
  },
  {
    area: 'Idiomas',
    titulo: 'Inglês para leitura técnica',
    objetivo: 'Ler documentação e artigos técnicos sem tradutor',
    modulos: [
      {
        titulo: 'Phrasal verbs frequentes em documentação',
        prioridade: 'essencial',
        cards: [
          ['O que significa "roll out" no contexto de software?', 'Lançar ou disponibilizar algo gradualmente para os usuários.'],
          ['O que significa "fall back to"?', 'Recorrer a uma alternativa quando a opção principal falha.'],
        ],
      },
      {
        titulo: 'Voz passiva em textos acadêmicos',
        prioridade: 'importante',
        cards: [
          ['Por que a voz passiva é comum em artigos acadêmicos?', 'Desloca o foco do autor para o processo ou resultado descrito.'],
        ],
      },
    ],
  },
]

async function main() {
  // Ordem inversa das dependências: limpar antes de recriar deixa o seed idempotente.
  await prisma.review.deleteMany()
  await prisma.card.deleteMany()
  await prisma.modulo.deleteMany()
  await prisma.trilha.deleteMany()
  await prisma.area.deleteMany()

  const agora = new Date()

  for (const definicao of TRILHAS) {
    const area = await prisma.area.upsert({
      where: { nome: definicao.area },
      update: {},
      create: { nome: definicao.area },
    })

    const trilha = await prisma.trilha.create({
      data: { areaId: area.id, titulo: definicao.titulo, objetivo: definicao.objetivo },
    })

    for (const [indice, modulo] of definicao.modulos.entries()) {
      const criado = await prisma.modulo.create({
        data: {
          trilhaId: trilha.id,
          titulo: modulo.titulo,
          ordem: indice,
          prioridade: modulo.prioridade,
        },
      })

      for (const [frente, verso] of modulo.cards) {
        await prisma.card.create({
          data: { moduloId: criado.id, frente, verso, ...novoEstado(agora) },
        })
      }
    }
  }

  const cards = await prisma.card.count()
  console.log(`Seed concluído: ${cards} cards fictícios prontos para revisar.`)
}

main()
  .catch((erro) => {
    console.error(erro)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
