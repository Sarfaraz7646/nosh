import { useState } from 'react'
import { ArrowLeft, ArrowRight, Banknote, Check, CreditCard, LocateFixed, MapPin, ShieldCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { useCustomer } from '../hooks/useCustomer'
import { formatCurrency } from '../utils/currency'
import { paymentApi } from '../services/paymentApi'
import { customerApi } from '../services/customerApi'
import { loadRazorpayCheckout } from '../utils/loadRazorpay'

export default function CheckoutPage() {
  const { cart, subtotal, deliveryFee, tax, total } = useCart()
  const { placeOrder, completeOrder, user } = useCustomer()
  const [paymentMethod, setPaymentMethod] = useState('UPI / card')
  const [orderError, setOrderError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [pendingOrder, setPendingOrder] = useState(null)
  const [customerLocation, setCustomerLocation] = useState(null)
  const [locationMessage, setLocationMessage] = useState('')
  const navigate = useNavigate()

  if (!cart.items.length) return <section className="empty-state"><span className="eyebrow">NO BAG, NO CHECKOUT</span><h1>Let's find something first.</h1><Link className="button button-primary" to="/restaurants">Browse restaurants</Link></section>

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setOrderError('')
    const formData = new FormData(event.currentTarget)
    try {
      const address = {
        name: formData.get('name'),
        phone: formData.get('phone'),
        line1: formData.get('line1'),
        line2: formData.get('line2'),
        city: formData.get('city'),
        state: formData.get('state'),
        pincode: formData.get('pincode'),
        ...(customerLocation ? { location: { type: 'Point', coordinates: customerLocation } } : {}),
      }
      const order = pendingOrder || await placeOrder({ address, paymentMethod })

      if (paymentMethod === 'Cash on delivery') {
        navigate(`/order/${order.id}`, { replace: true })
        return
      }

      setPendingOrder(order)
      const checkoutReady = await loadRazorpayCheckout()
      if (!checkoutReady) throw new Error('Razorpay Checkout could not be loaded. Check your connection and try again.')

      const { payment, keyId } = await paymentApi.createRazorpayOrder(order.id)
      const checkout = new window.Razorpay({
        key: keyId,
        amount: payment.amount,
        currency: payment.currency,
        name: 'Nosh',
        description: `Order ${order.orderNumber || order.id}`,
        order_id: payment.razorpayOrderId,
        prefill: { name: user?.name, email: user?.email, contact: address.phone },
        notes: { appOrderId: order.id },
        theme: { color: '#d9503d' },
        modal: {
          ondismiss: () => {
            setOrderError('Payment was not completed. Your cart is saved; you can try again.')
            setSubmitting(false)
          },
        },
        handler: async (gatewayResponse) => {
          setSubmitting(true)
          setOrderError('')
          try {
            const verified = await paymentApi.verifyRazorpayPayment({
              orderId: order.id,
              razorpay_order_id: gatewayResponse.razorpay_order_id,
              razorpay_payment_id: gatewayResponse.razorpay_payment_id,
              razorpay_signature: gatewayResponse.razorpay_signature,
            })
            const confirmedOrder = {
              ...customerApi.mapOrder(verified.order),
              restaurantName: order.restaurantName,
              paymentStatus: verified.payment.status,
              paymentId: verified.payment.paymentId,
            }
            completeOrder(confirmedOrder)
            setPendingOrder(null)
            navigate(`/order/${confirmedOrder.id}`, { replace: true })
          } catch (error) {
            setOrderError(error.message)
          } finally {
            setSubmitting(false)
          }
        },
      })

      checkout.on('payment.failed', (event) => {
        setOrderError(event.error?.description || 'Payment failed. Your cart is saved; you can try again.')
        setSubmitting(false)
      })
      checkout.open()
      setSubmitting(false)
    } catch (error) {
      setOrderError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  function captureDeliveryLocation() {
    if (!navigator.geolocation) {
      setLocationMessage('Location is unavailable in this browser.')
      return
    }
    setLocationMessage('Requesting your location…')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setCustomerLocation([coords.longitude, coords.latitude])
        setLocationMessage('Delivery pin saved for live tracking.')
      },
      () => setLocationMessage('Location permission was not granted. You can still place the order.'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    )
  }

  return (
    <div className="checkout-page page-enter">
      <Link className="back-link" to="/cart"><ArrowLeft size={16} /> Back to your bag</Link>
      <div className="page-title-row checkout-title"><div><span className="eyebrow">ALMOST THERE</span><h1>Make it yours<span className="title-dot">.</span></h1></div><div className="secure-note"><ShieldCheck size={17} /><span>Secure checkout</span></div></div>
      <form className="checkout-columns" onSubmit={handleSubmit}>
        <div className="checkout-form-column">
          <section className="form-section"><div className="form-section-heading"><span className="step-number">01</span><div><h2>Where should we find you?</h2><p>Your food will be at your door before you know it.</p></div></div><div className="form-grid"><label className="field-wide">Full name<input name="name" autoComplete="name" defaultValue={user?.name || ''} placeholder="Name on the doorbell" required /></label><label>Phone number<input name="phone" type="tel" autoComplete="tel" placeholder="10-digit mobile number" pattern="[0-9+() -]{8,16}" required /></label><label>PIN code<input name="pincode" inputMode="numeric" autoComplete="postal-code" placeholder="560038" pattern="[0-9]{6}" required /></label><label className="field-wide">House / flat and street<input name="line1" autoComplete="address-line1" placeholder="Flat, building, street" required /></label><label className="field-wide">Apartment, landmark (optional)<input name="line2" autoComplete="address-line2" placeholder="Near the corner bakery" /></label><label>City<input name="city" autoComplete="address-level2" defaultValue="Bengaluru" required /></label><label>State<input name="state" autoComplete="address-level1" defaultValue="Karnataka" required /></label></div><div className="checkout-location-row"><div className="address-tip"><MapPin size={15} /> We currently deliver across Bengaluru.</div><button className="location-pin-button" type="button" onClick={captureDeliveryLocation}><LocateFixed size={14} /> {customerLocation ? 'Update map pin' : 'Use current location'}</button></div>{locationMessage && <p className="checkout-location-message" role="status">{locationMessage}</p>}</section>
          <section className="form-section payment-section"><div className="form-section-heading"><span className="step-number">02</span><div><h2>How would you like to pay?</h2><p>Choose what works for you.</p></div></div><div className="payment-options"><label className={`payment-option ${paymentMethod === 'UPI / card' ? 'selected' : ''}`}><input type="radio" name="payment" value="UPI / card" checked={paymentMethod === 'UPI / card'} disabled={Boolean(pendingOrder)} onChange={() => setPaymentMethod('UPI / card')} /><span className="payment-option-icon"><CreditCard size={19} /></span><span><strong>UPI or card</strong><small>Secure Razorpay checkout</small></span>{paymentMethod === 'UPI / card' && <Check className="payment-check" size={17} />}</label><label className={`payment-option ${paymentMethod === 'Cash on delivery' ? 'selected' : ''}`}><input type="radio" name="payment" value="Cash on delivery" checked={paymentMethod === 'Cash on delivery'} disabled={Boolean(pendingOrder)} onChange={() => setPaymentMethod('Cash on delivery')} /><span className="payment-option-icon"><Banknote size={19} /></span><span><strong>Cash on delivery</strong><small>Have the exact amount ready</small></span>{paymentMethod === 'Cash on delivery' && <Check className="payment-check" size={17} />}</label></div></section>
        </div>
        <aside className="bill-panel checkout-bill"><span className="eyebrow">FROM {cart.restaurantName?.toUpperCase()}</span><h2>Your order</h2><div className="checkout-order-items">{cart.items.map((item) => <div className="bill-line" key={item.id}><span>{item.quantity} × {item.name}</span><strong>{formatCurrency(item.price * item.quantity)}</strong></div>)}</div><div className="bill-line"><span>Subtotal</span><strong>{formatCurrency(subtotal)}</strong></div><div className="bill-line"><span>Delivery</span><strong>{formatCurrency(deliveryFee)}</strong></div><div className="bill-line"><span>Tax (5%)</span><strong>{formatCurrency(tax)}</strong></div><div className="bill-total"><span>Total to pay</span><strong>{formatCurrency(total)}</strong></div>{orderError && <p className="auth-error" role="alert">{orderError}</p>}<button className="button button-primary full-width" type="submit" disabled={submitting}>{submitting ? 'Placing order…' : 'Place order'} <ArrowRight size={16} /></button><p className="bill-note">By placing your order, you agree to our terms. Your order is prepared fresh.</p></aside>
      </form>
    </div>
  )
}
