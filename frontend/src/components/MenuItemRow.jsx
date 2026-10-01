import { Leaf, Plus, Star } from 'lucide-react'
import { formatCurrency } from '../utils/currency'

export default function MenuItemRow({ item, restaurant, onAdd }) {
  return (
    <article className="menu-item-row">
      <div className="menu-item-copy">
        <span className={`food-mark ${item.isVeg ? '' : 'food-mark-nonveg'}`} aria-label={item.isVeg ? 'Vegetarian' : 'Non-vegetarian'}>
          <span />
        </span>
        {item.bestseller && <span className="bestseller-label"><Star size={11} fill="currentColor" /> Popular</span>}
        <h3>{item.name}</h3>
        <strong className="menu-price">{formatCurrency(item.price)}</strong>
        <p>{item.description}</p>
      </div>
      <div className="menu-item-action">
        <img src={item.image} alt="" loading="lazy" />
        <button className="add-button" type="button" onClick={() => onAdd(item, restaurant)} aria-label={`Add ${item.name} to bag`}>
          <Plus size={17} /> <span>Add</span>
        </button>
        <small><Leaf size={11} /> Freshly made</small>
      </div>
    </article>
  )
}
