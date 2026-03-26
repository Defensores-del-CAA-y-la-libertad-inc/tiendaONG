import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import API_BASE_URL from '../config/api';

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('M');
  const [quantity, setQuantity] = useState(1);
  const [customerNote, setCustomerNote] = useState('');
  const [showNoteError, setShowNoteError] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/products/${id}`);
        if (!response.ok) throw new Error('Articulo no encontrado');
        const data = await response.json();
        setProduct(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    // Si requiere nota y está vacía, mostrar error
    if (product.requiresNote && !customerNote.trim()) {
      setShowNoteError(true);
      return;
    }

    // Si el producto tiene habilitadas las tallas, le anexamos la talla seleccionada
    // Si tiene nota, la agregamos al objeto
    const productToAdd = { 
      ...product, 
      name: product.hasSizes ? `${product.name} (Talla: ${selectedSize})` : product.name,
      customerNote: product.requiresNote ? customerNote.trim() : ''
    };
    
    // Lo agregamos tantas veces como indique la cantidad
    for(let i=0; i < quantity; i++){
      addToCart(productToAdd);
    }
    
    // Navegar al carrito tras añadir
    navigate('/carrito');
  };

  if (loading) {
    return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><h3 style={{ color: 'var(--text-muted)' }}>Obteniendo especificaciones oficiales...</h3></div>;
  }

  if (!product) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h2>El artículo solicitado no existe.</h2>
        <Link to="/catalogo" className="btn btn-primary">Volver al Catálogo</Link>
      </div>
    );
  }

  const isRopa = product.hasSizes === true;

  return (
    <div className="container animate-fade-in" style={{ padding: '4rem 5%', minHeight: '80vh' }}>
      <Link to="/catalogo" style={{ display: 'inline-block', marginBottom: '2rem', color: 'var(--text-muted)', textDecoration: 'none', fontWeight: '500' }}>← Volver a la Colección</Link>
      
      <div className="product-detail-layout" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '4rem', alignItems: 'start' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: 'var(--surface-color)', borderRadius: '24px', padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', boxShadow: 'var(--shadow-sm)' }}>
            {product.image ? (
              <img 
                src={product.image} 
                alt={product.name} 
                style={{ width: '100%', height: 'auto', maxHeight: '500px', objectFit: 'contain', borderRadius: '12px' }} 
              />
            ) : (
              <div style={{ fontSize: '5rem', color: 'var(--border-color)' }}>📦</div>
            )}
          </div>
          <button 
                onClick={() => {
                   const text = encodeURIComponent(`¡Mira esto en la Tienda Oficial de Defensores CAA!: ${product.name}. Apoyemos la causa: ${window.location.href}`);
                   window.open(`https://wa.me/?text=${text}`, '_blank');
                }}
                className="btn" 
                style={{ marginTop: '1rem', width: '100%', padding: '0.8rem', background: '#25D366', color: 'white', display: 'flex', justifyContent: 'center', gap: '0.6rem', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
                <span style={{ fontSize: '1.2rem' }}>💬</span> <span style={{ fontWeight: 'bold' }}>Compartir por WhatsApp</span>
          </button>
        </div>

        {/* Lado Derecho: Especificaciones Comerciales */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <span className="badge badge-neutral" style={{ marginBottom: '1rem', display: 'inline-block' }}>{product.type || product.categoryId || 'General'}</span>
            <h1 style={{ fontSize: '2.5rem', margin: '0 0 0.5rem 0', color: 'var(--text-dark)' }}>{product.name}</h1>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-blue)', margin: 0 }}>${Number(product.price).toFixed(2)}</p>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '1.5rem 0' }}>
            <p style={{ lineHeight: '1.8', color: 'var(--text-muted)', margin: 0 }}>
              {product.description || 'Prenda/accesorio oficial de la fundación. Con cada compra directa apoyas financieramente a las operaciones tácticas y de infraestructura civil del escuadrón operativo.'}
            </p>
          </div>

          {/* Opciones de Talla (Solo Ropa) */}
          {isRopa && (
            <div>
              <p style={{ fontWeight: 'bold', marginBottom: '0.8rem' }}>Seleccionar Talla</p>
              <div style={{ display: 'flex', gap: '0.8rem' }}>
                {['S', 'M', 'L', 'XL', 'XXL'].map(size => (
                  <button 
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    style={{ 
                      width: '45px', height: '45px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s',
                      background: selectedSize === size ? 'var(--primary-blue)' : 'white',
                      color: selectedSize === size ? 'white' : 'var(--text-dark)',
                      border: selectedSize === size ? 'none' : '1px solid var(--border-color)'
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Pregunta Especial al Cliente */}
          {product.requiresNote && (
            <div style={{ background: '#fffbeb', border: showNoteError ? '2px solid #ef4444' : '1px solid #fde68a', padding: '1.2rem', borderRadius: '12px' }}>
              <p style={{ fontWeight: 'bold', color: '#92400e', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>✍️</span> {product.noteQuestion || 'Por favor, déjanos una nota para este pedido:'}
              </p>
              <textarea 
                value={customerNote}
                onChange={(e) => {
                  setCustomerNote(e.target.value);
                  if (e.target.value.trim()) setShowNoteError(false);
                }}
                placeholder="Escribe tu preferencia aquí..."
                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #fbbf24', minHeight: '80px', fontSize: '0.95rem' }}
              />
              {showNoteError && (
                <p style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
                  ⚠️ Esta información es requerida para poder procesar tu pedido.
                </p>
              )}
            </div>
          )}

          {/* Indicador de Stock Físico o Digital */}
          <div>
             {product.isDocument ? (
               <div style={{ background: '#fef2f2', color: '#dc2626', padding: '1rem', borderRadius: '8px', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>🔒</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>RECURSO DIGITAL CIFRADO. SE DESBLOQUEARÁ AUTOMÁTICAMENTE TRAS EL PAGO.</span>
               </div>
             ) : (
               <>
                 <p style={{ fontWeight: 'bold', marginBottom: '0.8rem' }}>Cantidad</p>
                 <div style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--surface-color)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                   <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ width: '30px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)' }}>-</button>
                   <span style={{ width: '40px', textAlign: 'center', fontWeight: 'bold' }}>{quantity}</span>
                   <button onClick={() => setQuantity(quantity + 1)} style={{ width: '30px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)' }}>+</button>
                 </div>
                 <p style={{ fontSize: '0.85rem', color: Number(product.stock) > 0 ? 'var(--text-muted)' : 'var(--primary-red)', marginTop: '0.8rem' }}>
                    {Number(product.stock) > 0 ? `📦 ${product.stock} unidades en bodega americana.` : '❌ Agotado temporalmente'}
                 </p>
                 <p style={{ fontSize: '0.8rem', color: '#0369a1', fontWeight: '500', marginTop: '0.4rem', fontStyle: 'italic' }}>
                    🚚 Los envíos se realizan de 24 a 48 horas después de su compra.
                 </p>
               </>
             )}
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
             <button 
                onClick={handleAddToCart}
                disabled={!product.isDocument && Number(product.stock) <= 0}
                className="btn btn-accent" 
                style={{ width: '100%', padding: '1.2rem', fontSize: '1.1rem', display: 'flex', justifyContent: 'center', gap: '0.8rem', opacity: (!product.isDocument && Number(product.stock) <= 0) ? 0.5 : 1 }}>
                🛒 <span>{product.isDocument ? 'Obtener Documento Digital' : (Number(product.stock) > 0 ? 'Añadir al Carrito y Proceder' : 'Sin Inventario')}</span>
             </button>
          </div>
          
          <div style={{ marginTop: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🛡️</span>
            <span>Compras blindadas con encriptación gubernamental. El procesamiento viaja de extremo a extremo a través de los laboratorios de Stripe.</span>
          </div>

        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
