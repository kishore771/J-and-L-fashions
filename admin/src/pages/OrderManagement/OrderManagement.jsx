
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getOrders } from '../../services/api';
import './OrderManagement.css';

const OrderManagement = () => {
  const { token } = useContext(AuthContext);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let active = true;

    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError('');

        const data = await getOrders(token);

        if (active) {
          setOrders(Array.isArray(data) ? data : data.results || []);
        }
      } catch (err) {
        if (active) {
          setError(err.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchOrders();

    return () => {
      active = false;
    };
  }, [token]);

  if (loading) {
    return <p>Loading customer orders...</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  return (
    <div className="order-management">
      <h1>Order Management</h1>

      <p>Total Orders: {orders.length}</p>

      {orders.length === 0 ? (
        <p>No customer orders found.</p>
      ) : (
        <p>Orders loaded successfully!</p>
      )}
    </div>
  );
};

export default OrderManagement;
