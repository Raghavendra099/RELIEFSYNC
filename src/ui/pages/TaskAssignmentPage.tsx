import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { DEMO_VOLUNTEERS } from '../../lib/demoData'
import { distanceKm } from '../../lib/geo'
import { createAssignment, getReport } from '../../lib/store'
import type { NeedCategory, Volunteer } from '../../lib/types'
import { UrgencyPill } from '../components/UrgencyPill'

export function TaskAssignmentPage() {
  const { reportId } = useParams()
  const qc = useQueryClient()
  const nav = useNavigate()
  const [selectedCategory, setSelectedCategory] = useState<NeedCategory>('other')

  const reportQ = useQuery({
    queryKey: ['report', reportId],
    queryFn: () => (reportId ? getReport(reportId) : Promise.resolve(null)),
    enabled: !!reportId,
  })

  const report = reportQ.data

  const categories = report?.ai?.categories ?? []
  const effectiveCategory = categories.includes(selectedCategory)
    ? selectedCategory
    : categories[0] ?? 'other'

  const suggestions = useMemo(() => {
    if (!report) return []
    const vols = DEMO_VOLUNTEERS.filter((v) => v.available)
    return vols
      .map((v) => ({
        volunteer: v,
        distanceKm: distanceKm(report.location, v.location),
        skillMatch: v.skills.includes(effectiveCategory),
      }))
      .sort((a, b) => {
        if (a.skillMatch !== b.skillMatch) return a.skillMatch ? -1 : 1
        return a.distanceKm - b.distanceKm
      })
      .slice(0, 6)
  }, [report, effectiveCategory])

  const assignM = useMutation({
    mutationFn: async (v: Volunteer) => {
      if (!report) throw new Error('Report not found')
      const d = distanceKm(report.location, v.location)
      return await createAssignment({
        report,
        volunteer: v,
        category: effectiveCategory,
        distanceKm: d,
      })
    },
    onSuccess: async (a) => {
      await qc.invalidateQueries({ queryKey: ['reports'] })
      nav(`/volunteer/${a.id}`)
    },
  })

  if (reportQ.isLoading) {
    return <p className="muted">Loading…</p>
  }

  if (!report) {
    return (
      <div className="card">
        <h2 style={{ margin: 0, fontSize: 16 }}>Report not found</h2>
        <div style={{ height: 10 }} />
        <Link className="btn" to="/dashboard">
          Back to dashboard
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="pageHeader">
        <div>
          <h2>Task assignment</h2>
          <p>AI output + volunteer suggestions by skill and distance.</p>
        </div>
        <div className="row">
          <Link className="btn" to="/dashboard">
            Back
          </Link>
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div className="row">
              <UrgencyPill urgency={report.ai?.urgency ?? 'unscored'} />
              <span className="pill">{(report.ai?.categories ?? []).join(', ') || 'unclassified'}</span>
            </div>
            <span className="muted">{new Date(report.createdAt).toLocaleString()}</span>
          </div>

          <div style={{ height: 12 }} />

          <div className="listItem">
            <div className="muted">Original report</div>
            <div style={{ marginTop: 6, fontSize: 13 }}>{report.rawText}</div>
          </div>

          <div style={{ height: 12 }} />

          <div className="listItem">
            <div className="muted">AI processed output</div>
            <div style={{ marginTop: 6, fontSize: 13 }}>
              <div>Summary: {report.ai?.summary ?? '—'}</div>
              <div style={{ height: 6 }} />
              <div>Urgency score: {report.ai?.urgencyScore ?? '—'}</div>
              <div style={{ height: 6 }} />
              <div>Model: {report.ai?.model ?? '—'}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, fontSize: 14 }}>Suggested volunteers</h3>
            <select
              className="select"
              style={{ width: 180 }}
              value={effectiveCategory}
              onChange={(e) => setSelectedCategory(e.target.value as NeedCategory)}
              disabled={categories.length === 0}
            >
              {(categories.length ? categories : (['other'] as NeedCategory[])).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div style={{ height: 10 }} />

          <div className="list">
            {suggestions.map((s) => (
              <div key={s.volunteer.id} className="listItem">
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 14 }}>{s.volunteer.name}</div>
                    <div className="muted" style={{ marginTop: 4 }}>
                      Skills: {s.volunteer.skills.join(', ')} • Distance:{' '}
                      {s.distanceKm.toFixed(1)} km
                      {s.skillMatch ? ' • skill match' : ''}
                    </div>
                  </div>
                  <button
                    className="btn btnPrimary"
                    type="button"
                    disabled={assignM.isPending}
                    onClick={() => assignM.mutate(s.volunteer)}
                  >
                    Assign
                  </button>
                </div>
              </div>
            ))}

            {suggestions.length === 0 ? (
              <p className="muted">No volunteers available in demo list.</p>
            ) : null}
          </div>

          {assignM.isError ? (
            <p className="muted" style={{ color: 'var(--danger)', marginTop: 10 }}>
              {(assignM.error as Error)?.message ?? 'Assignment failed.'}
            </p>
          ) : null}
        </div>
      </div>
    </>
  )
}

