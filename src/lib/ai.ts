import { env } from './env'
import type { CrisisReport, NeedCategory, Urgency } from './types'

export type AiOutput = NonNullable<CrisisReport['ai']>

export async function processReportAi(input: {
  rawText: string
  language?: string
}): Promise<AiOutput> {
  if (env.VITE_FUNCTIONS_BASE_URL) {
    const res = await fetch(`${env.VITE_FUNCTIONS_BASE_URL}/processReport`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) throw new Error(`AI endpoint failed (${res.status})`)
    return (await res.json()) as AiOutput
  }

  return mockProcess(input.rawText)
}

function mockProcess(text: string): AiOutput {
  const t = text.toLowerCase()
  const categories = new Set<NeedCategory>()

  if (matchAny(t, ['injury', 'injured', 'bleeding', 'doctor', 'medicine', 'medical'])) {
    categories.add('medical')
  }
  if (matchAny(t, ['hungry', 'food', 'ration', 'rice', 'meal'])) categories.add('food')
  if (matchAny(t, ['shelter', 'camp', 'tents', 'homeless', 'evacuate'])) categories.add('shelter')
  if (matchAny(t, ['water', 'drinking', 'thirst', 'bottles'])) categories.add('water')
  if (matchAny(t, ['trapped', 'rescue', 'flood', 'collapsed', 'fire'])) categories.add('rescue')
  if (categories.size === 0) categories.add('other')

  const urgencyScore = computeUrgencyScore(t)
  const urgency: Urgency =
    urgencyScore >= 80 ? 'urgent' : urgencyScore >= 55 ? 'high' : 'normal'

  const summary = buildSummary(Array.from(categories), urgencyScore, text)

  return {
    categories: Array.from(categories),
    urgency,
    urgencyScore,
    summary,
    extracted: {
      signals: {
        urgentWords: urgentSignals(t),
      },
    },
    model: 'mock',
  }
}

function computeUrgencyScore(t: string) {
  let score = 15
  const hits = [
    ['immediately', 30],
    ['urgent', 30],
    ['asap', 25],
    ['critical', 35],
    ['severe', 22],
    ['unconscious', 45],
    ['bleeding', 35],
    ['trapped', 28],
    ['child', 18],
    ['pregnant', 18],
    ['elderly', 16],
    ['no food', 18],
    ['no water', 22],
    ['collapsed', 22],
    ['fire', 26],
    ['flood', 20],
  ] as const

  for (const [w, inc] of hits) {
    if (t.includes(w)) score += inc
  }

  return Math.max(0, Math.min(100, score))
}

function urgentSignals(t: string) {
  const words = ['urgent', 'asap', 'immediately', 'critical', 'help', 'trapped', 'injured']
  return words.filter((w) => t.includes(w))
}

function buildSummary(categories: NeedCategory[], urgencyScore: number, raw: string) {
  const cat = categories.join(', ')
  const short = raw.trim().replace(/\s+/g, ' ').slice(0, 140)
  return `Needs: ${cat}. Urgency score: ${urgencyScore}/100. "${short}${raw.length > 140 ? '…' : ''}"`
}

function matchAny(t: string, words: string[]) {
  return words.some((w) => t.includes(w))
}

