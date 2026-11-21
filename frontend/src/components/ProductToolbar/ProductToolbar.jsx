
import { SlidersHorizontal, ChevronDown } from 'lucide-react';
import './ProductToolbar.css';

const ProductToolbar = ({
  sortBy,
  onSortChange,
  onFilterClick,
}) => {
  return (
    <div className="product-toolbar">
      <div className="product-toolbar-left">
        <button
          type="button"
          className="product-filter-button"
          onClick={onFilterClick}
          aria-label="Open product filters"
        >
          <SlidersHorizontal size={17} strokeWidth={1.8} />
          <span>Filters</span>
        </button>

        <span className="product-toolbar-caption">
          Find your perfect style
        </span>
      </div>

      <div className="product-sort">
        <label htmlFor="product-sort-select">
          Sort by
        </label>

        <div className="product-sort-select-wrap">
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

          <ChevronDown
            size={16}
            strokeWidth={1.8}
            className="product-sort-chevron"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
};

export default ProductToolbar;
