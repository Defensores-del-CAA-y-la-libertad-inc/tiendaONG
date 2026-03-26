import React, { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import API_BASE_URL from '../config/api';

const API_URL = `${API_BASE_URL}/api/products`;

function Catalog() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('physical'); // physical as default, all, digital

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch(API_URL);
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("No se pudo conectar al servidor oficial:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    if (filter === 'all') return true;
    if (filter === 'physical') return !p.isDocument;
    if (filter === 'digital') return p.isDocument;
    return true;
  });

  return (
    <section className="container" style={{ padding: '3rem 5%' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h2 className="section-title">Nuestra Colección</h2>
        
        {/* Filtros de Categoría */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
          <button 
            onClick={() => setFilter('all')}
            className={`btn ${filter === 'all' ? 'btn-primary' : ''}`}
            style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem', background: filter === 'all' ? '' : 'white', border: '1px solid #e2e8f0', color: filter === 'all' ? 'white' : 'var(--text-dark)' }}
          >
            Ver Todo
          </button>
          <button 
            onClick={() => setFilter('physical')}
            className={`btn ${filter === 'physical' ? 'btn-primary' : ''}`}
            style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem', background: filter === 'physical' ? '' : 'white', border: '1px solid #e2e8f0', color: filter === 'physical' ? 'white' : 'var(--text-dark)' }}
          >
            👕 Mercancía Oficial
          </button>
          <button 
            onClick={() => setFilter('digital')}
            className={`btn ${filter === 'digital' ? 'btn-primary' : ''}`}
            style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem', background: filter === 'digital' ? '' : 'white', border: '1px solid #e2e8f0', color: filter === 'digital' ? 'white' : 'var(--text-dark)' }}
          >
            📄 Documentos & Guías
          </button>
        </div>
      </div>
      
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <h3>Sincronizando inventario oficial...</h3>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <h3>No hay artículos en esta categoría por ahora.</h3>
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}

export default Catalog;
