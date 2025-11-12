import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';

function CartPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { items, removeItem, updateQuantity, clearCart, getItemsByBusiness, getTotalPrice } = useCartStore();
  const [removingItemId, setRemovingItemId] = useState(null);

  const itemsByBusiness = getItemsByBusiness();
  const totalPrice = getTotalPrice();

  const handleRemoveItem = (productId) => {
    setRemovingItemId(productId);
    setTimeout(() => {
      removeItem(productId);
      setRemovingItemId(null);
    }, 200);
  };

  const handleQuantityChange = (productId, newQuantity, maxQuantity) => {
    if (newQuantity < 1) {
      handleRemoveItem(productId);
      return;
    }
    if (newQuantity > maxQuantity) {
      alert(`Only ${maxQuantity} items available in stock`);
      return;
    }
    updateQuantity(productId, newQuantity);
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      return;
    }
    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center">
            <svg
              className="mx-auto h-24 w-24 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Your cart is empty
            </h2>
            <p className="text-gray-600 mb-8">
              Start shopping to add items to your cart
            </p>
            <Link
              to="/products"
              className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Shopping Cart</h1>
          <p className="text-gray-600">
            {items.length} {items.length === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {itemsByBusiness.map((businessGroup) => (
              <div key={businessGroup.businessId} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Business Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <Link
                    to={`/businesses/${businessGroup.businessId}`}
                    className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                  >
                    {businessGroup.businessName}
                  </Link>
                </div>

                {/* Business Items */}
                <div className="divide-y divide-gray-200">
                  {businessGroup.items.map((item) => (
                    <div
                      key={item.product.id}
                      className={`p-4 sm:p-6 transition-opacity ${
                        removingItemId === item.product.id ? 'opacity-50' : 'opacity-100'
                      }`}
                    >
                      <div className="flex items-start space-x-3 sm:space-x-4">
                        {/* Product Image */}
                        <Link
                          to={`/products/${item.product.id}`}
                          className="flex-shrink-0"
                        >
                          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-200 rounded-lg overflow-hidden">
                            {item.product.images && item.product.images.length > 0 ? (
                              <img
                                src={item.product.images[0]}
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <svg
                                  className="w-12 h-12"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>
                        </Link>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/products/${item.product.id}`}
                            className="text-base sm:text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2"
                          >
                            {item.product.name}
                          </Link>
                          
                          {item.product.category && (
                            <p className="text-xs sm:text-sm text-gray-500 mt-1">
                              {item.product.category}
                            </p>
                          )}

                          <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                            {/* Quantity Controls */}
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() =>
                                  handleQuantityChange(
                                    item.product.id,
                                    item.quantity - 1,
                                    item.product.quantity
                                  )
                                }
                                className="w-10 h-10 flex items-center justify-center bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 active:bg-gray-400 transition-colors touch-manipulation"
                              >
                                -
                              </button>
                              <span className="text-gray-900 font-medium w-12 text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  handleQuantityChange(
                                    item.product.id,
                                    item.quantity + 1,
                                    item.product.quantity
                                  )
                                }
                                disabled={item.quantity >= item.product.quantity}
                                className="w-10 h-10 flex items-center justify-center bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 active:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
                              >
                                +
                              </button>
                            </div>

                            {/* Remove Button */}
                            <button
                              onClick={() => handleRemoveItem(item.product.id)}
                              className="text-red-600 hover:text-red-700 active:text-red-800 text-sm font-medium transition-colors touch-manipulation"
                            >
                              Remove
                            </button>
                          </div>

                          {item.quantity > item.product.quantity && (
                            <p className="text-red-600 text-sm mt-2">
                              Only {item.product.quantity} available in stock
                            </p>
                          )}
                        </div>

                        {/* Price */}
                        <div className="text-right flex-shrink-0">
                          <p className="text-lg sm:text-xl font-bold text-gray-900">
                            ${(item.product.price * item.quantity).toFixed(2)}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-500 mt-1">
                            ${item.product.price.toFixed(2)} each
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Clear Cart Button */}
            <div className="flex justify-end">
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear your cart?')) {
                    clearCart();
                  }
                }}
                className="text-red-600 hover:text-red-700 font-medium transition-colors"
              >
                Clear Cart
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 lg:sticky lg:top-20">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal</span>
                  <span className="font-semibold">${totalPrice.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-gray-700">
                  <span>Delivery</span>
                  <span className="text-sm text-gray-500">Calculated at checkout</span>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full px-6 py-3 text-base bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors mb-4 touch-manipulation"
              >
                Proceed to Checkout
              </button>

              <Link
                to="/products"
                className="block w-full px-6 py-3 text-base bg-gray-200 text-gray-700 text-center font-semibold rounded-lg hover:bg-gray-300 active:bg-gray-400 transition-colors touch-manipulation"
              >
                Continue Shopping
              </Link>

              {/* Info Box */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start space-x-3">
                  <svg
                    className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="text-sm text-blue-900">
                    <p className="font-medium mb-1">Note:</p>
                    <p>
                      Your cart contains items from {itemsByBusiness.length}{' '}
                      {itemsByBusiness.length === 1 ? 'business' : 'businesses'}. 
                      Separate orders will be created for each business.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartPage;
