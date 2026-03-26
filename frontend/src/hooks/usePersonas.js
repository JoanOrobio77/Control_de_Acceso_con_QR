import { useCallback, useEffect, useState } from 'react';
import API from '../config/api';

/**
 * Hook para manejar personas con filtrado opcional por rol
 * @param {Object} options - Opciones de configuración
 * @param {string} options.rol - Nombre del rol para filtrar (instructor, funcionario, visitante)
 */
export const usePersonas = (options = {}) => {
  const { rol } = options;
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPersonas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Construir query params para filtrar por rol si se especifica
      const params = new URLSearchParams();
      if (rol) {
        params.append('nombre_rol', rol);
      }
      const queryString = params.toString();
      const url = queryString ? `/personas?${queryString}` : '/personas';
      
      const response = await API.get(url);
      const data = response.data?.personas || [];
      setPersonas(data);
      return { success: true, data };
    } catch (err) {
      const message = err.response?.data?.error || 'Error al cargar personas';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [rol]);

  useEffect(() => {
    fetchPersonas();
  }, [fetchPersonas]);

  const createPersona = async (personaData) => {
    setError(null);
    try {
      const response = await API.post('/personas', personaData);
      const personaCreada = response.data?.persona;
      if (personaCreada) {
        setPersonas((prev) => [personaCreada, ...prev]);
      }
      return { success: true, data: personaCreada };
    } catch (err) {
      const message = err.response?.data?.error || 'Error al crear persona';
      setError(message);
      return { success: false, error: message };
    }
  };

  const updatePersona = async (id, personaData) => {
    setError(null);
    try {
      const response = await API.put(`/personas/${id}`, personaData);
      const personaActualizada = response.data?.persona;
      if (personaActualizada) {
        setPersonas((prev) =>
          prev.map((persona) => (persona.id_persona === id ? personaActualizada : persona))
        );
      }
      return { success: true, data: personaActualizada };
    } catch (err) {
      const message = err.response?.data?.error || 'Error al actualizar persona';
      setError(message);
      return { success: false, error: message };
    }
  };

  const deletePersona = async (id, forzar = false) => {
    setError(null);
    try {
      const url = forzar ? `/personas/${id}?forzar=true` : `/personas/${id}`;
      await API.delete(url);
      setPersonas((prev) => prev.filter((persona) => persona.id_persona !== id));
      return { success: true };
    } catch (err) {
      const errorData = err.response?.data;
      const message = errorData?.error || 'Error al eliminar persona';
      
      // Si requiere confirmación, devolver info especial
      if (errorData?.requiereConfirmacion) {
        return { 
          success: false, 
          error: message,
          requiereConfirmacion: true,
          fichasAsignadas: errorData.fichasAsignadas,
          registrosAcceso: errorData.registrosAcceso,
        };
      }
      
      setError(message);
      return { success: false, error: message };
    }
  };

  return {
    personas,
    loading,
    error,
    fetchPersonas,
    createPersona,
    updatePersona,
    deletePersona,
  };
};


