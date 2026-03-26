import React from 'react';
import { useLanguage } from '../context/LanguageContext';

function Privacy() {
  const { lang } = useLanguage();

  const currentDate = new Date().toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const content = {
    es: {
      title: "Política de Privacidad",
      update: "Última actualización",
      intro: "Defensores del CAA y la Libertad Inc respeta su privacidad y se compromete a proteger su información personal.",
      sections: [
        {
          t: "1. Información que Recopilamos",
          l: ["Nombre", "Dirección de correo electrónico", "Dirección de envío", "Información de pago (procesada de forma segura a través de terceros como Stripe)"]
        },
        {
          t: "2. Cómo Usamos su Información",
          l: ["Procesar pedidos", "Comunicarnos con usted", "Mejorar nuestros servicios", "Enviar actualizaciones (si opta por recibirlas)"]
        },
        {
          t: "3. Procesamiento de Pagos",
          p: "Los pagos se procesan a través de proveedores externos seguros. No almacenamos sus datos de pago completos."
        },
        {
          t: "4. Compartir Información",
          p: "Nosotros NO vendemos ni alquilamos su información personal. Podemos compartir datos solo con procesadores de pago, proveedores de envío y autoridades legales si es necesario."
        },
        {
          t: "5. Seguridad de los Datos",
          p: "Implementamos medidas de seguridad razonables para proteger su información."
        },
        {
          t: "6. Cookies",
          p: "Nuestro sitio web puede utilizar cookies para mejorar la experiencia del usuario."
        },
        {
          t: "7. Sus Derechos",
          p: "Puede solicitar el acceso a sus datos, corrección o eliminación.",
          extra: "Contacto: support@defensorescaa.org"
        },
        {
          t: "8. Divulgación sobre Organizaciones sin Fines de Lucro",
          p: "UNA COPIA DEL REGISTRO OFICIAL Y LA INFORMACIÓN FINANCIERA PUEDE OBTENERSE DE LA DIVISIÓN DE SERVICIOS AL CONSUMIDOR LLAMANDO GRATUITAMENTE AL (800-435-7352) DENTRO DEL ESTADO. EL REGISTRO NO IMPLICA RESPALDO, APROBACIÓN O RECOMENDACIÓN POR PARTE DEL ESTADO.",
          isHighlight: true
        },
        {
          t: "9. Cambios a esta Política",
          p: "Podemos actualizar esta política en cualquier momento."
        }
      ],
      motto: "Privacidad Protegida • Transparencia Total"
    },
    en: {
      title: "Privacy Policy",
      update: "Last updated",
      intro: "Defensores del CAA y la Libertad Inc respects your privacy and is committed to protecting your personal information.",
      sections: [
        {
          t: "1. Information We Collect",
          l: ["Name", "Email address", "Shipping address", "Payment information (processed securely via third parties like Stripe)"]
        },
        {
          t: "2. How We Use Your Information",
          l: ["Process orders", "Communicate with you", "Improve our services", "Send updates (if you opt in)"]
        },
        {
          t: "3. Payment Processing",
          p: "Payments are processed through secure third-party providers. We do not store your full payment details."
        },
        {
          t: "4. Sharing of Information",
          p: "We do NOT sell or rent your personal information. We may share data only with: payment processors, shipping providers, and legal authorities if required."
        },
        {
          t: "5. Data Security",
          p: "We implement reasonable security measures to protect your information."
        },
        {
          t: "6. Cookies",
          p: "Our website may use cookies to improve user experience."
        },
        {
          t: "7. Your Rights",
          p: "You may request access to your data, correction or deletion.",
          extra: "Contact: support@defensorescaa.org"
        },
        {
          t: "8. Nonprofit Disclosure",
          p: "A COPY OF THE OFFICIAL REGISTRATION AND FINANCIAL INFORMATION MAY BE OBTAINED FROM THE DIVISION OF CONSUMER SERVICES BY CALLING TOLL-FREE (800-435-7352) WITHIN THE STATE. REGISTRATION DOES NOT IMPLY ENDORSEMENT, APPROVAL, OR RECOMMENDATION BY THE STATE.",
          isHighlight: true
        },
        {
          t: "9. Changes to This Policy",
          p: "We may update this policy at any time."
        }
      ],
      motto: "Privacy Protected • Total Transparency"
    }
  };

  const t = content[lang];

  return (
    <div className="animate-fade-in" style={{ padding: '4rem 2rem', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ 
        background: 'rgba(255, 255, 255, 0.8)', 
        backdropFilter: 'blur(10px)', 
        borderRadius: '24px', 
        padding: '3rem', 
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid rgba(255, 255, 255, 0.3)'
      }}>
        <h1 style={{ color: 'var(--primary-blue)', marginBottom: '0.5rem', fontSize: '2.5rem' }}>{t.title}</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontStyle: 'italic' }}>{t.update}: {currentDate}</p>

        <section style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
            {t.intro}
          </p>
        </section>

        <div style={{ display: 'grid', gap: '2rem' }}>
          {t.sections.map((section, idx) => (
            <section key={idx} style={section.isHighlight ? { background: '#fef2f2', padding: '1.5rem', borderRadius: '12px', border: '1px solid #fee2e2' } : {}}>
              <h2 style={{ 
                color: section.isHighlight ? '#991b1b' : 'var(--primary-blue)', 
                fontSize: '1.25rem', 
                marginBottom: '1rem', 
                borderBottom: section.isHighlight ? '1px solid #fecaca' : '2px solid #f1f5f9', 
                paddingBottom: '0.5rem' 
              }}>
                {section.t}
              </h2>
              {section.p && <p style={section.isHighlight ? { fontSize: '0.85rem', color: '#7f1d1d' } : {}}>{section.p}</p>}
              {section.l && (
                <ul>
                  {section.l.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              )}
              {section.extra && <p style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>{section.extra}</p>}
            </section>
          ))}
        </div>

        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '2px solid var(--primary-blue)', textAlign: 'center' }}>
          <p style={{ fontWeight: 'bold', color: 'var(--primary-blue)' }}>Defensores del CAA y la Libertad Inc</p>
          <p style={{ fontSize: '0.85rem' }}>{t.motto}</p>
        </div>
      </div>
    </div>
  );
}

export default Privacy;
