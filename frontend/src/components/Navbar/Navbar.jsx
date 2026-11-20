import TransparentLogo from '../../assets/logos/Transparent-logo.png';
import { UserRound, Heart, ShoppingCart, Search, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import './Navbar.css';

const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { cartCount } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get('search') || '';

    setSearchQuery(query);
  }, [location.search, location.pathname]);

  const handleSearch = (e) => {
    e.preventDefault();

    const query = searchQuery.trim();

    if (!query) return;

    navigate(`/collections?search=${encodeURIComponent(query)}`);
  };
  return (
    <nav className="navbar">
        <div className="navbar-main">
        <div className="navbar-logo">
            <Link to="/">
                <img src={TransparentLogo} className="navbar-logo-img" alt="J & L Fashions" />
            </Link>
        </div>

      <form className="navbar-search" onSubmit={handleSearch}>
        <Search size={18} className="navbar-search-icon" />

        <input
          type="search"
          placeholder="Search products..."
          className="navbar-search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search products"
        />

        {searchQuery && (
          <button
            type="button"
            className="navbar-search-clear"
            onClick={() => setSearchQuery('')}
            aria-label="Clear search"
          >
            <X size={17} />
          </button>
        )}
      </form>

       <div className="navbar-icons">


  <Link to="/wishlist" className="navbar-icon">
    <Heart />
  </Link>

    <Link
    to="/cart"
    className="navbar-icon navbar-cart"
    aria-label={`Shopping cart with ${cartCount} items`}
  >
    <ShoppingCart size={24} strokeWidth={1.8} />

    {cartCount > 0 && (
      <span className="cart-count">
        {cartCount > 99 ? '99+' : cartCount}
      </span>
    )}
  </Link>
  <Link
    to={isAuthenticated ? '/profile' : '/login'}
    className="navbar-icon"
    aria-label={isAuthenticated ? 'My profile' : 'Sign in'}
    title={isAuthenticated ? 'My Profile' : 'Sign In'}
  >
    <UserRound />
  </Link>
</div>
</div>


<div className="navbar-navigation">
  <NavLink to="/" end>Home</NavLink>
  <NavLink to="/men">Men</NavLink>
  <NavLink to="/women">Women</NavLink>
  <NavLink to="/kids">Kids</NavLink>
  <NavLink to="/collections">Collections</NavLink>
  <NavLink to="/jewellery">Jewellery</NavLink>
  <NavLink to="/accessories">Accessories</NavLink>
  <NavLink to="/about">About</NavLink>
  <NavLink to="/contact">Contact</NavLink>
</div>

    </nav>
  );
}

export default Navbar;