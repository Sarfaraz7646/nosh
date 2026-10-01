import { useState } from 'react'
import { ArrowRight, ArrowUpRight, MapPin, Search, Sparkles } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import RestaurantCard from '../components/RestaurantCard'
import { useCustomer } from '../hooks/useCustomer'

const collections = [
  { title: 'The comfort club', note: 'For the days that need a little extra.', image: 'photo-1546833999-b9f581a1996d', cuisine: 'North Indian' },
  { title: 'Greens, please', note: 'Bright bowls, no compromise.', image: 'photo-1512621776951-a57141f2eefd', cuisine: 'Mediterranean' },
  { title: 'A very good slice', note: 'Hand-stretched and worth the wait.', image: 'photo-1513104890138-7c749659a591', cuisine: 'Italian' },
]

export default function HomePage() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const { user, restaurants } = useCustomer()

  function search(event) {
    event.preventDefault()
    navigate(`/restaurants?q=${encodeURIComponent(query)}`)
  }

  return (
    <div className="home-page page-enter">
      <section className="home-hero">
        <div className="home-hero-copy">
          <span className="eyebrow"><Sparkles size={13} /> YOUR NEIGHBOURHOOD, SERVED</span>
          <h1>Good food.<br /><em>Good mood.</em></h1>
          <p>Hey{user?.name ? `, ${user.name.split(' ')[0]}` : ''}. What sounds good today?</p>
          <form className="home-search" onSubmit={search}>
            <Search size={19} />
            <input aria-label="Search restaurants or dishes" placeholder="Try ‘biryani’ or ‘pizza’" value={query} onChange={(event) => setQuery(event.target.value)} />
            <button className="button button-primary" type="submit">Find food <ArrowRight size={16} /></button>
          </form>
          <div className="home-delivery"><MapPin size={15} /><span>Delivering to <strong>Indiranagar, Bengaluru</strong></span><button type="button" aria-label="Change delivery area">Change</button></div>
        </div>
        <div className="home-hero-image">
          <img src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1400&q=90" alt="A colourful table spread ready to share" />
          <div className="hero-image-note"><span>01 / 03</span><strong>Made for the<br />middle of the table.</strong></div>
          <span className="hero-stamp">BENGALURU<br />EATS WELL</span>
        </div>
      </section>

      <section className="collection-section">
        <div className="section-heading"><div><span className="eyebrow">A GOOD PLACE TO START</span><h2>Pick a mood.</h2></div><Link className="quiet-link" to="/restaurants">Explore everything <ArrowUpRight size={16} /></Link></div>
        <div className="collection-grid">
          {collections.map((collection, index) => (
            <Link className={`collection-tile collection-tile-${index + 1}`} to={`/restaurants?cuisine=${encodeURIComponent(collection.cuisine)}`} key={collection.title}>
              <img src={`https://images.unsplash.com/${collection.image}?auto=format&fit=crop&w=800&q=85`} alt="" loading="lazy" />
              <span className="collection-index">0{index + 1}</span>
              <div><h3>{collection.title}</h3><p>{collection.note}</p></div>
              <ArrowUpRight className="collection-arrow" size={19} />
            </Link>
          ))}
        </div>
      </section>

      <section className="restaurant-section home-restaurants">
        <div className="section-heading"><div><span className="eyebrow">CLOSE BY, WELL LOVED</span><h2>Neighbourhood favourites.</h2></div><Link className="quiet-link" to="/restaurants">See all restaurants <ArrowRight size={16} /></Link></div>
        <div className="restaurant-grid">{restaurants.slice(0, 3).map((restaurant) => <RestaurantCard restaurant={restaurant} key={restaurant.id} />)}</div>
      </section>
    </div>
  )
}
