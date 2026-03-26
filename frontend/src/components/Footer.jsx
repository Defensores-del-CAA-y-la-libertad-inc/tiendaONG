import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

function Footer() {
  const { t } = useLanguage();

  return (
    <footer style={{ background: '#f8fafc', padding: '3rem 5%', borderTop: '1px solid var(--border-color)', marginTop: '4rem', color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.6' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
          <div>
            <h4 style={{ color: 'var(--text-dark)', marginBottom: '1rem', fontWeight: 'bold' }}>Defensores CAA</h4>
            <p><strong>{t('footer_nonprofit')}</strong></p>
            <p style={{ marginTop: '0.5rem' }}>
              <strong>Fundraising Store / Tienda de Recaudación</strong>
            </p>
          </div>
          <div>
            <h4 style={{ color: 'var(--text-dark)', marginBottom: '1rem', fontWeight: 'bold' }}>{t('legal_terms')} & {t('legal_privacy')}</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: '0.5rem' }}><Link to="/legal/terminos" style={{ color: 'var(--primary-blue)', textDecoration: 'none' }}>{t('legal_terms')}</Link></li>
              <li><Link to="/legal/privacidad" style={{ color: 'var(--primary-blue)', textDecoration: 'none' }}>{t('legal_privacy')}</Link></li>
            </ul>
          </div>
        </div>

        <div style={{ padding: '1.5rem', background: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '2rem' }}>
          <h5 style={{ fontWeight: 'bold', margin: '0 0 0.5rem 0', color: '#b91c1c' }}>IMPORTANT LEGAL DISCLAIMERS / AVISOS LEGALES IMPORTANTES</h5>
          <p style={{ marginBottom: '1rem' }}>
            <strong>This organization is not a law firm and does not provide legal advice.</strong><br/>
            Esta organización no es un bufete de abogados y no ofrece asesoría legal.
          </p>
          
          <p style={{ marginBottom: '0.5rem' }}><strong>Florida Registration Number: CH81403</strong><br/>
            A COPY OF THE OFFICIAL REGISTRATION AND FINANCIAL INFORMATION MAY BE OBTAINED FROM THE DIVISION OF CONSUMER SERVICES BY CALLING TOLL-FREE (800-435-7352) WITHIN THE STATE. REGISTRATION DOES NOT IMPLY ENDORSEMENT, APPROVAL, OR RECOMMENDATION BY THE STATE.
          </p>
        </div>

        <div style={{ textAlign: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <p>&copy; {new Date().getFullYear()} Defensores CAA. All rights reserved. / Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
