import { useMemo, useState } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import RestaurantCard from '../components/RestaurantCard'
import { cuisines } from '../services/catalog'
import { useCustomer } from '../hooks/useCustomer'

export default function RestaurantsPage() {
  const { restaurants } = useCustomer()
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [sortBy, setSortBy] = useState('recommended')
  const selectedCuisine = searchParams.get('cuisine') || 'All'

  const visibleRestaurants = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const filtered = restaurants.filter((restaurant) => {
      const cuisineMatch = selectedCuisine === 'All' || restaurant.cuisine.some((cuisine) => cuisine.toLowerCase().includes(selectedCuisine.toLowerCase()))
      const searchable = `${restaurant.name} ${restaurant.cuisine.join(' ')} ${restaurant.description} ${restaurant.menu.map((item) => item.name).join(' ')}`.toLowerCase()
      return cuisineMatch && (!normalizedQuery || searchable.includes(normalizedQuery))
    })
    if (sortBy === 'rating') return filtered.sort((a, b) => b.rating - a.rating)
    if (sortBy === 'delivery') return filtered.sort((a, b) => parseInt(a.deliveryTime, 10) - parseInt(b.deliveryTime, 10))
    return filtered
  }, [query, restaurants, selectedCuisine, sortBy])

  function selectCuisine(cuisine) {
    const next = new URLSearchParams(searchParams)
    if (cuisine === 'All') next.delete('cuisine')
    else next.set('cuisine', cuisine)
    setSearchParams(next)
  }

  return (
    <div className="listing-page page-enter">
      <section className="listing-heading">
        <div><span className="eyebrow">GOOD THINGS, AROUND THE CORNER</span><h1>Find your kind of <em>delicious.</em></h1><p>Thoughtful kitchens, right here in Bengaluru.</p></div>
        <div className="listing-count"><strong>{visibleRestaurants.length.toString().padStart(2, '0')}</strong><span>places<br />to try</span></div>
      </section>
      <div className="listing-controls">
        <div className="cuisine-filters" aria-label="Filter by cuisine">
          {cuisines.map((cuisine) => <button type="button" className={`filter-chip ${selectedCuisine === cuisine ? 'active' : ''}`} key={cuisine} onClick={() => selectCuisine(cuisine)}>{cuisine}</button>)}
        </div>
        <label className="listing-search"><Search size={17} /><input placeholder="Search dishes or places" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search dishes or places" /></label>
        <label className="sort-control"><SlidersHorizontal size={15} /><span className="sr-only">Sort restaurants</span><select value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option value="recommended">Recommended</option><option value="rating">Top rated</option><option value="delivery">Fastest delivery</option></select></label>
      </div>
      <div className="restaurant-grid listing-grid">
        {visibleRestaurants.map((restaurant) => <RestaurantCard restaurant={restaurant} key={restaurant.id} />)}
      </div>
      {visibleRestaurants.length === 0 && <div className="empty-state"><span className="eyebrow">NO MATCHES JUST YET</span><h2>Try a different craving.</h2><p>Search another dish or choose a different cuisine.</p><button type="button" className="button button-outline" onClick={() => { setQuery(''); selectCuisine('All') }}>Clear filters</button></div>}
    </div>
  )
}
