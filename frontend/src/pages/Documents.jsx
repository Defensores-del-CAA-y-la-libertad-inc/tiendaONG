import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../config/api';
import { useLanguage } from '../context/LanguageContext';

const API_URL = `${API_BASE_URL}/api/products`;

function Documents() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [buyingDocId, setBuyingDocId] = useState(null);
  const [emailModal, setEmailModal] = useState({ open: false, doc: null, email: '', agreedToTerms: false });
  const [detailModal, setDetailModal] = useState({ open: false, doc: null });
  const { t, lang } = useLanguage();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch(API_URL);
      if (response.ok) {
        const data = await response.json();
        // Filtrar productos que sean documentos
        const docs = data.filter(p => p.isDocument === true || p.category === 'Documentos');
        setDocuments(docs);
      }
    } catch (error) {
      console.error("Error obteniendo documentos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePadlockClick = (doc) => {
    setDetailModal({ open: true, doc });
  };

  const handleBuyClick = (doc) => {
    setDetailModal({ open: false, doc: null });
    setEmailModal({ open: true, doc, email: '', agreedToTerms: false });
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!emailModal.email || !emailModal.email.includes('@')) {
      alert("Por favor ingresa un correo electrónico válido.");
      return;
    }
    if (!emailModal.agreedToTerms) {
      alert("You must agree to the terms and conditions before proceeding. / Debes aceptar los términos y condiciones antes de proceder.");
      return;
    }

    setBuyingDocId(emailModal.doc.id);

    try {
      const orderId = `DOC_${Date.now()}`;
      
      const response = await fetch(`${API_BASE_URL}/api/payments/create-document-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: emailModal.doc.id,
          customerEmail: emailModal.email,
          orderId: orderId
        })
      });

      const data = await response.json();
      
      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        const errorMsg = data.message || data.error || "Error de respuesta del servidor de pago.";
        const errorDetail = data.error ? `\n\nDetalles: ${data.error}` : '';
        alert(`${errorMsg}${errorDetail}`);
        setBuyingDocId(null);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert(`No se pudo iniciar el proceso de pago. Error de red o servidor offline. \nDetalle: ${error.message}`);
      setBuyingDocId(null);
    }
  };

  return (
    <div className="container" style={{ padding: '3rem 5% 5rem', minHeight: '80vh' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 className="section-title">Centro de Documentos Protegido</h1>
        <p style={{ maxWidth: '600px', margin: '0 auto', fontSize: '1.1rem' }}>
          Documentos y manuales están encriptados y protegidos. 
          Al realizar tu procesamiento, el candado se desbloqueará y podrás descargarlos al instante.
        </p>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Cargando cámara acorazada...
        </div>
      ) : documents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔒</div>
          <h3>Aún no hay archivos clasificados disponibles.</h3>
          <p style={{ color: 'var(--text-muted)' }}>Sigue revisando pronto nuestra biblioteca legal y formativa.</p>
        </div>
      ) : (
        <div className="products-grid">
          {documents.map((doc) => (
            <div 
              key={doc.id} 
              className="product-card animate-fade-in" 
              onClick={() => handlePadlockClick(doc)}
              style={{ 
                display: 'flex', flexDirection: 'column', cursor: 'pointer', 
                background: 'linear-gradient(145deg, #1e293b, #0f172a)',
                color: 'white', border: '2px solid #334155', position: 'relative', overflow: 'hidden'
              }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '0.75rem', background: 'rgba(0,0,0,0.5)', textAlign: 'center', fontSize: '0.8rem', letterSpacing: '2px', fontWeight: 'bold' }}>
                {lang === 'es' ? 'CLASIFICADO' : 'CLASSIFIED'}
              </div>
              <div className="product-image" style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', position: 'relative' }}>
                <div style={{ fontSize: '4.5rem', opacity: 0.8 }}>
                  📄
                </div>
                <div style={{ position: 'absolute', bottom: '10px', right: '10px', fontSize: '1.5rem', background: '#e11d48', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                  🔒
                </div>
              </div>
              <div className="product-info" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', textAlign: 'left', padding: '1.25rem' }}>
                <h3 className="product-title" style={{ color: 'white', marginBottom: '0.5rem', fontSize: '1.1rem', minHeight: 'auto' }}>
                  {doc.name}
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.4' }}>
                  {doc.description || (lang === 'es' ? 'Documentación clasificada de la fundación.' : 'Classified foundation documentation.')}
                </p>
                <div className="product-footer" style={{ borderTop: '1px solid #334155', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#38bdf8' }}>${Number(doc.price).toFixed(2)}</span>
                  <span className="btn" style={{ background: '#334155', color: 'white', padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid #475569' }}>
                    {t('view_details')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Detalles del Documento (abre al tocar el candado) */}
      {detailModal.open && detailModal.doc && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9998,
          display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)'
        }}>
          <div className="animate-fade-in" style={{
            background: 'white', padding: '0', borderRadius: '16px', overflow: 'hidden',
            maxWidth: '500px', width: '90%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
          }}>
            <div style={{ background: 'var(--primary-blue)', padding: '2rem', textAlign: 'center', color: 'white', position: 'relative' }}>
              <button 
                onClick={() => setDetailModal({ open: false, doc: null })}
                style={{ position: 'absolute', top: '10px', right: '15px', background: 'transparent', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}
              >&times;</button>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📄</div>
              <h2 style={{ margin: 0 }}>{detailModal.doc.name}</h2>
              <span style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', padding: '0.2rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', marginTop: '0.5rem' }}>Archivo Digital Bloqueado</span>
            </div>
            <div style={{ padding: '2rem' }}>
              <h4 style={{ color: 'var(--primary-blue)', marginBottom: '0.5rem' }}>Detalles del Documento</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                {detailModal.doc.description || "Este es un documento protegido y clasificado exclusivo para contribuyentes."}
              </p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                 <div>
                    <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Costo de Desbloqueo</span>
                    <strong style={{ fontSize: '1.25rem', color: 'var(--text-dark)' }}>${Number(detailModal.doc.price).toFixed(2)} USD</strong>
                 </div>
                 <div style={{ fontSize: '2rem' }}>💳</div>
              </div>

              <button 
                onClick={() => handleBuyClick(detailModal.doc)}
                className="btn btn-primary"
                style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                🔒 {t('pay_to_access')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para pedir correo y términos (Checkout) */}
      {emailModal.open && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'white', padding: '2.5rem', borderRadius: '12px',
            maxWidth: '550px', width: '95%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--primary-blue)' }}>Proceed to Checkout / Un paso más</h3>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Enter the email where you wish to receive your access. / Ingresa el correo electrónico donde deseas recibir tu acceso a <strong>{emailModal.doc?.name}</strong>.
            </p>
            
            <form onSubmit={handleCheckout}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Email / Correo Electrónico:</label>
                <input 
                  type="email" 
                  required
                  value={emailModal.email}
                  onChange={(e) => setEmailModal({ ...emailModal, email: e.target.value })}
                  style={{
                    width: '100%', padding: '0.75rem', borderRadius: '8px', 
                    border: '1px solid var(--border-color)', fontSize: '1rem'
                  }}
                  placeholder="tu@correo.com"
                  autoFocus
                />
              </div>

              {/* CHECKBOX OBLIGATORIO Y DISCLAIMERS */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer', marginBottom: '1rem' }}>
                  <input 
                    type="checkbox" 
                    checked={emailModal.agreedToTerms} 
                    onChange={(e) => setEmailModal({ ...emailModal, agreedToTerms: e.target.checked })} 
                    style={{ marginTop: '0.2rem' }}
                  />
                  <span>
                    <strong>I agree that this is a fundraising purchase and I accept the <a href="#">Terms & Conditions</a> and <a href="#">Privacy Policy</a>.</strong><br/>
                    Acepto que esta es una compra de recaudación de fondos y acepto los <a href="#">Términos y Condiciones</a> y <a href="#">Política de Privacidad</a>.
                  </span>
                </label>

                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.8rem', marginTop: '0.8rem' }}>
                  <p style={{ margin: '0 0 0.5rem 0' }}>
                    <strong style={{ color: '#b91c1c' }}>This organization is not a law firm and does not provide legal advice.</strong><br/>
                    Esta organización no es un bufete de abogados y no ofrece asesoría legal.
                  </p>
                  <p style={{ margin: '0 0 0.5rem 0' }}>
                    <strong>Florida Registration Number: CH81403</strong><br/>
                    A COPY OF THE OFFICIAL REGISTRATION AND FINANCIAL INFORMATION MAY BE OBTAINED FROM THE DIVISION OF CONSUMER SERVICES BY CALLING TOLL-FREE (800-435-7352) WITHIN THE STATE. REGISTRATION DOES NOT IMPLY ENDORSEMENT, APPROVAL, OR RECOMMENDATION BY THE STATE.
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong>Número de Registro en Florida: CH81403</strong><br/>
                    UNA COPIA DE LA INFORMACIÓN OFICIAL DE REGISTRO Y FINANCIERA PUEDE OBTENERSE DEL DEPARTAMENTO DE SERVICIOS AL CONSUMIDOR LLAMANDO GRATUITAMENTE AL (800-435-7352) DENTRO DEL ESTADO. EL REGISTRO NO IMPLICA RESPALDO, APROBACIÓN NI RECOMENDACIÓN POR PARTE DEL ESTADO.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={() => setEmailModal({ open: false, doc: null, email: '', agreedToTerms: false })}
                  style={{
                    padding: '0.75rem 1.5rem', borderRadius: '8px', background: 'var(--light-bg)',
                    border: '1px solid var(--border-color)', cursor: 'pointer', fontWeight: 600
                  }}
                >
                  Cancel / Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={!emailModal.agreedToTerms}
                  className="btn btn-primary"
                  style={{ padding: '0.75rem 1.5rem', opacity: emailModal.agreedToTerms ? 1 : 0.5 }}
                >
                  Proceed / Continuar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Documents;
