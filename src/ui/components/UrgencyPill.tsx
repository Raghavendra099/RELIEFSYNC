import type { Urgency } from '../../lib/types'

export function UrgencyPill({ urgency }: { urgency: Urgency | 'unscored' }) {
  if (urgency === 'urgent') return <span className="pill pillUrgent">Urgent</span>
  if (urgency === 'high') return <span className="pill pillHigh">High</span>
  if (urgency === 'normal') return <span className="pill pillNormal">Normal</span>
  return <span className="pill">Unscored</span>
}

