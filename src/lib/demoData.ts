import type { Volunteer } from './types'

// Bengaluru-ish coordinates by default, since this is India-focused.
export const DEMO_VOLUNTEERS: Volunteer[] = [
  {
    id: 'v1',
    name: 'Asha',
    skills: ['medical', 'water'],
    location: { lat: 12.9716, lng: 77.5946 },
    available: true,
  },
  {
    id: 'v2',
    name: 'Ravi',
    skills: ['food', 'shelter'],
    location: { lat: 12.9352, lng: 77.6245 },
    available: true,
  },
  {
    id: 'v3',
    name: 'Neha',
    skills: ['rescue', 'medical'],
    location: { lat: 12.995, lng: 77.57 },
    available: true,
  },
  {
    id: 'v4',
    name: 'Imran',
    skills: ['food', 'water'],
    location: { lat: 13.015, lng: 77.65 },
    available: false,
  },
]

