import type { AiOutput } from './ai'
import { isDemoMode } from './firebase'
import type { Assignment, CrisisReport, GeoPointLite, NeedCategory, Volunteer } from './types'

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db, ensureSignedIn } from './firebase'

const LS_REPORTS = 'reliefsync.reports.v1'
const LS_ASSIGNMENTS = 'reliefsync.assignments.v1'

function now() {
  return Date.now()
}

function genId(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`
}

function readLs<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeLs(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

export async function createReport(input: {
  source: CrisisReport['source']
  reporterName?: string
  language?: string
  rawText: string
  location: GeoPointLite
}): Promise<CrisisReport> {
  const report: CrisisReport = {
    id: genId('r'),
    createdAt: now(),
    source: input.source,
    reporterName: input.reporterName,
    language: input.language,
    rawText: input.rawText,
    location: input.location,
    status: 'new',
  }

  if (isDemoMode || !db) {
    const reports = readLs<CrisisReport[]>(LS_REPORTS, [])
    reports.unshift(report)
    writeLs(LS_REPORTS, reports)
    return report
  }

  await ensureSignedIn()
  const col = collection(db, 'reports')
  const docRef = await addDoc(col, report)
  await updateDoc(docRef, { id: docRef.id })
  return { ...report, id: docRef.id }
}

export async function listReports(): Promise<CrisisReport[]> {
  if (isDemoMode || !db) return readLs<CrisisReport[]>(LS_REPORTS, [])

  await ensureSignedIn()
  const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(50))
  const snap = await getDocs(q)
  return snap.docs.map((d) => d.data() as CrisisReport)
}

export async function getReport(reportId: string): Promise<CrisisReport | null> {
  if (isDemoMode || !db) {
    return readLs<CrisisReport[]>(LS_REPORTS, []).find((r) => r.id === reportId) ?? null
  }

  await ensureSignedIn()
  const snap = await getDoc(doc(db, 'reports', reportId))
  return snap.exists() ? (snap.data() as CrisisReport) : null
}

export async function attachAiOutput(reportId: string, ai: AiOutput) {
  if (isDemoMode || !db) {
    const reports = readLs<CrisisReport[]>(LS_REPORTS, [])
    const idx = reports.findIndex((r) => r.id === reportId)
    if (idx >= 0) {
      reports[idx] = { ...reports[idx], ai }
      writeLs(LS_REPORTS, reports)
    }
    return
  }

  await ensureSignedIn()
  await updateDoc(doc(db, 'reports', reportId), { ai })
}

export async function createAssignment(input: {
  report: CrisisReport
  volunteer: Volunteer
  category: NeedCategory
  distanceKm: number
}): Promise<Assignment> {
  const a: Assignment = {
    id: genId('a'),
    reportId: input.report.id,
    createdAt: now(),
    category: input.category,
    urgency: input.report.ai?.urgency ?? 'normal',
    volunteerId: input.volunteer.id,
    volunteerName: input.volunteer.name,
    distanceKm: input.distanceKm,
    status: 'assigned',
  }

  if (isDemoMode || !db) {
    const as = readLs<Assignment[]>(LS_ASSIGNMENTS, [])
    as.unshift(a)
    writeLs(LS_ASSIGNMENTS, as)
    const reports = readLs<CrisisReport[]>(LS_REPORTS, [])
    const idx = reports.findIndex((r) => r.id === input.report.id)
    if (idx >= 0) {
      reports[idx] = { ...reports[idx], status: 'assigned' }
      writeLs(LS_REPORTS, reports)
    }
    return a
  }

  await ensureSignedIn()
  const ref = doc(collection(db, 'assignments'))
  await setDoc(ref, { ...a, id: ref.id })
  await updateDoc(doc(db, 'reports', input.report.id), { status: 'assigned' })
  return { ...a, id: ref.id }
}

export async function getAssignment(assignmentId: string): Promise<Assignment | null> {
  if (isDemoMode || !db) {
    return (
      readLs<Assignment[]>(LS_ASSIGNMENTS, []).find((a) => a.id === assignmentId) ?? null
    )
  }

  await ensureSignedIn()
  const snap = await getDoc(doc(db, 'assignments', assignmentId))
  return snap.exists() ? (snap.data() as Assignment) : null
}

