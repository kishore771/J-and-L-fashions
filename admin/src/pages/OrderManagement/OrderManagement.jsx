
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getOrders } from '../../services/api';
import OrderDetails from '../../components/OrderDetails/OrderDetails';
import './OrderManagement.css';

const OrderManagement = () => {
  const { token } = useContext(AuthContext);

  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch customer orders
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
          setOrders(
            Array.isArray(data) ? data : data.results || []
          );
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

  // Update order status in the table and details panel
  const handleStatusUpdated = (orderId, newStatus) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === orderId
          ? { ...order, status: newStatus }
          : order
      )
    );

    setSelectedOrder((prevOrder) =>
      prevOrder?.id === orderId
        ? { ...prevOrder, status: newStatus }
        : prevOrder
    );
  };

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
        <div className="orders-table-wrapper">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Total Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Order Date</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>#{order.id}</td>

                  <td>{order.full_name}</td>

                  <td>
                    ₹{Number(order.total_amount).toLocaleString('en-IN')}
                  </td>

                  <td>{order.payment_method}</td>

                  <td>
                    <span
                      className={`order-status status-${order.status}`}
                    >
                      {order.status}
                    </span>
                  </td>

                  <td>
                    {new Date(order.created_at).toLocaleDateString('en-IN')}
                  </td>

                  <td>
                    <button
                      type="button"
                      className="view-order-btn"
                      onClick={() => setSelectedOrder(order)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <OrderDetails
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onStatusUpdated={handleStatusUpdated}
      />
    </div>
  );
};

export default OrderManagement;
