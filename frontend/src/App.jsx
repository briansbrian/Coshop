import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MapPage from './pages/MapPage';
import ProductSearchPage from './pages/ProductSearchPage';
import ProductDetailPage from './pages/ProductDetailPage';
import BusinessProfilePage from './pages/BusinessProfilePage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import OrderDetailPage from './pages/OrderDetailPage';
import SMEDashboardPage from './pages/SMEDashboardPage';
import DashboardOverviewPage from './pages/DashboardOverviewPage';
import BusinessProfileManagementPage from './pages/BusinessProfileManagementPage';
import ProductInventoryPage from './pages/ProductInventoryPage';
import ProductFormPage from './pages/ProductFormPage';
import SMEOrderManagementPage from './pages/SMEOrderManagementPage';
import SMEOrderDetailPage from './pages/SMEOrderDetailPage';
import NotificationsPage from './pages/NotificationsPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Map page */}
            <Route path="/map" element={<MapPage />} />
            
            {/* Product pages */}
            <Route path="/products" element={<ProductSearchPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            
            {/* Business pages */}
            <Route path="/businesses/:id" element={<BusinessProfilePage />} />
            
            <Route path="/orders" element={
              <ProtectedRoute allowedUserTypes={['consumer']}>
                <OrderHistoryPage />
              </ProtectedRoute>
            } />
            
            <Route path="/orders/:orderId" element={
              <ProtectedRoute allowedUserTypes={['consumer']}>
                <OrderDetailPage />
              </ProtectedRoute>
            } />
            
            <Route path="/messages" element={
              <ProtectedRoute>
                <div className="max-w-7xl mx-auto px-4 py-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Messages</h2>
                  <p className="text-gray-600">Messaging interface coming soon...</p>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/notifications" element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            } />
            
            <Route path="/cart" element={
              <ProtectedRoute allowedUserTypes={['consumer']}>
                <CartPage />
              </ProtectedRoute>
            } />
            
            <Route path="/checkout" element={
              <ProtectedRoute allowedUserTypes={['consumer']}>
                <CheckoutPage />
              </ProtectedRoute>
            } />
            
            <Route path="/order-confirmation" element={
              <ProtectedRoute allowedUserTypes={['consumer']}>
                <OrderConfirmationPage />
              </ProtectedRoute>
            } />
            
            <Route path="/profile" element={
              <ProtectedRoute>
                <div className="max-w-7xl mx-auto px-4 py-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile</h2>
                  <p className="text-gray-600">Profile page coming soon...</p>
                </div>
              </ProtectedRoute>
            } />
            
            {/* SME Dashboard Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedUserTypes={['sme']}>
                  <SMEDashboardPage />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardOverviewPage />} />
              <Route path="profile" element={<BusinessProfileManagementPage />} />
              <Route path="products" element={<ProductInventoryPage />} />
              <Route path="products/new" element={<ProductFormPage />} />
              <Route path="products/:productId/edit" element={<ProductFormPage />} />
              <Route path="orders" element={<SMEOrderManagementPage />} />
              <Route path="orders/:orderId" element={<SMEOrderDetailPage />} />
            </Route>
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
