import React from 'react';
import { useLanguage } from '../context/LanguageContext';

function Terms() {
  const { lang } = useLanguage();
  
  const currentDate = new Date().toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const content = {
    es: {
      title: "Términos y Condiciones",
      update: "Última actualización",
      welcome: "Bienvenido a la tienda en línea de Defensores del CAA y la Libertad Inc (\"Organización\", \"nosotros\", \"nuestro\"). Al acceder o comprar en nuestra tienda, usted acepta los siguientes términos y condiciones.",
      sections: [
        {
          t: "1. Naturaleza de la Organización",
          p: "Defensores del CAA y la Libertad Inc es una organización sin fines de lucro establecida bajo las leyes del Estado de Florida, dedicada a la defensa, educación y apoyo comunitario.",
          extra: "Todas las compras apoyan la misión de la organización."
        },
        {
          t: "2. Productos y Compras",
          l: [
            "Todos los productos son personalizados y fabricados bajo pedido, a menos que se especifique lo contrario.",
            "Debido a la naturaleza personalizada de los productos, todas las ventas son finales, excepto en casos de defecto o error."
          ]
        },
        {
          t: "3. Precios",
          l: [
            "Los precios se listan en USD.",
            "Los impuestos sobre las ventas aplicables se añadirán al finalizar la compra de acuerdo con la ley de Florida.",
            "Nos reservamos el derecho de cambiar los precios en cualquier momento."
          ]
        },
        {
          t: "4. Envío y Entrega",
          l: [
            "Los pedidos se procesan dentro de [3–7] días hábiles.",
            "Los tiempos de entrega pueden variar según la ubicación.",
            "No somos responsables de los retrasos causados por los transportistas."
          ]
        },
        {
          t: "5. Devoluciones y Reembolsos",
          l: [
            "No se aceptan reembolsos ni cambios para productos personalizados.",
            "Si un producto llega dañado o incorrecto, debe contactarnos dentro de los 7 días posteriores a la entrega."
          ]
        },
        {
          t: "6. Uso de los Ingresos",
          p: "Todos los ingresos de las ventas se utilizan para apoyar la misión de la organización, incluidos los programas comunitarios, la educación y las iniciativas de defensa."
        },
        {
          t: "7. Propiedad Intelectual",
          p: "Todos los diseños, logotipos y materiales son propiedad de la organización y no pueden reproducirse sin permiso."
        },
        {
          t: "8. Limitación de Responsabilidad",
          p: "No somos responsables de ningún daño indirecto, incidental o consecuente que surja del uso de nuestros productos o sitio web."
        },
        {
          t: "9. Ley Aplicable",
          p: "Estos términos se rigen por las leyes del Estado de Florida."
        }
      ],
      motto: "Unidad • Libertad • Esperanza"
    },
    en: {
      title: "Terms and Conditions",
      update: "Last updated",
      welcome: "Welcome to the online store of Defensores del CAA y la Libertad Inc (\"Organization,\" \"we,\" \"our,\" or \"us\"). By accessing or purchasing from our store, you agree to the following terms and conditions.",
      sections: [
        {
          t: "1. Nature of the Organization",
          p: "Defensores del CAA y la Libertad Inc is a nonprofit organization established under the laws of the State of Florida, dedicated to advocacy, education, and community support.",
          extra: "All purchases support the mission of the organization."
        },
        {
          t: "2. Products and Purchases",
          l: [
            "All products are customized and made-to-order unless otherwise specified.",
            "Due to the personalized nature of the products, all sales are final, except in cases of defect or error."
          ]
        },
        {
          t: "3. Pricing",
          l: [
            "Prices are listed in USD.",
            "Applicable sales tax will be added at checkout in accordance with Florida law.",
            "We reserve the right to change pricing at any time."
          ]
        },
        {
          t: "4. Shipping and Delivery",
          l: [
            "Orders are processed within [3–7] business days.",
            "Delivery times may vary depending on location.",
            "We are not responsible for delays caused by carriers."
          ]
        },
        {
          t: "5. Returns and Refunds",
          l: [
            "No refunds or exchanges are accepted for customized products.",
            "If a product arrives damaged or incorrect, you must contact us within 7 days of delivery."
          ]
        },
        {
          t: "6. Use of Proceeds",
          p: "All proceeds from sales are used to support the organization’s mission, including community programs, education, and advocacy initiatives."
        },
        {
          t: "7. Intellectual Property",
          p: "All designs, logos, and materials are property of the organization and may not be reproduced without permission."
        },
        {
          t: "8. Limitation of Liability",
          p: "We are not liable for any indirect, incidental, or consequential damages arising from the use of our products or website."
        },
        {
          t: "9. Governing Law",
          p: "These terms are governed by the laws of the State of Florida."
        }
      ],
      motto: "Unity • Liberty • Hope"
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
            {t.welcome}
          </p>
        </section>

        <div style={{ display: 'grid', gap: '2rem' }}>
          {t.sections.map((section, idx) => (
            <section key={idx}>
              <h2 style={{ color: 'var(--primary-blue)', fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                {section.t}
              </h2>
              {section.p && <p>{section.p}</p>}
              {section.l && (
                <ul>
                  {section.l.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              )}
              {section.extra && <p style={{ fontWeight: '500', color: 'var(--primary-red)', marginTop: '0.5rem' }}>{section.extra}</p>}
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

export default Terms;
