import './Products.css';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { getProducts, deactivateProduct } from '../../services/api';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

const Products = () => {
    const { token } = useContext(AuthContext);
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [totalProducts, setTotalProducts] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchProducts = async () => {
          setIsLoading(true);
          setError('');
            try {
                const data = await getProducts(token, currentPage);
                setProducts(data.results ?? []);
                setHasNextPage(Boolean(data.next));
                setTotalProducts(data.count ?? 0);
            } catch (error) {
                setError(error.message);
            } finally {
                setIsLoading(false);
            }
        };

    fetchProducts();
    }, [token, currentPage]);

    const handleDeactivate = async (id) => {
  const confirmed = window.confirm(
    'Are you sure you want to deactivate this product?'
  );

  if (!confirmed) return;

  try {
    await deactivateProduct(id, token);

    setProducts((previousProducts) =>
      previousProducts.filter((product) => product.id !== id)
    );
  } catch (error) {
    setError(error.message);
  }
};
const totalPages = Math.ceil(totalProducts / 10);
return (
  <div className="products-page">
    <div className="products-page-header">
      <div>
        <h1>Products</h1>
        <p>Manage your J&L Fashions product catalogue.</p>
      </div>
      <div className="products-search">
  <input
    type="text"
    placeholder="Search products by name or SKU..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="products-search-input"
  />
</div>

      <Link to="/admin/products/add" className="add-product-btn">
  Add Product
</Link>
    </div>

    {isLoading && <p>Loading products...</p>}

    {error && <p>{error}</p>}

    {!isLoading && !error && products.length === 0 && (
      <p>No products found.</p>
    )}

    {!isLoading && !error && products.length > 0 && (
      <table className="products-table">
        <thead>
          <tr>
            <th>Product Name</th>
            <th>SKU</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>{product.name}</td>
              <td>{product.sku}</td>
              <td>
                {product.is_active ? 'Active' : 'Inactive'}
              </td>
              <td>
                <Link to={`/admin/products/${product.id}/edit`}>
                    Edit
                    </Link>
                <button onClick={() => handleDeactivate(product.id)}>
                    Deactivate
                    </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

    )}
    <div className="products-pagination">
  <button
    onClick={() => setCurrentPage((prev) => prev - 1)}
    disabled={currentPage === 1}
  >
    Previous
  </button>

  <span>
  Page {currentPage} of {totalPages} | Total Products: {totalProducts}
</span>

  <button
  onClick={() => setCurrentPage((prev) => prev + 1)}
  disabled={!hasNextPage || isLoading}
>
  Next
</button>
</div>
  </div>
);
};

export default Products;