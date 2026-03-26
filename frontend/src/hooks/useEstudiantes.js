import { useCallback, useEffect, useState } from 'react';
import API from '../config/api';

export const useEstudiantes = () => {
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEstudiantes = useCallback(async (fichaId = null) => {
    setLoading(true);
    setError(null);
    try {
      const config = fichaId ? { params: { id_ficha: fichaId } } : undefined;
      const response = await API.get('/estudiantes', config);
      const data = Array.isArray(response.data) ? response.data : [];
      setEstudiantes(data);
      return { success: true, data };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error al cargar estudiantes';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEstudiantes();
  }, [fetchEstudiantes]);

  const createEstudiante = async (estudianteData) => {
    setError(null);
    try {
      const response = await API.post('/estudiantes', estudianteData);
      const nuevo = response.data?.data;
      if (nuevo) {
        setEstudiantes((prev) => [nuevo, ...prev]);
      }
      return { success: true, data: nuevo };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error al crear estudiante';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const updateEstudiante = async (id, estudianteData) => {
    setError(null);
    try {
      const response = await API.put(`/estudiantes/${id}`, estudianteData);
      const actualizado = response.data?.data;
      if (actualizado) {
        setEstudiantes((prev) =>
          prev.map((est) => (est.id_estudiante === id ? actualizado : est))
        );
      }
      return { success: true, data: actualizado };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error al actualizar estudiante';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const deleteEstudiante = async (id) => {
    setError(null);
    try {
      await API.delete(`/estudiantes/${id}`);
      setEstudiantes((prev) => prev.filter((est) => est.id_estudiante !== id));
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error al eliminar estudiante';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  return {
    estudiantes,
    loading,
    error,
    fetchEstudiantes,
    createEstudiante,
    updateEstudiante,
    deleteEstudiante,
  };
};


