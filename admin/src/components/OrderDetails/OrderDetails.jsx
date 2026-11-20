import './OrderDetails.css';

import { useContext, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import {
  updateOrderStatus,
  cancelOrder,
} from '../../services/api';

const OrderDetails = ({ order, onClose, onStatusUpdated }) => {
  const { token } = useContext(AuthContext);
  const [updating, setUpdating] = useState(false);
  const [statusError, setStatusError] = useState('');

  const nextStatuses = {
    pending: 'confirmed',
    confirmed: 'processing',
    processing: 'shipped',
    shipped: 'delivered',
  };

  const nextStatus = order ? nextStatuses[order.status] : null;

  const handleStatusUpdate = async () => {
    if (!order || !nextStatus || updating) return;

    const confirmed = window.confirm(
      `Change order #${order.id} from ${order.status} to ${nextStatus}?`
    );

    if (!confirmed) return;

    try {
      setUpdating(true);
      setStatusError('');

      const result = await updateOrderStatus(
        token,
        order.id,
        nextStatus
      );

      onStatusUpdated(order.id, result.status);
    } catch (error) {
      setStatusError(error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelOrder = async () => {
  if (!order || updating) return;

  const confirmed = window.confirm(
    `Are you sure you want to cancel order #${order.id}? The purchased stock will be restored.`
  );

  if (!confirmed) return;

  try {
    setUpdating(true);
    setStatusError('');

    const result = await cancelOrder(token, order.id);

    onStatusUpdated(order.id, result.status);
  } catch (error) {
    setStatusError(error.message);
  } finally {
    setUpdating(false);
  }
};

  if (!order) return null;

  const formatPrice = (amount) =>
    `₹${Number(amount).toLocaleString('en-IN')}`;

  return (
    <section className="order-details">
      <div className="order-details-header">
        <h2>Order #{order.id}</h2>

        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>

      <h3>Customer Information</h3>
      <p>Name: {order.full_name}</p>
      <p>Email: {order.email}</p>
      <p>Phone: {order.phone}</p>

      <h3>Delivery Address</h3>
      <p>
        {[
          order.address,
          order.apartment,
          order.city,
          order.state,
          order.pincode,
        ]
          .filter(Boolean)
          .join(', ')}
      </p>

      <h3>Ordered Products</h3>

      {order.items?.map((item) => (
        <div key={item.id} className="order-details-item">
          <p>
            {item.product_name} ({item.colour}, {item.size})
          </p>

          <p>
            Quantity: {item.quantity} | Total: {formatPrice(item.total_price)}
          </p>
        </div>
      ))}

      <h3>Payment Summary</h3>
      <p>Subtotal: {formatPrice(order.subtotal)}</p>
      <p>Shipping: {formatPrice(order.shipping_charge)}</p>
      <p>Total: {formatPrice(order.total_amount)}</p>
      <p>Payment Method: {order.payment_method}</p>
      <p>Payment Status: {order.payment_status}</p>
      <p>Order Status: {order.status}</p>

      <div className="order-status-management">
  <h3>Manage Order Status</h3>

  <p>
    Current Status: <strong>{order.status}</strong>
  </p>

  {nextStatus ? (
    <button
      type="button"
      onClick={handleStatusUpdate}
      disabled={updating}
    >
      {updating
        ? 'Updating...'
        : `Mark as ${nextStatus}`}
    </button>
  ) : (
    <p>No further status updates available.</p>
  )}

  {statusError && (
    <p role="alert" className="order-status-error">
      {statusError}
    </p>
  )}
</div>
{order.payment_method === 'cod' &&
  ['confirmed', 'processing'].includes(order.status) && (
    <button
      type="button"
      className="cancel-order-btn"
      onClick={handleCancelOrder}
      disabled={updating}
    >
      {updating ? 'Cancelling...' : 'Cancel Order'}
    </button>
  )}
    </section>
  );
};

export default OrderDetails;