import React from 'react';
import { Link } from 'react-router-dom';

function Cancel() {
  return (
    <div className="container animate-fade-in" style={{ padding: '8rem 5%', textAlign: 'center', minHeight: '80vh' }}>
      <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>⚠️</div>
      <h2 style={{ color: 'var(--primary-red)', marginBottom: '1rem', fontSize: '2.5rem' }}>Transacción Cancelada</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
        El proceso de pago fue interrumpido de forma segura y no se realizó ningún cargo a tu tarjeta de crédito o débito. Tu carrito sigue completo si deseas volver a intentarlo.
      </p>

      <div>
        <Link to="/carrito" className="btn btn-primary" style={{ marginRight: '1rem' }}>Regresar a mi Carrito</Link>
        <a href="mailto:soporte@defensorescaa.org" className="btn" style={{ background: 'transparent', border: '1px solid var(--border-color)' }}>Contactar a Soporte</a>
      </div>
    </div>
  );
}

export default Cancel;
