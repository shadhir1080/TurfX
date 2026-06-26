'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { getDirectionsUrl } from '@/lib/pricing'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix Leaflet's default icon in Next.js
const fixLeafletIcon = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  })
}

interface TurfMapProps {
  turfs: Array<{
    id: string
    name: string
    lat: number
    lng: number
    price_per_hour: number
    rating?: number | null
  }>
  centerLat?: number
  centerLng?: number
  zoom?: number
  height?: string
}

export default function TurfMap({
  turfs,
  centerLat = 11.0168,
  centerLng = 76.9558,
  zoom = 12,
  height = '400px',
}: TurfMapProps) {
  useEffect(() => {
    fixLeafletIcon()
  }, [])

  return (
    <div style={{ height }} className="w-full rounded-2xl overflow-hidden border border-white/10">
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={zoom}
        style={{ height: '100%', width: '100%', background: '#0f1419' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {turfs.map((turf) => (
          <Marker key={turf.id} position={[turf.lat, turf.lng]}>
            <Popup>
              <div className="min-w-[160px]">
                <p className="font-bold text-sm mb-1">{turf.name}</p>
                <p className="text-xs text-gray-600 mb-2">
                  ₹{turf.price_per_hour.toLocaleString('en-IN')}/hr
                  {turf.rating && ` • ⭐ ${turf.rating}`}
                </p>
                <a
                  href={getDirectionsUrl(turf.lat, turf.lng, turf.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 font-semibold hover:underline"
                >
                  📍 Get Directions →
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
