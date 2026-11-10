import TransparentLogo from '../../assets/logos/Transparent-logo.png';
import { UserRound, Heart, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
        <div className="navbar-main">
        <div className="navbar-logo">
            <Link to="/">
                <img src={TransparentLogo} className="navbar-logo-img" alt="J & L Fashions" />
            </Link>
        </div>
        <div className="navbar-search">
            <input type="text" placeholder="Search..." className="navbar-search-input" />
        </div>
       <div className="navbar-icons">
  

  <Link to="/wishlist" className="navbar-icon">
    <Heart />
  </Link>

  <Link to="/cart" className="navbar-icon">
    <ShoppingBag />
  </Link>
  <Link to="/profile" className="navbar-icon">
    <UserRound />
  </Link>
</div>
</div>

<div className="navbar-navigation">
  <Link to="/">Home</Link>
  <Link to="/men">Men</Link>
  <Link to="/women">Women</Link>
  <Link to="/collections">Collections</Link>
  <Link to="/about">About</Link>
  <Link to="/contact">Contact</Link>
</div>
    </nav>
  );
}

export default Navbar;