import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './OrderHistory.css';

const OrderHistory = () => {
  const { isAuthenticated } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchOrders = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch('/api/accounts/orders/', {
          credentials: 'include',
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Unable to load your orders.');
        }

        const data = await response.json();

        setOrders(
          Array.isArray(data) ? data : data.results || []
        );
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchOrders();

    return () => controller.abort();
  }, [isAuthenticated]);

  if (loading) {
    return <p>Loading your orders...</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  return (
    <section className="order-history">
      <h2>My Orders</h2>

      {orders.length === 0 ? (
        <p>You haven't placed any orders yet.</p>
      ) : (
        orders.map((order) => (
          <article
            key={order.id}
            className="order-history-card"
          >
            <h3>Order #{order.id}</h3>

            <p>Status: {order.status}</p>

            <p>Total: ₹{order.total_amount}</p>

            <p>
              Placed on:{' '}
              {new Date(order.created_at).toLocaleDateString('en-IN')}
            </p>

            <ul>
              {order.items?.map((item) => (
                <li key={item.id}>
                  {item.product_name} ({item.size || 'One Size'})
                  {' '}× {item.quantity}
                </li>
              ))}
            </ul>
          </article>
        ))
      )}
    </section>
  );
};

export default OrderHistory;