
import { Link } from 'react-router';
import './ProductCard.css';

const ProductCard = ({
  id,
  image,
  name,
  price,
  originalPrice,
  salePrice,
}) => {
  const hasDiscount =
    salePrice != null &&
    originalPrice != null &&
    Number(salePrice) < Number(originalPrice);

  const discount = hasDiscount
    ? Math.round(
        ((Number(originalPrice) - Number(salePrice)) /
          Number(originalPrice)) * 100
      )
    : 0;

  const formatPrice = (amount) =>
    Number(amount).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    });

  return (
    <Link to={`/products/${id}`} className="product-card">
      <div className="product-card-image">
        {hasDiscount && (
          <span className="product-discount-badge">
            {discount}% OFF
          </span>
        )}

        {image ? (
          <img src={image} alt={name} loading="lazy" />
        ) : (
          <div className="product-image-placeholder">
            No image available
          </div>
        )}
      </div>

      <div className="product-card-info">
        <h3>{name}</h3>

        {price != null && (
          <div className="product-card-prices">
            <span className="product-current-price">
              {formatPrice(price)}
            </span>

            {hasDiscount && (
              <span className="product-original-price">
                {formatPrice(originalPrice)}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;
