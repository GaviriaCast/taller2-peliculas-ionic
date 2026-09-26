import axios from 'axios';

// Nest devuelve `message` como texto o como arreglo (errores de validación)
export const getErrorMessages = (err: unknown, fallback: string): string[] => {
  if (axios.isAxiosError(err)) {
    const message = err.response?.data?.message;
    if (Array.isArray(message) && message.length) return message;
    if (typeof message === 'string' && message) return [message];
    if (!err.response) return ['No hay conexión con la API. Revisa que el backend esté encendido.'];
  }
  return [fallback];
};

export const getErrorMessage = (err: unknown, fallback: string): string =>
  getErrorMessages(err, fallback)[0];
