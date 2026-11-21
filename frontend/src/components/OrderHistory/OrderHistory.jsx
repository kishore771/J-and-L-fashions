
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router';

import {
  ArrowRight,
  CalendarDays,
  Package,
  ShoppingBag,
  IndianRupee,
  Info,
} from 'lucide-react';

import './OrderHistory.css';

const formatCurrency = (amount) => {
  const value = Number(amount);

  if (!Number.isFinite(value)) {
    return `₹${amount ?? '0.00'}`;
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatDate = (dateString) => {
  if (!dateString) return 'Date unavailable';

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable';
  }

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatStatus = (status) => {
  if (!status) return 'Unknown';

  return String(status)
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
};

const OrderHistory = () => {
  const { isAuthenticated, authLoading } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;

    const controller = new AbortController();

    const fetchOrders = async () => {
      setLoading(true);
      setError('');
      setOrders([]);

      try {
        const response = await fetch(
          '/api/orders/history/',
          {
            credentials: 'include',
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(
            'Unable to load your orders.'
          );
        }

        const data = await response.json();

        if (!controller.signal.aborted) {
          setOrders(
            Array.isArray(data.orders)
              ? data.orders
              : []
          );
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err.message || 'Something went wrong.'
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchOrders();

    return () => controller.abort();
  }, [authLoading, isAuthenticated]);

  if (authLoading || loading) {
    return (
      <div
        className="order-history-feedback"
        role="status"
      >
        <div className="order-history-spinner" />

        <p>Loading your orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="order-history-feedback order-history-error"
        role="alert"
      >
        <Info size={25} />

        <h3>Unable to load orders</h3>

        <p>{error}</p>
      </div>
    );
  }

  return (
    <section className="order-history">

      {orders.length === 0 ? (
        <div className="order-history-empty">
          <div className="order-history-empty-icon">
            <ShoppingBag size={30} />
          </div>

          <h3>No Orders Yet</h3>

          <p>
            {isAuthenticated
              ? "You haven't placed any orders yet. Your shopping journey starts here."
              : 'No guest orders were found in this browser session.'}
          </p>

          <Link
            to="/"
            className="order-history-shop-button"
          >
            Continue Shopping
            <ArrowRight size={17} />
          </Link>
        </div>
      ) : (
        <div className="order-history-list">
          {orders.map((order) => {
            const status = String(
              order.status || 'unknown'
            ).toLowerCase();

            const items = Array.isArray(order.items)
              ? order.items
              : [];

            const itemCount = items.reduce(
              (total, item) =>
                total + (Number(item.quantity) || 0),
              0
            );

            return (
              <article
                key={order.id}
                className="order-history-card"
              >

                {/* ORDER HEADER */}

                <div className="order-history-card-header">

                  <div className="order-history-order-info">
                    <div className="order-history-order-icon">
                      <Package size={21} />
                    </div>

                    <div>
                      <span className="order-history-label">
                        ORDER NUMBER
                      </span>

                      <h3>Order #{order.id}</h3>
                    </div>
                  </div>

                  <span
                    className={
                      `order-history-status ` +
                      `order-history-status--${status}`
                    }
                  >
                    <span className="order-history-status-dot" />
                    {formatStatus(order.status)}
                  </span>

                </div>

                {/* ORDER META */}

                <div className="order-history-meta">

                  <div className="order-history-meta-item">
                    <CalendarDays size={16} />

                    <span>
                      Placed on{' '}
                      <strong>
                        {formatDate(order.created_at)}
                      </strong>
                    </span>
                  </div>

                  <div className="order-history-meta-item">
                    <ShoppingBag size={16} />

                    <span>
                      <strong>{itemCount}</strong>{' '}
                      {itemCount === 1
                        ? 'Item'
                        : 'Items'}
                    </span>
                  </div>

                </div>

                {/* ORDER PRODUCTS */}

                {items.length > 0 && (
                  <div className="order-history-products">
                    <p className="order-history-products-title">
                      ITEMS IN THIS ORDER
                    </p>

                    <ul>
                      {items.map((item, index) => (
                        <li
                          key={
                            item.id ??
                            `${order.id}-${index}`
                          }
                        >
                          <span className="order-history-product-marker">
                            <ShoppingBag size={15} />
                          </span>

                          <div className="order-history-product-details">
                            <strong>
                              {item.product_name ||
                                'Product'}
                            </strong>

                            <span>
                              Size: {item.size || 'One Size'}
                              {' · '}
                              Qty: {item.quantity}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* ORDER FOOTER */}

                <div className="order-history-card-footer">

                  <div className="order-history-total">
                    <span>ORDER TOTAL</span>

                    <strong>
                      {formatCurrency(
                        order.total_amount
                      )}
                    </strong>
                  </div>

                  <Link
                    to={`/my-orders/${order.id}`}
                    className="order-history-view"
                  >
                    View Order Details
                    <ArrowRight size={17} />
                  </Link>

                </div>

              </article>
            );
          })}
        </div>
      )}

      {!isAuthenticated && (
        <p className="order-history-note">
          Guest orders are available only while your
          original checkout browser session is retained.
          Clearing cookies or switching browsers may
          prevent access.
        </p>
      )}

    </section>
  );
};

export default OrderHistory;
