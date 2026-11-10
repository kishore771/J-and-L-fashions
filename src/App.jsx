
import { BrowserRouter, Routes, Route } from 'react-router';
import UnderConstruction from './pages/UnderConstruction/UnderConstruction';
import MainLayout from './layouts/MainLayout/MainLayout';
import Home from './pages/Home/Home';
import ContactUs from './pages/ContactUs/ContactUs';

function App() {
  return (
    <BrowserRouter>
  <Routes>
    <Route path="/" element={<MainLayout />}>
      <Route index element={<Home />} />
      <Route path="contact" element={<ContactUs />} />
      <Route path="men" element={<UnderConstruction />} />
      <Route path="women" element={<UnderConstruction />} />
      <Route path="collections" element={<UnderConstruction />} />
      <Route path="about" element={<UnderConstruction />} />
    </Route>
  </Routes>
</BrowserRouter>
  );
}

export default App;
