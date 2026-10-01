import { useMemo } from 'react'
import { Bike, Clock3, House, Navigation, Utensils } from 'lucide-react'

const demoRoute = {
  restaurant: { latitude: 12.9784, longitude: 77.6408 },
  partner: { latitude: 12.9716, longitude: 77.6332 },
  customer: { latitude: 12.967, longitude: 77.625 },
}

function toPoint(value) {
  if (!value) return null
  if (Array.isArray(value.coordinates) && value.coordinates.length === 2) {
    return { longitude: Number(value.coordinates[0]), latitude: Number(value.coordinates[1]) }
  }
  if (Number.isFinite(value.latitude) && Number.isFinite(value.longitude)) return value
  return null
}

function projectLatitude(latitude) {
  const radians = latitude * Math.PI / 180
  return Math.log(Math.tan(Math.PI / 4 + radians / 2))
}

function haversineKm(pointA, pointB) {
  const radians = (degrees) => degrees * Math.PI / 180
  const latitudeDelta = radians(pointB.latitude - pointA.latitude)
  const longitudeDelta = radians(pointB.longitude - pointA.longitude)
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(pointA.latitude)) * Math.cos(radians(pointB.latitude)) * Math.sin(longitudeDelta / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function markerStyle(point, bounds) {
  const left = ((point.longitude - bounds.west) / (bounds.east - bounds.west)) * 100
  const top = ((projectLatitude(bounds.north) - projectLatitude(point.latitude))
    / (projectLatitude(bounds.north) - projectLatitude(bounds.south))) * 100
  return { left: `${left}%`, top: `${top}%` }
}

export default function FreeDeliveryMap({ order }) {
  const restaurantPoint = toPoint(order.restaurantLocation)
  const customerPoint = toPoint(order.address?.location)
  const driverPoint = toPoint(order.deliveryLocation) || restaurantPoint
  const isDemo = !restaurantPoint && !customerPoint && !order._id
  const route = isDemo ? demoRoute : { restaurant: restaurantPoint, partner: driverPoint, customer: customerPoint }
  const hasFullRoute = Boolean(route.restaurant && route.partner && route.customer)

  const bounds = useMemo(() => {
    if (!hasFullRoute) return null
    const points = [route.restaurant, route.partner, route.customer]
    const longitudes = points.map((point) => point.longitude)
    const latitudes = points.map((point) => point.latitude)
    const longitudeSpan = Math.max(...longitudes) - Math.min(...longitudes)
    const latitudeSpan = Math.max(...latitudes) - Math.min(...latitudes)
    const longitudePadding = Math.max(longitudeSpan * 0.24, 0.004)
    const latitudePadding = Math.max(latitudeSpan * 0.24, 0.004)
    return {
      west: Math.min(...longitudes) - longitudePadding,
      east: Math.max(...longitudes) + longitudePadding,
      south: Math.min(...latitudes) - latitudePadding,
      north: Math.max(...latitudes) + latitudePadding,
    }
  }, [hasFullRoute, route.customer?.latitude, route.customer?.longitude, route.partner?.latitude, route.partner?.longitude, route.restaurant?.latitude, route.restaurant?.longitude])

  const etaMinutes = route.partner && route.customer
    ? Math.max(4, Math.round(haversineKm(route.partner, route.customer) * 2.5 + 2))
    : 8
  const tileUrl = useMemo(() => {
    if (!bounds) return ''
    const query = new URLSearchParams({
      bbox: `${bounds.west},${bounds.south},${bounds.east},${bounds.north}`,
      layer: 'mapnik',
    })
    return `https://www.openstreetmap.org/export/embed.html?${query.toString()}`
  }, [bounds])

  if (!hasFullRoute || !bounds) {
    return (
      <section className="free-map-unavailable">
        <span className="free-map-unavailable-icon"><Navigation size={19} /></span>
        <strong>Map location is not available yet</strong>
        <p>Restaurant and delivery address coordinates are needed to draw this route. The map uses free OpenStreetMap data.</p>
      </section>
    )
  }

  const markers = [
    { key: 'restaurant', point: route.restaurant, label: order.restaurantName || 'Restaurant', icon: Utensils, className: 'restaurant' },
    { key: 'partner', point: route.partner, label: order.deliveryPartnerName || 'Delivery partner', icon: Bike, className: 'partner' },
    { key: 'customer', point: route.customer, label: 'You', icon: House, className: 'customer' },
  ]
  const start = markerStyle(route.restaurant, bounds)
  const end = markerStyle(route.customer, bounds)
  const deltaX = parseFloat(end.left) - parseFloat(start.left)
  const deltaY = parseFloat(end.top) - parseFloat(start.top)
  const routeStyle = {
    left: start.left,
    top: start.top,
    width: `${Math.hypot(deltaX, deltaY)}%`,
    transform: `rotate(${Math.atan2(deltaY, deltaX) * 180 / Math.PI}deg)`,
  }

  return (
    <section className="live-map-card" aria-label="Live delivery map">
      <div className="live-map-canvas">
        <iframe title="OpenStreetMap delivery area" src={tileUrl} loading="lazy" referrerPolicy="no-referrer" />
        <div className="live-map-overlay" aria-hidden="true">
          <span className="live-map-route-line" style={routeStyle} />
          {markers.map(({ key, point, label, icon: Icon, className }) => <div className={`live-map-marker ${className}`} style={markerStyle(point, bounds)} key={key}><span><Icon size={15} /></span><strong>{label}</strong></div>)}
        </div>
        <span className="map-attribution">© OpenStreetMap contributors</span>
        {order.deliveryLocation && <span className="map-live-indicator"><i /> LIVE</span>}
      </div>
      <div className="live-map-footer"><span><Clock3 size={15} /> Estimated arrival</span><strong>{etaMinutes} minutes</strong><small>{order.deliveryLocation ? `${order.deliveryLocation.latitude.toFixed(4)}, ${order.deliveryLocation.longitude.toFixed(4)}` : 'Waiting for partner GPS'}</small></div>
    </section>
  )
}
