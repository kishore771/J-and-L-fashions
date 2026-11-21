
import { BrowserRouter, Routes, Route } from 'react-router';
import UnderConstruction from './pages/UnderConstruction/UnderConstruction';
import MainLayout from './layouts/MainLayout/MainLayout';
import Home from './pages/Home/Home';
import ContactUs from './pages/ContactUs/ContactUs';
import ProductDetails from './pages/ProductDetails/ProductDetails';
import Products from './pages/Products/Products';
import Cart from './pages/Cart/Cart';
import Checkout from './pages/Checkout/Checkout';
import Login from './pages/Login/Login';
import Profile from './pages/Profile/Profile'
import Register from './pages/Register/Register';
import OrderDetails from './pages/OrderDetails/OrderDetails';
import MyOrders from './pages/MyOrders/MyOrders';
import Wishlist from './pages/Wishlist/Wishlist';

function App() {
  return (
    <BrowserRouter>
  <Routes>
    <Route path="/" element={<MainLayout />}>
      <Route index element={<Home />} />
      <Route path="contact" element={<ContactUs />} />
      <Route path="men" element={<Products />} />
      <Route path="women" element={<Products />} />
      <Route path="kids" element={<Products />} />
      <Route path="jewellery" element={<Products />} />
      <Route path="accessories" element={<Products />} />
      <Route path="collections" element={<Products />} />
      <Route path="products/:id" element={<ProductDetails />} />
      <Route path="about" element={<UnderConstruction />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="checkout" element={<Checkout />} />
      <Route path="login" element={<Login />} />
      <Route path="profile" element={<Profile />} />
      <Route path="register" element={<Register />} />
      <Route path="my-orders/:orderId" element={<OrderDetails />}/>
      <Route path="my-orders" element={<MyOrders />} />
      <Route path="wishlist" element={<Wishlist />} />
    </Route>
  </Routes>
</BrowserRouter>
  );
}

export default App;
