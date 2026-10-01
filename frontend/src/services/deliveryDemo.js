export const demoDeliveryProfile = {
  _id: null,
  userId: { name: 'Arjun Kumar', email: 'arjun@example.com', phone: '+91 98765 43210' },
  vehicleType: 'Motorcycle',
  vehicleNumber: 'KA 03 MN 4821',
  licenseDocument: '',
  isVerified: true,
  verificationStatus: 'APPROVED',
  isOnline: true,
  rating: 4.8,
  earnings: 12460,
}

export const demoCurrentDelivery = {
  id: 'demo-delivery-current',
  orderNumber: '1008',
  status: 'READY_FOR_PICKUP',
  deliveryStatus: 'ACCEPTED',
  restaurantName: 'ABC Restaurant',
  customer: 'Rahul',
  customerPhone: '+91 98111 22334',
  distance: '2.3 km',
  address: '12 Lake View Road, Indiranagar',
  itemsText: '2 × Biryani · 1 × Coke',
  total: 722,
  earning: 115,
}

export const demoAvailableDeliveries = [
  { id: 'demo-delivery-1009', orderNumber: '1009', status: 'Ready for pickup', deliveryStatus: 'OFFERED', restaurantName: 'Dough & Co.', customer: 'Meera', distance: '1.8 km', address: '22 5th Main, Indiranagar', itemsText: '1 × Margherita · 1 × Garlic bread', total: 630, earning: 110, placed: '3 min ago' },
  { id: 'demo-delivery-1010', orderNumber: '1010', status: 'Ready for pickup', deliveryStatus: 'OFFERED', restaurantName: 'Little Lemon Kitchen', customer: 'Kabir', distance: '3.1 km', address: '8 12th Cross, Koramangala', itemsText: '2 × Green goddess bowl', total: 794, earning: 135, placed: '6 min ago' },
]

export const demoDeliveryEarnings = {
  today: { deliveries: 8, amount: 920 },
  lifetime: 12460,
  daily: [
    { _id: '2026-09-25', deliveries: 6, amount: 680 },
    { _id: '2026-09-26', deliveries: 9, amount: 1015 },
    { _id: '2026-09-27', deliveries: 7, amount: 815 },
    { _id: '2026-09-28', deliveries: 8, amount: 940 },
    { _id: '2026-09-29', deliveries: 10, amount: 1120 },
    { _id: '2026-09-30', deliveries: 9, amount: 1035 },
    { _id: '2026-10-01', deliveries: 8, amount: 920 },
  ],
  recent: [],
}
