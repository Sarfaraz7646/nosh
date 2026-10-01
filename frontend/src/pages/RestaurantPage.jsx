import { useEffect, useState } from 'react'
import { ArrowLeft, Clock3, Heart, MapPin, Star } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import MenuItemRow from '../components/MenuItemRow'
import { findRestaurant } from '../services/catalog'
import { customerApi } from '../services/customerApi'
import { useCustomer } from '../hooks/useCustomer'
import { formatCurrency } from '../utils/currency'

export default function RestaurantPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart, favorites, toggleFavorite, restaurants } = useCustomer()
  const [activeCategory, setActiveCategory] = useState('All')
  const [remoteResult, setRemoteResult] = useState({ id: null, restaurant: null })
  const isMongoId = /^[a-f\d]{24}$/i.test(id)

  useEffect(() => {
    if (!isMongoId) return undefined

    let active = true
    Promise.all([customerApi.getRestaurant(id), customerApi.getMenu(id)])
      .then(([restaurant, menu]) => {
        if (active) setRemoteResult({ id, restaurant: { ...restaurant, menu } })
      })
      .catch(() => { if (active) setRemoteResult({ id, restaurant: null }) })
    return () => { active = false }
  }, [id, isMongoId])

  const remotePending = isMongoId && remoteResult.id !== id
  const restaurant = remoteResult.id === id && remoteResult.restaurant
    ? remoteResult.restaurant
    : restaurants.find((entry) => entry.id === id) || findRestaurant(id)

  if (!restaurant && remotePending) return <section className="empty-state"><span className="eyebrow">ONE MOMENT</span><h1>Finding that kitchen…</h1></section>
  if (!restaurant) return <section className="empty-state"><h1>We couldn't find that kitchen.</h1><Link className="button button-primary" to="/restaurants">Back to restaurants</Link></section>

  const categories = ['All', ...new Set(restaurant.menu.map((item) => item.category))]
  const visibleItems = activeCategory === 'All' ? restaurant.menu : restaurant.menu.filter((item) => item.category === activeCategory)

  return (
    <div className="restaurant-detail page-enter">
      <Link className="back-link" to="/restaurants"><ArrowLeft size={16} /> All restaurants</Link>
      <section className="restaurant-cover">
        <img src={restaurant.image} alt={`${restaurant.name} food`} />
        <span className="cover-stamp"><Star size={14} fill="currentColor" /> {restaurant.rating} local rating</span>
      </section>
      <section className="restaurant-detail-head">
        <div><span className="eyebrow">{restaurant.cuisine.join(' · ')}</span><h1>{restaurant.name}</h1><p>{restaurant.description}</p><div className="detail-meta"><span><MapPin size={15} /> {restaurant.address}</span><span><Clock3 size={15} /> {restaurant.deliveryTime}</span><span>{formatCurrency(restaurant.priceForTwo)} for two</span></div></div>
        <button className={`button button-outline save-restaurant ${favorites.includes(restaurant.id) ? 'is-favorite' : ''}`} type="button" onClick={() => toggleFavorite(restaurant.id)}><Heart size={16} fill={favorites.includes(restaurant.id) ? 'currentColor' : 'none'} /> {favorites.includes(restaurant.id) ? 'Saved' : 'Save place'}</button>
      </section>
      <div className="menu-layout">
        <aside className="menu-sidebar"><span className="eyebrow">ON THE MENU</span><h2>What sounds good?</h2><div className="menu-category-list">{categories.map((category) => <button type="button" className={activeCategory === category ? 'active' : ''} key={category} onClick={() => setActiveCategory(category)}>{category}<span>{category === 'All' ? restaurant.menu.length : restaurant.menu.filter((item) => item.category === category).length}</span></button>)}</div><div className="menu-sidebar-note"><span>{restaurant.offer}</span><small>A little thank-you from the kitchen.</small></div></aside>
        <section className="menu-list" aria-label={`${restaurant.name} menu`}>
          <div className="menu-list-heading"><div><span className="eyebrow">MADE TO ORDER</span><h2>{activeCategory === 'All' ? 'The good stuff' : activeCategory}</h2></div><span>{visibleItems.length} dishes</span></div>
          {visibleItems.map((item) => <MenuItemRow item={item} restaurant={restaurant} onAdd={addToCart} key={item.id} />)}
          <button className="button button-primary menu-view-cart" type="button" onClick={() => navigate('/cart')}>Go to bag <ArrowLeft size={16} /></button>
        </section>
      </div>
    </div>
  )
}
