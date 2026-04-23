import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { listReports } from '../../lib/store'
import { MapPlaceholder } from '../components/MapPlaceholder'
import { UrgencyPill } from '../components/UrgencyPill'

export function DashboardPage() {
  const reportsQ = useQuery({
    queryKey: ['reports'],
    queryFn: listReports,
  })

  const reports = reportsQ.data ?? []
  const active = reports.filter((r) => r.status !== 'resolved')
  const urgentCount = reports.filter((r) => (r.ai?.urgency ?? 'normal') === 'urgent').length

  return (
    <>
      <div className="pageHeader">
        <div>
          <h2>Dashboard</h2>
          <p>Live overview of incoming reports + heat zones.</p>
        </div>
        <div className="row">
          <Link className="btn btnPrimary" to="/report">
            + New report
          </Link>
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <MapPlaceholder reports={active} />
        </div>
        <div className="card">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div className="kpi">
              <div className="label">Active crises</div>
              <div className="value">{active.length}</div>
            </div>
            <div className="kpi">
              <div className="label">Urgent</div>
              <div className="value">{urgentCount}</div>
            </div>
            <div className="kpi">
              <div className="label">Reports (last 50)</div>
              <div className="value">{reports.length}</div>
            </div>
          </div>

          <div style={{ height: 14 }} />

          {reportsQ.isLoading ? (
            <p className="muted">Loading…</p>
          ) : (
            <div className="list" aria-label="Active crises list">
              {active.slice(0, 8).map((r) => (
                <div key={r.id} className="listItem">
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <div className="row">
                      <UrgencyPill urgency={r.ai?.urgency ?? 'unscored'} />
                      <span className="pill">{r.ai?.categories?.join(', ') ?? 'unclassified'}</span>
                    </div>
                    <span className="muted">{new Date(r.createdAt).toLocaleString()}</span>
                  </div>
                  <div style={{ height: 10 }} />
                  <div style={{ fontSize: 13 }}>{r.rawText.slice(0, 140)}{r.rawText.length>140?'…':''}</div>
                  <div style={{ height: 10 }} />
                  <div className="row">
                    <Link className="btn" to={`/assignment/${r.id}`}>
                      Open assignment
                    </Link>
                  </div>
                </div>
              ))}
              {active.length === 0 ? <p className="muted">No reports yet.</p> : null}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

