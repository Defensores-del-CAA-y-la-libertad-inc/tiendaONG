import React, { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

export function CartProvider({ children }) {
  // Try to load cart from local storage if needed later, for now memory is fine
  const [cart, setCart] = useState([]);

  const addToCart = (product) => {
    // Buscamos si ya existe el mismo artículo con MISMO NOMBRE y MISMA NOTA
    const existing = cart.find(item => 
      item.id === product.id && 
      item.name === product.name && 
      (item.customerNote || '') === (product.customerNote || '')
    );
    
    if (existing) {
      setCart(cart.map(item => 
        (item.id === product.id && item.name === product.name && (item.customerNote || '') === (product.customerNote || '')) 
        ? { ...item, quantity: item.quantity + 1} 
        : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }

    // Scroll al inicio suave para mostrar el carrito (Navbar)
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateQuantity = (id, name, customerNote, quantity) => {
    if (quantity <= 0) {
      removeFromCart(id, name, customerNote);
    } else {
      setCart(cart.map(item => 
        (item.id === id && item.name === name && (item.customerNote || '') === (customerNote || '')) 
        ? { ...item, quantity } 
        : item
      ));
    }
  };

  const removeFromCart = (id, name, customerNote) => {
    setCart(cart.filter(item => 
      !(item.id === id && item.name === name && (item.customerNote || '') === (customerNote || ''))
    ));
  };

  const clearCart = () => setCart([]);
  
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalAmount = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalAmount }}>
      {children}
    </CartContext.Provider>
  );
}
