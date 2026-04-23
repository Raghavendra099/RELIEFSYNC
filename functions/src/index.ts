import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { GoogleGenerativeAI } from '@google/generative-ai'

admin.initializeApp()

type NeedCategory = 'food' | 'medical' | 'shelter' | 'water' | 'rescue' | 'other'
type Urgency = 'urgent' | 'high' | 'normal'

type AiOutput = {
  categories: NeedCategory[]
  urgency: Urgency
  urgencyScore: number
  summary: string
  extracted: Record<string, unknown>
  model: 'gemini' | 'mock'
}

export const api = functions.https.onRequest(async (req, res) => {
  res.set('access-control-allow-origin', '*')
  res.set('access-control-allow-headers', 'content-type')
  if (req.method === 'OPTIONS') return res.status(204).send('')

  const path = (req.path || '/').replace(/\/+$/, '')
  if (path === '' || path === '/') {
    return res.json({ ok: true, endpoints: ['/processReport'] })
  }

  if (path !== '/processReport') return res.status(404).json({ error: 'not_found' })
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' })

  const { rawText, language } = (req.body ?? {}) as { rawText?: string; language?: string }
  if (!rawText || typeof rawText !== 'string') {
    return res.status(400).json({ error: 'rawText_required' })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.json(mockAi(rawText))
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = [
      'You are an emergency triage assistant for NGO crisis reports.',
      'Given a field report, extract:',
      '- categories: array of need categories (food, medical, shelter, water, rescue, other)',
      '- urgencyScore: 0-100',
      '- urgency: urgent/high/normal derived from urgencyScore',
      '- summary: 1-2 lines',
      'Return ONLY valid JSON with keys: categories, urgencyScore, urgency, summary, extracted.',
      language ? `Input language: ${language}` : '',
      `Report: ${rawText}`,
    ]
      .filter(Boolean)
      .join('\n')

    const out = await model.generateContent(prompt)
    const text = out.response.text().trim()

    const parsed = safeJson(text) as Partial<AiOutput>
    const categories = normalizeCategories(parsed.categories)
    const urgencyScore = clampNumber(parsed.urgencyScore ?? 40, 0, 100)
    const urgency = scoreToUrgency(urgencyScore)

    const response: AiOutput = {
      categories,
      urgencyScore,
      urgency,
      summary: String(parsed.summary ?? '').slice(0, 500) || `Needs: ${categories.join(', ')}`,
      extracted: (parsed.extracted as Record<string, unknown>) ?? {},
      model: 'gemini',
    }

    return res.json(response)
  } catch (e) {
    return res.json(mockAi(rawText))
  }
})

function mockAi(rawText: string): AiOutput {
  const t = rawText.toLowerCase()
  const cats = new Set<NeedCategory>()
  if (t.includes('injur') || t.includes('medical') || t.includes('doctor')) cats.add('medical')
  if (t.includes('food') || t.includes('hungry') || t.includes('ration')) cats.add('food')
  if (t.includes('shelter') || t.includes('camp') || t.includes('tent')) cats.add('shelter')
  if (t.includes('water') || t.includes('drinking')) cats.add('water')
  if (t.includes('trapped') || t.includes('rescue') || t.includes('flood') || t.includes('fire'))
    cats.add('rescue')
  if (cats.size === 0) cats.add('other')

  const score = clampNumber(
    15 +
      (t.includes('urgent') ? 30 : 0) +
      (t.includes('asap') ? 25 : 0) +
      (t.includes('immediately') ? 30 : 0) +
      (t.includes('bleeding') ? 35 : 0) +
      (t.includes('trapped') ? 28 : 0),
    0,
    100,
  )

  return {
    categories: Array.from(cats),
    urgencyScore: score,
    urgency: scoreToUrgency(score),
    summary: `Needs: ${Array.from(cats).join(', ')}. Urgency score: ${score}/100.`,
    extracted: {},
    model: 'mock',
  }
}

function safeJson(text: string) {
  const first = text.indexOf('{')
  const last = text.lastIndexOf('}')
  if (first >= 0 && last > first) {
    return JSON.parse(text.slice(first, last + 1))
  }
  return JSON.parse(text)
}

function normalizeCategories(input: unknown): NeedCategory[] {
  const allowed: NeedCategory[] = ['food', 'medical', 'shelter', 'water', 'rescue', 'other']
  const arr = Array.isArray(input) ? input : []
  const out = arr
    .map((x) => String(x).toLowerCase().trim())
    .filter((x): x is NeedCategory => allowed.includes(x as NeedCategory))
  return out.length ? Array.from(new Set(out)) : ['other']
}

function clampNumber(x: unknown, min: number, max: number) {
  const n = typeof x === 'number' ? x : Number(x)
  if (!Number.isFinite(n)) return min
  return Math.max(min, Math.min(max, n))
}

function scoreToUrgency(score: number): Urgency {
  return score >= 80 ? 'urgent' : score >= 55 ? 'high' : 'normal'
}

