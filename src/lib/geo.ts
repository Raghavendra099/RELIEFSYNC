import type { GeoPointLite } from './types'

export function distanceKm(a: GeoPointLite, b: GeoPointLite) {
  const R = 6371
  const dLat = deg2rad(b.lat - a.lat)
  const dLng = deg2rad(b.lng - a.lng)
  const s1 =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(a.lat)) *
      Math.cos(deg2rad(b.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(s1), Math.sqrt(1 - s1))
  return R * c
}

function deg2rad(x: number) {
  return (x * Math.PI) / 180
}

