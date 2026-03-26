import React, { useContext, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import API_BASE_URL from '../config/api';

function Success() {
  const { clearCart } = useContext(CartContext);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const orderId = searchParams.get('order_id');
  const isSimulated = searchParams.get('simulated') === 'true';
  const [orderDetails, setOrderDetails] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(false);

  useEffect(() => {
    clearCart();
    
    if (orderId) {
      setLoadingOrder(true);
      fetch(`${API_BASE_URL}/api/orders/${orderId}`)
        .then(res => res.json())
        .then(data => setOrderDetails(data))
        .catch(err => console.error("Error fetching order:", err))
        .finally(() => setLoadingOrder(false));
    }
  }, [orderId]);

  // Filtrar si hay documentos
  const documentItems = orderDetails?.items?.filter(item => item.isDocument) || [];
  const isDocumentOrder = documentItems.length > 0;

  return (
    <div className="container animate-fade-in" style={{ padding: '8rem 5%', textAlign: 'center', minHeight: '80vh' }}>
      {isSimulated && (
        <div style={{ background: '#fef3f2', color: '#b91c1c', padding: '0.5rem 1rem', borderRadius: '4px', display: 'inline-block', marginBottom: '2rem', fontSize: '0.8rem', fontWeight: 'bold' }}>
           🛠️ MODO SIMULACIÓN TÁCTICA (SIN CARGO REAL)
        </div>
      )}
      <div style={{ fontSize: '5rem', marginBottom: '1rem', color: 'var(--primary-blue)' }}>✅</div>
      <h2 style={{ color: 'var(--primary-blue)', marginBottom: '1rem', fontSize: '2.5rem' }}>
        {isDocumentOrder ? '🔓 Información Desbloqueada' : (isSimulated ? '¡Orden de Prueba Exitosa!' : '¡Pago Completado!')}
      </h2>
      
      {!isDocumentOrder ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
          {isSimulated 
            ? 'Has completado el flujo de prueba. La orden ha sido guardada en la base de datos de los administradores.'
            : 'Agradecemos profundamente tu compra operativa. Tus artículos están siendo preparados en nuestro centro de logística.'}
        </p>
      ) : (
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
          Tu pago ha sido procesado de forma segura. El cifrado ha sido removido y ya puedes acceder a tus documentos.
        </p>
      )}
      
      {orderId && (
        <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '12px', display: 'inline-block', marginBottom: '3rem', border: '1px solid var(--border-color)' }}>
          <p style={{ margin: 0 }}>ID de Seguimiento / Recibo:</p>
          <h3 style={{ margin: '0.5rem 0 0 0', fontWeight: 'bold' }}>{orderId}</h3>
        </div>
      )}

      {/* Sección de Descarga de Documentos */}
      {documentItems.length > 0 && (
        <div style={{ background: 'var(--light-bg)', border: '2px solid var(--primary-blue)', borderRadius: '12px', padding: '2rem', maxWidth: '600px', margin: '0 auto 3rem', textAlign: 'left' }}>
          <h3 style={{ color: 'var(--primary-blue)', marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🔓</span> Recursos Desbloqueados
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {documentItems.map((doc, idx) => (
              <li key={idx} style={{ padding: '1rem', background: 'white', borderRadius: '8px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-dark)' }}>{doc.name}</h4>
                  <small style={{ color: 'var(--text-muted)' }}>PDF Document</small>
                </div>
                <a 
                  href={doc.fileUrl || '#'} 
                  target="_blank" 
                  rel="noreferrer"
                  className="btn btn-primary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', whiteSpace: 'nowrap', textDecoration: 'none' }}
                  onClick={(e) => {
                    if (!doc.fileUrl) {
                      e.preventDefault();
                      alert("No hay enlace de archivo configurado para este documento.");
                    }
                  }}
                >
                  Descargar 👇
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <Link to="/" className="btn btn-primary" style={{ marginRight: '1rem' }}>Volver al Inicio</Link>
        <Link to={documentItems.length > 0 ? "/documentos" : "/catalogo"} className="btn" style={{ background: 'transparent', border: '1px solid var(--border-color)' }}>
          Seguir Explorando
        </Link>
      </div>
    </div>
  );
}

export default Success;
