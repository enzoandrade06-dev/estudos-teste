'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { comoPrioridade } from '@/lib/estudo/prioridade'
import { agendar, novoEstado, type Nota } from '@/lib/srs/agendamento'
import { prisma } from '@/lib/db'

function texto(dados: FormData, campo: string): string {
  const valor = dados.get(campo)
  return typeof valor === 'string' ? valor.trim() : ''
}

function exigir(dados: FormData, campo: string, rotulo: string): string {
  const valor = texto(dados, campo)
  if (!valor) throw new Error(`${rotulo} é obrigatório.`)
  return valor
}

/**
 * Aplica uma revisão: avança o estado do card e grava o log.
 *
 * Os dois acontecem na mesma transação de propósito — se o card avançasse sem o
 * log, perderíamos a capacidade de re-simular o histórico (PLANO.md §4.2).
 */
export async function revisarCard(cardId: string, nota: Nota) {
  if (![1, 2, 3, 4].includes(nota)) throw new Error('Nota inválida.')

  const card = await prisma.card.findUnique({ where: { id: cardId } })
  if (!card) throw new Error('Card não encontrado.')

  const { estado, registro } = agendar(card, nota)

  await prisma.$transaction([
    prisma.card.update({ where: { id: cardId }, data: estado }),
    prisma.review.create({ data: { cardId, ...registro } }),
  ])

  revalidatePath('/')
  revalidatePath('/revisar')
}

export async function criarArea(dados: FormData) {
  const nome = exigir(dados, 'nome', 'O nome da área')

  await prisma.area.upsert({ where: { nome }, update: {}, create: { nome } })
  revalidatePath('/trilhas')
}

export async function criarTrilha(dados: FormData) {
  const areaId = exigir(dados, 'areaId', 'A área')
  const titulo = exigir(dados, 'titulo', 'O título')
  // Objetivo é obrigatório por decisão de produto: sem critério de conclusão,
  // a trilha vira lista infinita (PLANO.md §4.2).
  const objetivo = exigir(dados, 'objetivo', 'O objetivo')
  const prazoBruto = texto(dados, 'prazo')

  await prisma.trilha.create({
    data: { areaId, titulo, objetivo, prazo: prazoBruto ? new Date(prazoBruto) : null },
  })
  revalidatePath('/trilhas')
}

export async function criarModulo(dados: FormData) {
  const trilhaId = exigir(dados, 'trilhaId', 'A trilha')
  const titulo = exigir(dados, 'titulo', 'O título')
  const prioridade = comoPrioridade(texto(dados, 'prioridade'))

  const ultimo = await prisma.modulo.findFirst({
    where: { trilhaId },
    orderBy: { ordem: 'desc' },
    select: { ordem: true },
  })

  await prisma.modulo.create({
    data: { trilhaId, titulo, prioridade, ordem: (ultimo?.ordem ?? -1) + 1 },
  })
  revalidatePath('/trilhas')
}

export async function criarCard(dados: FormData) {
  const moduloId = exigir(dados, 'moduloId', 'O módulo')
  const frente = exigir(dados, 'frente', 'A pergunta')
  const verso = exigir(dados, 'verso', 'A resposta')

  await prisma.card.create({ data: { moduloId, frente, verso, ...novoEstado() } })

  revalidatePath(`/modulos/${moduloId}`)
  revalidatePath('/')
}

export async function excluirCard(dados: FormData) {
  const id = exigir(dados, 'id', 'O card')
  const card = await prisma.card.delete({ where: { id } })

  revalidatePath(`/modulos/${card.moduloId}`)
  revalidatePath('/')
}

export async function irParaModulo(dados: FormData) {
  redirect(`/modulos/${exigir(dados, 'moduloId', 'O módulo')}`)
}
