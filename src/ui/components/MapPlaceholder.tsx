import type { CrisisReport } from '../../lib/types'

export function MapPlaceholder({ reports }: { reports: CrisisReport[] }) {
  // Render pins deterministically from lat/lng to simulate "live map/heat zones" in MVP.
  return (
    <div className="map" aria-label="Map placeholder">
      {reports.slice(0, 10).map((r) => {
        const x = ((r.location.lng + 180) % 360) / 360
        const y = 1 - ((r.location.lat + 90) % 180) / 180
        const left = Math.round(8 + x * 84)
        const top = Math.round(10 + y * 78)
        const urgency = r.ai?.urgency ?? 'normal'
        const color =
          urgency === 'urgent' ? 'var(--danger)' : urgency === 'high' ? 'var(--warn)' : 'var(--ok)'

        return (
          <div
            key={r.id}
            className="mapPin"
            title={`${r.ai?.urgency ?? 'unscored'} • ${r.ai?.categories?.join(', ') ?? 'unknown'}`}
            style={{
              left: `${left}%`,
              top: `${top}%`,
              background: color,
            }}
          />
        )
      })}

      <div className="mapLegend">
        <span className="pill pillUrgent">Urgent</span>
        <span className="pill pillHigh">High</span>
        <span className="pill pillNormal">Normal</span>
      </div>
    </div>
  )
}

