import { BrowserRouter, Routes, Route } from 'react-router';

import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import AdminLogin from './pages/AdminLogin/AdminLogin';
import DashboardLayout from './layouts/DashboardLayout/DashboardLayout';
import Dashboard from './pages/Dashboard/Dashboard';
import Products from './pages/Products/Products';
import BulkUpload from './pages/BulkUpload/BulkUpload';
import AddProduct from './pages/AddProduct/AddProduct';
import EditProduct from './pages/EditProduct/EditProduct';
import ProductManagement from "./pages/ProductManagement/ProductManagement";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<DashboardLayout />}>
            <Route path="dashboard" element={<Dashboard />} />

            <Route path="products" element={<Products />} />

            <Route path="products/add" element={<AddProduct />} />
            <Route path="products/:id/edit" element={<EditProduct />} />
            <Route
                path="products/bulk-upload"
                element={<BulkUpload />}
              />

          </Route>
          <Route path="/products" element={<ProductManagement />} />
        </Route>

        <Route path="*" element={<h1>Page Not Found</h1>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;