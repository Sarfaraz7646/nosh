import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { formatCurrency } from '../utils/currency'

export default function CartPage() {
  const { cart, subtotal, deliveryFee, tax, total, changeQuantity, removeFromCart, clearCart } = useCart()
  const navigate = useNavigate()

  if (!cart.items.length) {
    return <section className="empty-cart page-enter"><div className="empty-cart-icon"><ShoppingBag size={25} /></div><span className="eyebrow">YOUR BAG IS TAKING A BREATHER</span><h1>Nothing in here.<br /><em>Yet.</em></h1><p>There are some very good meals with your name on them.</p><Link className="button button-primary" to="/restaurants">Find something lovely <ArrowRight size={16} /></Link></section>
  }

  return (
    <div className="cart-page page-enter">
      <div className="page-title-row"><div><span className="eyebrow">ONE STEP CLOSER</span><h1>Your bag<span className="title-dot">.</span></h1></div><button className="text-button clear-cart" type="button" onClick={clearCart}><Trash2 size={15} /> Clear bag</button></div>
      <div className="checkout-columns">
        <section className="cart-items-panel">
          <div className="cart-restaurant"><span className="eyebrow">FROM THIS KITCHEN</span><h2>{cart.restaurantName}</h2></div>
          {cart.items.map((item) => <article className="cart-item" key={item.id}><img src={item.image} alt="" /><div className="cart-item-copy"><span className={`food-mark ${item.isVeg ? '' : 'food-mark-nonveg'}`}><span /></span><h3>{item.name}</h3><small>{formatCurrency(item.price)} each</small><button className="item-remove" type="button" onClick={() => removeFromCart(item.id)}><Trash2 size={12} /> Remove</button></div><div className="quantity-control"><button type="button" aria-label={`Decrease ${item.name} quantity`} onClick={() => changeQuantity(item.id, item.quantity - 1)}><Minus size={14} /></button><span>{item.quantity}</span><button type="button" aria-label={`Increase ${item.name} quantity`} onClick={() => changeQuantity(item.id, item.quantity + 1)}><Plus size={14} /></button></div><strong className="cart-item-total">{formatCurrency(item.price * item.quantity)}</strong></article>)}
          <Link className="add-more-link" to={`/restaurant/${cart.restaurantId}`}><Plus size={15} /> Add something else</Link>
        </section>
        <aside className="bill-panel"><span className="eyebrow">THE LITTLE DETAILS</span><h2>Bill summary</h2><div className="bill-line"><span>Subtotal</span><strong>{formatCurrency(subtotal)}</strong></div><div className="bill-line"><span>Delivery</span><strong>{formatCurrency(deliveryFee)}</strong></div><div className="bill-line"><span>Tax (5%)</span><strong>{formatCurrency(tax)}</strong></div><div className="bill-total"><span>Total</span><strong>{formatCurrency(total)}</strong></div><p className="bill-note">Tax is calculated on your food subtotal.</p><button className="button button-primary full-width" type="button" onClick={() => navigate('/checkout')}>Continue to checkout <ArrowRight size={16} /></button></aside>
      </div>
    </div>
  )
}
