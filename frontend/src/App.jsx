
import { BrowserRouter, Routes, Route } from 'react-router';
import UnderConstruction from './pages/UnderConstruction/UnderConstruction';
import MainLayout from './layouts/MainLayout/MainLayout';
import Home from './pages/Home/Home';
import ContactUs from './pages/ContactUs/ContactUs';
import ProductDetails from './pages/ProductDetails/ProductDetails';
import Products from './pages/Products/Products';
import Cart from './pages/Cart/Cart';
import Checkout from './pages/Checkout/Checkout';

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
    </Route>
  </Routes>
</BrowserRouter>
  );
}

export default App;
