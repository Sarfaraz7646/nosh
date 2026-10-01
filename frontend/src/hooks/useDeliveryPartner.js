import { useContext } from 'react'
import DeliveryPartnerContext from '../store/deliveryPartnerContext'

export function useDeliveryPartner() {
  const context = useContext(DeliveryPartnerContext)
  if (!context) throw new Error('useDeliveryPartner must be used inside DeliveryPartnerProvider')
  return context
}
