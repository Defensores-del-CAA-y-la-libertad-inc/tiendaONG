import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';

function Navbar() {
  const { totalItems } = useContext(CartContext);
  const { toggleLanguage, lang, t } = useLanguage();

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <img src="https://defensorescaa.org/assets/logo-DavfNbZk.png" alt="Defensores CAA Logo" style={{ height: '50px' }} />
      </Link>
      <div className="navbar-links">
        <Link to="/" className="nav-link">{t('home')}</Link>
        <Link to="/catalogo" className="nav-link">{t('catalog')}</Link>
        <Link to="/documentos" className="nav-link">{t('documents')}</Link>
        <a href="https://defensorescaa.org/take-action" target="_blank" rel="noopener noreferrer" className="nav-link" style={{ fontWeight: 'bold', color: 'var(--primary-red)' }}>{t('donate')}</a>
        
        <Link to="/carrito" className="btn btn-accent">
          {t('cart')} <span className="cart-badge">{totalItems > 0 ? `(${totalItems})` : ''}</span>
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;
