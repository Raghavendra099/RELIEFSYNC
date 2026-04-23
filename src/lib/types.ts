export type NeedCategory = 'food' | 'medical' | 'shelter' | 'water' | 'rescue' | 'other'

export type Urgency = 'urgent' | 'high' | 'normal'

export type GeoPointLite = {
  lat: number
  lng: number
}

export type CrisisReport = {
  id: string
  createdAt: number
  reporterName?: string
  source: 'manual' | 'voice' | 'csv'
  language?: string
  rawText: string
  location: GeoPointLite

  ai?: {
    categories: NeedCategory[]
    urgency: Urgency
    urgencyScore: number
    summary: string
    extracted: Record<string, unknown>
    model: 'gemini' | 'mock'
  }

  status: 'new' | 'assigned' | 'resolved'
}

export type Volunteer = {
  id: string
  name: string
  skills: NeedCategory[]
  location: GeoPointLite
  available: boolean
}

export type Assignment = {
  id: string
  reportId: string
  createdAt: number
  category: NeedCategory
  urgency: Urgency
  volunteerId: string
  volunteerName: string
  distanceKm: number
  status: 'assigned' | 'enroute' | 'done'
}

