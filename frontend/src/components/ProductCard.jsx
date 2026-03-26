import React, { useContext } from 'react';
import { CartContext } from '../context/CartContext';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

function ProductCard({ product: rawProduct }) {
  const { addToCart } = useContext(CartContext);
  const { translateProduct, t } = useLanguage();
  
  const product = translateProduct(rawProduct);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product); 
  };

  return (
    <div className="product-card">
      <Link to={`/producto/${product.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="product-image">
          {product.image ? (
            <img src={product.image} alt={product.name} loading="lazy" />
          ) : (
            <div style={{ fontSize: '3rem', opacity: 0.2 }}>📦</div>
          )}
        </div>
        
        <div className="product-info">
          <div className="product-category" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: '800', letterSpacing: '1px', color: 'var(--text-muted)' }}>
              {String(product.type || product.categoryId || 'OFICIAL').toUpperCase()}
            </span>
            {product.isDocument && (
               <span style={{ fontSize: '0.6rem', padding: '2px 6px', background: '#dcfce3', color: '#166534', borderRadius: '4px', fontWeight: '900' }}>
                 DIGITAL
               </span>
            )}
          </div>
          
          <h3 className="product-title" style={{ margin: '0 0 0.5rem 0', minHeight: 'auto', height: 'auto', WebkitLineClamp: 1 }}>
            {product.name}
          </h3>
          
          <p style={{ 
            fontSize: '0.8rem', 
            color: 'var(--text-muted)', 
            margin: '0 0 1rem 0', 
            display: '-webkit-box', 
            WebkitLineClamp: 3, 
            WebkitBoxOrient: 'vertical', 
            overflow: 'hidden', 
            lineHeight: '1.5',
            minHeight: '3.6rem'
          }}>
            {product.description || (product.isDocument ? t('impact_desc') : t('impact_desc'))}
          </p>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            fontSize: '0.75rem', 
            marginBottom: '1.2rem',
            padding: '0.5rem',
            background: '#f8fafc',
            borderRadius: '6px',
            color: product.isDocument ? '#0369a1' : (product.stock > 10 ? '#15803d' : '#b91c1c'),
            fontWeight: '600'
          }}>
            <span>{product.isDocument ? t('protection_active') : '📦 ' + t('inventory')}</span>
            <span style={{ opacity: 0.3 }}>|</span>
            <span>{product.isDocument ? 'Unlimited' : `${product.stock} ${t('qty').toLowerCase()}`}</span>
          </div>

          <div className="product-footer" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem', marginTop: '0', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span className="product-price" style={{ marginRight: 'auto' }}>${Number(product.price).toFixed(2)}</span>
            
            <button 
              onClick={(e) => {
                e.preventDefault(); e.stopPropagation();
                const url = `${window.location.origin}/producto/${product.id}`;
                const text = encodeURIComponent(`¡Mira esto en la Tienda Oficial de Defensores CAA!: ${product.name} - ${url}`);
                window.open(`https://wa.me/?text=${text}`, '_blank');
              }}
              style={{ background: '#25D366', color: 'white', border: 'none', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              title="Share on WhatsApp"
            >
              💬
            </button>

            <button 
              className="btn-add-cart" 
              onClick={handleAddToCart}
              style={{ padding: '0.5rem 1rem' }}
            >
              {t('add_to_cart')}
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default ProductCard;
