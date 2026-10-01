import { Heart, Star, Timer } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatCurrency } from '../utils/currency'
import { useCustomer } from '../hooks/useCustomer'

export default function RestaurantCard({ restaurant }) {
  const { favorites, toggleFavorite } = useCustomer()
  const isFavorite = favorites.includes(restaurant.id)

  return (
    <article className="restaurant-card">
      <Link className="restaurant-card-link" to={`/restaurant/${restaurant.id}`}>
        <div className="restaurant-image-wrap">
          <img src={restaurant.image} alt={`${restaurant.name} dishes`} loading="lazy" />
          {restaurant.offer && <span className="offer-ribbon">{restaurant.offer}</span>}
        </div>
        <div className="restaurant-card-copy">
          <div className="restaurant-card-title">
            <h3>{restaurant.name}</h3>
            <span className="rating"><Star size={13} fill="currentColor" /> {restaurant.rating}</span>
          </div>
          <p>{restaurant.cuisine.join(' · ')}</p>
          <div className="restaurant-card-meta">
            <span><Timer size={14} /> {restaurant.deliveryTime}</span>
            <span>{formatCurrency(restaurant.priceForTwo)} for two</span>
          </div>
        </div>
      </Link>
      <button
        className={`favorite-button ${isFavorite ? 'is-favorite' : ''}`}
        type="button"
        aria-label={isFavorite ? `Remove ${restaurant.name} from favourites` : `Save ${restaurant.name}`}
        aria-pressed={isFavorite}
        onClick={() => toggleFavorite(restaurant.id)}
      >
        <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
      </button>
    </article>
  )
}
