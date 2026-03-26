import React, { createContext, useContext, useState, useEffect } from 'react';
import API_BASE_URL from '../config/api';

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('admin_token'));
  const [loading, setLoading] = useState(true);

  // Iniciar sesión a través de nuestro propio Backend (Proxy Seguro)
  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admins/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Fallo en la autenticación');
      }

      // Guardar sesión en estado y localStorage
      const user = { email: data.email, uid: data.uid, role: 'admin' };
      setCurrentUser(user);
      setToken(data.token);
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_user', JSON.stringify(user));
      
      return true;
    } catch (error) {
      console.error("Error en login:", error.message);
      throw error;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  };

  useEffect(() => {
    // Restaurar sesión guardada localmente si existe
    const savedUser = localStorage.getItem('admin_user');
    const savedToken = localStorage.getItem('admin_token');
    
    if (savedUser && savedToken) {
      try {
        setCurrentUser(JSON.parse(savedUser));
        setToken(savedToken);
      } catch (e) {
        logout();
      }
    }
    
    setLoading(false);
  }, []);

  const value = {
    currentUser,
    token, // Útil para enviarlo en futuras peticiones a la API
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
