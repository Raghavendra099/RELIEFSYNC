import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { getAssignment, getReport } from '../../lib/store'
import { UrgencyPill } from '../components/UrgencyPill'

export function VolunteerTaskPage() {
  const { assignmentId } = useParams()

  const assignmentQ = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: () => (assignmentId ? getAssignment(assignmentId) : Promise.resolve(null)),
    enabled: !!assignmentId,
  })

  const reportQ = useQuery({
    queryKey: ['reportByAssignment', assignmentId],
    queryFn: async () => {
      const a = assignmentQ.data
      if (!a) return null
      return await getReport(a.reportId)
    },
    enabled: !!assignmentQ.data?.reportId,
  })

  const a = assignmentQ.data
  const r = reportQ.data

  if (assignmentQ.isLoading) return <p className="muted">Loading…</p>

  if (!a) {
    return (
      <div className="card">
        <h2 style={{ margin: 0, fontSize: 16 }}>Assignment not found</h2>
        <div style={{ height: 10 }} />
        <Link className="btn" to="/dashboard">
          Back to dashboard
        </Link>
      </div>
    )
  }

  const mapsUrl =
    r?.location
      ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
          `${r.location.lat},${r.location.lng}`,
        )}`
      : null

  return (
    <>
      <div className="pageHeader">
        <div>
          <h2>Volunteer app</h2>
          <p>Assigned task + navigation link.</p>
        </div>
        <div className="row">
          <Link className="btn" to="/dashboard">
            Dashboard
          </Link>
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div className="row">
              <UrgencyPill urgency={a.urgency} />
              <span className="pill">Category: {a.category}</span>
            </div>
            <span className="muted">Status: {a.status}</span>
          </div>

          <div style={{ height: 12 }} />

          <div className="listItem">
            <div className="muted">Volunteer</div>
            <div style={{ fontSize: 14, marginTop: 6 }}>{a.volunteerName}</div>
            <div className="muted" style={{ marginTop: 4 }}>
              Est. distance: {a.distanceKm.toFixed(1)} km
            </div>
          </div>

          <div style={{ height: 12 }} />

          <div className="listItem">
            <div className="muted">Task details</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>
              {r?.ai?.summary ?? r?.rawText ?? '—'}
            </div>
            <div className="muted" style={{ marginTop: 8 }}>
              Location: {r?.location ? `${r.location.lat.toFixed(5)}, ${r.location.lng.toFixed(5)}` : '—'}
            </div>
          </div>

          <div style={{ height: 12 }} />

          <div className="row">
            {mapsUrl ? (
              <a className="btn btnPrimary" href={mapsUrl} target="_blank" rel="noreferrer">
                Open navigation
              </a>
            ) : (
              <span className="muted">Location not available yet.</span>
            )}
            <Link className="btn" to={`/assignment/${a.reportId}`}>
              View assignment
            </Link>
          </div>
        </div>

        <div className="card">
          <h3 style={{ margin: 0, fontSize: 14 }}>Notification preview</h3>
          <div style={{ height: 10 }} />
          <div className="listItem">
            <div style={{ fontSize: 13 }}>
              <strong>New task assigned:</strong> {a.category} ({a.urgency})<br />
              <span className="muted">
                {r?.location ? `Destination: ${r.location.lat.toFixed(4)}, ${r.location.lng.toFixed(4)}` : 'Destination: —'}
              </span>
            </div>
          </div>
          <div style={{ height: 10 }} />
          <p className="muted">
            In production: Firebase Cloud Messaging / WhatsApp integration.
          </p>
        </div>
      </div>
    </>
  )
}

