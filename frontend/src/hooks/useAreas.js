import { useState, useEffect } from 'react';
import API from '../config/api';

export const useAreas = () => {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAreas = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await API.get('/areas');
      setAreas(response.data);
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error al cargar áreas';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const createArea = async (areaData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await API.post('/areas', areaData);
      setAreas([...areas, response.data]);
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error al crear área';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const updateArea = async (id, areaData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await API.put(`/areas/${id}`, areaData);
      setAreas(areas.map(area => area.id_area === id ? response.data : area));
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error al actualizar área';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const deleteArea = async (id) => {
    setLoading(true);
    setError(null);
    try {
      await API.delete(`/areas/${id}`);
      setAreas(areas.filter(area => area.id_area !== id));
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error al eliminar área';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  return {
    areas,
    loading,
    error,
    fetchAreas,
    createArea,
    updateArea,
    deleteArea,
  };
};


