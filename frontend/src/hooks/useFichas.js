import { useState, useEffect } from 'react';
import API from '../config/api';

export const useFichas = () => {
  const [fichas, setFichas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFichas = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await API.get('/fichas');
      setFichas(response.data);
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error al cargar fichas';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const createFicha = async (fichaData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await API.post('/admin/fichas', fichaData);
      setFichas([...fichas, response.data]);
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error al crear ficha';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const updateFicha = async (id, fichaData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await API.put(`/admin/fichas/${id}`, fichaData);
      setFichas(fichas.map(ficha => ficha.id_ficha === id ? response.data.ficha : ficha));
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error al actualizar ficha';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const deleteFicha = async (id, forzar = false) => {
    setLoading(true);
    setError(null);
    try {
      const url = forzar ? `/admin/fichas/${id}?forzar=true` : `/admin/fichas/${id}`;
      await API.delete(url);
      setFichas(fichas.filter(ficha => ficha.id_ficha !== id));
      return { success: true };
    } catch (err) {
      const errorData = err.response?.data;
      const errorMessage = errorData?.message || errorData?.error || 'Error al eliminar ficha';
      
      // Si requiere confirmación, devolver info especial
      if (errorData?.requiereConfirmacion) {
        return { 
          success: false, 
          error: errorMessage,
          requiereConfirmacion: true,
          estudiantesAsociados: errorData.estudiantesAsociados
        };
      }
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFichas();
  }, []);

  return {
    fichas,
    loading,
    error,
    fetchFichas,
    createFicha,
    updateFicha,
    deleteFicha,
  };
};


