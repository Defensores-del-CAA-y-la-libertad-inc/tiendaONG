// Configuración centralizada de la API
// En local usa el puerto 5001, en producción usa la URL de Vercel directamente
const API_BASE_URL = import.meta.env.PROD 
  ? 'https://tienda-ong-fpua.vercel.app' 
  : 'http://localhost:5001';

export default API_BASE_URL;
