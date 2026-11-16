
import './ProductToolbar.css';

const ProductToolbar = ({ sortBy, onSortChange, onFilterClick }) => {
  return (
    <div className="product-toolbar">
      <button
        type="button"
        className="product-filter-button"
        onClick={onFilterClick}
      >
        Filters
      </button>

      <div className="product-sort">
        <label htmlFor="product-sort-select">Sort by:</label>

        <select
          id="product-sort-select"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
        >
          <option value="default">Featured</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="newest">Newest Arrivals</option>
        </select>
      </div>
    </div>
  );
};

export default ProductToolbar;
