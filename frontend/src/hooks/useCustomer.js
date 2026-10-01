import { useContext } from 'react'
import CustomerContext from '../store/customerContext'

export function useCustomer() {
  const context = useContext(CustomerContext)
  if (!context) throw new Error('useCustomer must be used inside CustomerProvider')
  return context
}
