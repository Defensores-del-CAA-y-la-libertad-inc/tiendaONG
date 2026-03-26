import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import API_BASE_URL from '../config/api';
import { useLanguage } from '../context/LanguageContext';

const API_URL = `${API_BASE_URL}/api/products`;

function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const response = await fetch(API_URL);
      if (response.ok) {
        const data = await response.json();
        setFeaturedProducts(data.slice(0, 3));
      }
    } catch (error) {
      console.error("No se pudo conectar al servidor oficial:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <section className="hero">
        <h1 className="animate-fade-in" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
          Defensores CAA Fundraising Store
        </h1>
        <p className="animate-fade-in" style={{ animationDelay: '0.2s', fontSize: '1.2rem', marginBottom: '2rem' }}>
          {t('impact_desc')}
        </p>
        <Link to="/catalogo" className="btn btn-hero animate-fade-in" style={{ animationDelay: '0.4s' }}>
          {t('shop_now')} & {t('donate')}
        </Link>
        <div className="hero-footer-text animate-fade-in" style={{ animationDelay: '0.6s', marginTop: '2rem' }}>
          100% of sales fund our missions.
        </div>
      </section>

      {/* Sección Inteligente de Productos Más Vendidos */}
      <section className="container animate-fade-in" style={{ padding: '4rem 5% 0' }}>
        <h2 className="section-title" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>🔥 Los Más Vendidos</h2>
        
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            Obteniendo inventario destacado...
          </div>
        ) : featuredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            <p>Aún no hay mercancía registrada en la base de datos.</p>
          </div>
        ) : (
          <div className="products-grid" style={{ marginBottom: '1.5rem' }}>
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
        
        <div style={{ textAlign: 'center', marginBottom: '5rem', marginTop: '1rem' }}>
           <Link to="/catalogo" style={{ color: 'var(--primary-blue)', fontWeight: 'bold', textDecoration: 'none', borderBottom: '2px solid transparent', paddingBottom: '0.2rem', transition: 'border-color 0.2s' }}
                 onMouseEnter={(e) => e.target.style.borderColor = 'var(--primary-blue)'}
                 onMouseLeave={(e) => e.target.style.borderColor = 'transparent'}>
             Explorar toda la colección →
           </Link>
        </div>
      </section>

      <section className="container" style={{ padding: '0 5% 5rem', textAlign: 'center' }}>
        <h2 className="section-title">¿Cómo ayudas comprando?</h2>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={{ maxWidth: '300px', background: 'var(--surface-color)', padding: '2rem', borderRadius: '16px', boxShadow: 'var(--shadow-md)', transition: 'transform 0.3s' }}
               onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
               onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛒</div>
            <h3 style={{ color: 'var(--primary-blue)', marginBottom: '0.5rem' }}>1. Elige tu mercancía</h3>
            <p className="product-description">Explora nuestra colección de prendas protectoras y equipo original.</p>
          </div>
          <div style={{ maxWidth: '300px', background: 'var(--surface-color)', padding: '2rem', borderRadius: '16px', boxShadow: 'var(--shadow-md)', transition: 'transform 0.3s' }}
               onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
               onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💳</div>
            <h3 style={{ color: 'var(--primary-blue)', marginBottom: '0.5rem' }}>2. Compra Segura</h3>
            <p className="product-description">Llena tu carrito y adquiere tus ítems procesados por Stripe.</p>
          </div>
          <div style={{ maxWidth: '300px', background: 'var(--surface-color)', padding: '2rem', borderRadius: '16px', boxShadow: 'var(--shadow-md)', transition: 'transform 0.3s' }}
               onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
               onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🕊️</div>
            <h3 style={{ color: 'var(--primary-blue)', marginBottom: '0.5rem' }}>3. Defiende Causas</h3>
            <p className="product-description">Cada compra nutre directamente el fondo operacional de la ONG.</p>
          </div>
        </div>
      </section>
    </>
  );
}

export default Home;
