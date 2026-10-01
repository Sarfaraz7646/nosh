export function loadRazorpayCheckout() {
  if (window.Razorpay) return Promise.resolve(true)

  return new Promise((resolve) => {
    const existingScript = document.querySelector('script[data-razorpay-checkout]')
    if (existingScript) {
      if (existingScript.dataset.failed === 'true') {
        existingScript.remove()
        return resolve(false)
      }
      if (existingScript.dataset.loaded === 'true') return resolve(Boolean(window.Razorpay))
      existingScript.addEventListener('load', () => resolve(Boolean(window.Razorpay)), { once: true })
      existingScript.addEventListener('error', () => resolve(false), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.dataset.razorpayCheckout = 'true'
    script.onload = () => {
      script.dataset.loaded = 'true'
      resolve(Boolean(window.Razorpay))
    }
    script.onerror = () => {
      script.dataset.failed = 'true'
      resolve(false)
    }
    document.body.appendChild(script)
  })
}
