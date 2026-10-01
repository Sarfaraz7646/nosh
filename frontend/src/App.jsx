import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { CustomerProvider } from './store/CustomerStore'
import { useCustomer } from './hooks/useCustomer'
import CustomerLayout from './layouts/CustomerLayout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HomePage from './pages/HomePage'
import RestaurantsPage from './pages/RestaurantsPage'
import RestaurantPage from './pages/RestaurantPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import OrdersPage from './pages/OrdersPage'
import OrderDetailsPage from './pages/OrderDetailsPage'
import ProfilePage from './pages/ProfilePage'
import RestaurantDashboardLayout from './layouts/RestaurantDashboardLayout'
import DashboardOverviewPage from './pages/DashboardOverviewPage'
import DashboardOrdersPage from './pages/DashboardOrdersPage'
import DashboardMenuPage from './pages/DashboardMenuPage'
import DashboardProfilePage from './pages/DashboardProfilePage'
import DashboardEarningsPage from './pages/DashboardEarningsPage'
import DeliveryLoginPage from './pages/DeliveryLoginPage'
import DeliveryDashboardLayout from './layouts/DeliveryDashboardLayout'
import DeliveryDashboardPage from './pages/DeliveryDashboardPage'
import DeliveryOrdersPage from './pages/DeliveryOrdersPage'
import DeliveryEarningsPage from './pages/DeliveryEarningsPage'
import DeliveryProfilePage from './pages/DeliveryProfilePage'
import AdminDeliveryReviewPage from './pages/AdminDeliveryReviewPage'
import './App.css'

function ProtectedLayout() {
  const { user } = useCustomer()
  const location = useLocation()

  return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location.pathname }} />
}

function DeliveryProtectedLayout() {
  const { user } = useCustomer()
  const location = useLocation()
  if (!user) return <Navigate to="/delivery/login" replace state={{ from: location.pathname }} />
  if (user.role !== 'DELIVERY_PARTNER') return <Navigate to="/" replace />
  return <Outlet />
}

function AdminProtectedLayout() {
  const { user } = useCustomer()
  if (!user) return <Navigate to="/login" replace state={{ from: '/admin/delivery-partners' }} />
  if (user.role !== 'ADMIN') return <Navigate to="/" replace />
  return <AdminDeliveryReviewPage />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/delivery/login" element={<DeliveryLoginPage />} />
      <Route path="/delivery/register" element={<RegisterPage />} />
      <Route path="/admin/delivery-partners" element={<AdminProtectedLayout />} />
      <Route element={<DeliveryProtectedLayout />}>
        <Route element={<DeliveryDashboardLayout />}>
          <Route path="/delivery/dashboard" element={<DeliveryDashboardPage />} />
          <Route path="/delivery/orders" element={<DeliveryOrdersPage />} />
          <Route path="/delivery/earnings" element={<DeliveryEarningsPage />} />
          <Route path="/delivery/profile" element={<DeliveryProfilePage />} />
        </Route>
      </Route>
      <Route element={<ProtectedLayout />}>
        <Route element={<CustomerLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/restaurants" element={<RestaurantsPage />} />
          <Route path="/restaurant/:id" element={<RestaurantPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/order/:id" element={<OrderDetailsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
        <Route path="/dashboard" element={<RestaurantDashboardLayout />}>
          <Route index element={<DashboardOverviewPage />} />
          <Route path="orders" element={<DashboardOrdersPage />} />
          <Route path="menu" element={<DashboardMenuPage />} />
          <Route path="profile" element={<DashboardProfilePage />} />
          <Route path="earnings" element={<DashboardEarningsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <CustomerProvider>
        <AppRoutes />
      </CustomerProvider>
    </BrowserRouter>
  )
}
