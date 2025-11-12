import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import orderService from '../services/orderService';
import ConsumerTrustScore from '../components/ConsumerTrustScore';

function SMEOrderManagementPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, active, completed, cancelled
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await orderService.getOrders();
      setOrders(response.orders || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    setError(null);

    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      // Update local state
      setOrders(
        orders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (err) {
      console.error('Error updating order status:', err);
      setError('Failed to update order status');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleAcceptOrder = (orderId) => {
    handleUpdateStatus(orderId, 'confirmed');
  };

  const handleRejectOrder = (orderId) => {
    if (window.confirm('Are you sure you want to reject this order?')) {
      handleUpdateStatus(orderId, 'cancelled');
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return order.status === 'pending';
    if (filter === 'active') return ['confirmed', 'ready', 'out_for_delivery'].includes(order.status);
    if (filter === 'completed') return order.status === 'delivered';
    if (filter === 'cancelled') return order.status === 'cancelled';
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Order Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            View and manage customer orders
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setFilter('all')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  filter === 'all'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                All Orders ({orders.length})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  filter === 'pending'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                Pending ({orders.filter((o) => o.status === 'pending').length})
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  filter === 'active'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                Active (
                {orders.filter((o) => ['confirmed', 'ready', 'out_for_delivery'].includes(o.status)).length}
                )
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  filter === 'completed'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                Completed ({orders.filter((o) => o.status === 'delivered').length})
              </button>
              <button
                onClick={() => setFilter('cancelled')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  filter === 'cancelled'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                Cancelled ({orders.filter((o) => o.status === 'cancelled').length})
              </button>
            </nav>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-red-600 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg
              className="mx-auto h-24 w-24 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {filter === 'all' ? 'No orders yet' : `No ${filter} orders`}
            </h3>
            <p className="text-gray-600">
              {filter === 'all'
                ? 'Orders from customers will appear here'
                : `You don't have any ${filter} orders at the moment.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onAccept={handleAcceptOrder}
                onReject={handleRejectOrder}
                onUpdateStatus={handleUpdateStatus}
                isUpdating={updatingOrderId === order.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OrderCard({ order, onAccept, onReject, onUpdateStatus, isUpdating }) {
  const orderDate = new Date(order.createdAt);
  const isPending = order.status === 'pending';
  const isActive = ['confirmed', 'ready', 'out_for_delivery'].includes(order.status);

  const getNextStatus = () => {
    const statusFlow = {
      confirmed: 'ready',
      ready: 'out_for_delivery',
      out_for_delivery: 'delivered',
    };
    return statusFlow[order.status];
  };

  const getNextStatusLabel = () => {
    const labels = {
      ready: 'Mark as Ready',
      out_for_delivery: 'Mark Out for Delivery',
      delivered: 'Mark as Delivered',
    };
    return labels[getNextStatus()];
  };

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="p-6">
        {/* Order Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <div className="mb-2 sm:mb-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Order #{order.id.slice(0, 8)}
            </h3>
            <p className="text-sm text-gray-600">
              Placed on {orderDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
              order.status
            )}`}
          >
            {getStatusLabel(order.status)}
          </span>
        </div>

        {/* Customer Info */}
        {order.consumerEmail && (
          <div className="mb-4 pb-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">
                Customer: <span className="font-medium text-gray-900">{order.consumerEmail}</span>
              </p>
            </div>
            {order.consumerId && (
              <ConsumerTrustScore consumerId={order.consumerId} compact={true} />
            )}
          </div>
        )}

        {/* Order Items */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Order Items</h4>
          <div className="space-y-2">
            {order.items && order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {item.quantity}x {item.productName || `Product ${item.productId.slice(0, 8)}`}
                </span>
                <span className="font-medium text-gray-900">
                  ${(item.priceAtPurchase * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Order Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-gray-200">
          <div className="mb-3 sm:mb-0">
            <p className="text-sm text-gray-600">Total Amount</p>
            <p className="text-xl font-bold text-gray-900">
              ${order.totalAmount.toFixed(2)}
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-3">
            {isPending && (
              <>
                <button
                  onClick={() => onAccept(order.id)}
                  disabled={isUpdating}
                  className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? 'Processing...' : 'Accept'}
                </button>
                <button
                  onClick={() => onReject(order.id)}
                  disabled={isUpdating}
                  className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reject
                </button>
              </>
            )}
            
            {isActive && getNextStatus() && (
              <button
                onClick={() => onUpdateStatus(order.id, getNextStatus())}
                disabled={isUpdating}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? 'Updating...' : getNextStatusLabel()}
              </button>
            )}
            
            <Link
              to={`/dashboard/orders/${order.id}`}
              className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm inline-flex items-center"
            >
              View Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function getStatusColor(status) {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    ready: 'bg-purple-100 text-purple-800',
    out_for_delivery: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

function getStatusLabel(status) {
  const labels = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    ready: 'Ready for Pickup',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };
  return labels[status] || status;
}

export default SMEOrderManagementPage;
