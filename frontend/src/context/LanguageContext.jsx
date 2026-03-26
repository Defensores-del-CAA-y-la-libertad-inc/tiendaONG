import React, { createContext, useState, useContext, useEffect } from 'react';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  // Inicializamos con el idioma guardado o el del navegador
  const [lang] = useState('es');

  const toggleLanguage = () => {
    const newLang = lang === 'es' ? 'en' : 'es';
    setLang(newLang);
    localStorage.setItem('site_lang', newLang);
  };

  const t = (key) => {
    return translations[lang][key] || key;
  };

  const translateProduct = (product) => {
    if (!product) return null;
    if (lang === 'es') return product;

    // Traducciones automáticas para campos de productos
    const isMissionDesc = product.description && product.description.includes('Defensores del CAA');
    
    return {
      ...product,
      name: product.name.replace('Gorra', 'Cap').replace('Pulover', 'T-shirt').replace('Taza', 'Mug').replace('Cajita', 'Little Box'),
      description: isMissionDesc ? translations.en.mission_desc : product.description,
      type: translations.en[product.type.toLowerCase()] || product.type,
    };
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, t, translateProduct }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

const translations = {
  es: {
    home: 'Inicio',
    catalog: 'Catálogo',
    documents: 'Documentos',
    donate: 'Donar',
    cart: 'Carrito',
    shop_now: 'Comprar Ahora',
    featured: 'Colección Destacada',
    impact_title: 'Unidad • Libertad • Esperanza',
    impact_desc: 'Cada compra que realizas financia directamente nuestra misión de proteger los derechos ciudadanos en Florida.',
    empty_cart: 'Tu carrito está vacío',
    checkout: 'Ir a Pagar',
    total: 'Total',
    login_admin: 'Acceso Administrativo',
    legal_terms: 'Términos y Condiciones',
    legal_privacy: 'Política de Privacidad',
    footer_nonprofit: 'Una organización sin fines de lucro 501(c)(3)',
    search_placeholder: 'Buscar artículos...',
    all_categories: 'Todas las Categorías',
    clothing: 'Ropa',
    accessories: 'Accesorios',
    home_goods: 'Hogar',
    loading: 'Cargando infraestructura...',
    add_to_cart: 'Añadir al Carrito',
    view_details: 'Ver Detalles',
    out_of_stock: 'Agotado',
    size: 'Talla',
    qty: 'Cantidad',
    protection_active: 'Protección con Candado Activa',
    unlock_doc: 'Desbloquear y cargar documento',
    pay_to_access: 'Pagar para acceder',
    buy_label: 'Comprar Etiqueta',
    view_order: 'Ver Orden',
    revenue: 'Ingresos',
    orders: 'Órdenes',
    inventory: 'Inventario',
    avg_ticket: 'Ticket Promedio',
    admin_panel: 'Panel de Control',
    logout: 'Cerrar Sesión',
    change_lang: 'English Version',
    mission_desc: 'Al adquirir este producto oficial, tu contribución se destina íntegramente a apoyar la misión de Defensores del CAA y la Libertad Inc. Ayudamos a la comunidad migrante cubana facilitando recursos esenciales, asistencia y defensa en su camino hacia una vida en libertad.',
    ropa: 'Ropa',
    accesorios: 'Accesorios',
    hogar: 'Hogar'
  },
  en: {
    home: 'Home',
    catalog: 'Catalog',
    documents: 'Documents',
    donate: 'Donate',
    cart: 'Cart',
    shop_now: 'Shop Now',
    featured: 'Featured Collection',
    impact_title: 'Unity • Liberty • Hope',
    impact_desc: 'Every purchase you make directly funds our mission to protect civil rights in Florida.',
    empty_cart: 'Your cart is empty',
    checkout: 'Checkout',
    total: 'Total',
    login_admin: 'Admin Login',
    legal_terms: 'Terms & Conditions',
    legal_privacy: 'Privacy Policy',
    footer_nonprofit: 'A 501(c)(3) Nonprofit Organization',
    search_placeholder: 'Search items...',
    all_categories: 'All Categories',
    clothing: 'Clothing',
    accessories: 'Accessories',
    home_goods: 'Home Goods',
    loading: 'Loading infrastructure...',
    add_to_cart: 'Add to Cart',
    view_details: 'View Details',
    out_of_stock: 'Out of Stock',
    size: 'Size',
    qty: 'Qty',
    protection_active: 'Security Lock Active',
    unlock_doc: 'Unlock and load document',
    pay_to_access: 'Pay to access',
    buy_label: 'Buy Label',
    view_order: 'View Order',
    revenue: 'Revenue',
    orders: 'Orders',
    inventory: 'Inventory',
    avg_ticket: 'Average Ticket',
    admin_panel: 'Control Panel',
    logout: 'Logout',
    change_lang: 'Versión Español',
    mission_desc: 'By purchasing this official product, your contribution goes entirely toward supporting the mission of Defensores del CAA y la Libertad Inc. We help the Cuban migrant community by providing essential resources, assistance, and defense on their journey to a life of freedom.',
    ropa: 'Clothing',
    accesorios: 'Accessories',
    hogar: 'Home Goods'
  }
};
