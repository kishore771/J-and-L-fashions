import { Link } from 'react-router';

import './ProductCard.css';


const ProductCard = ({ id, image, name, price }) => {
  return (
    <Link to={`/products/${id}`} className="product-card">
      <div className="product-card-image" >
        <img src={image} alt={name} />
      </div>

      <div className="product-card-info">
        <h3>{name}</h3>
        <p>₹{price}</p>
      </div>
    </Link>
  );
};

export default ProductCard;