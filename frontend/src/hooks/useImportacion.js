import { useState } from 'react';
import API from '../config/api';

export const useImportacion = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cargarExcel = async (file) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await API.post('/importacion/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        success: true,
        data: response.data,
        preview: response.data.preview || [],
        total: response.data.total || 0,
      };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error al cargar archivo Excel';
      setError(errorMessage);
      return { success: false, error: errorMessage, preview: [], total: 0 };
    } finally {
      setLoading(false);
    }
  };

  const guardarImportacion = async (datosFicha, aprendices) => {
    setLoading(true);
    setError(null);
    try {
      const response = await API.post('/importacion/guardar', {
        ficha: datosFicha,
        aprendices,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error al guardar importación';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const guardarMasivo = async (ficha, aprendices) => {
    // No usar setLoading aquí para permitir múltiples llamadas en paralelo
    try {
      const response = await API.post('/importacion/guardar', {
        ficha,
        aprendices,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error al guardar datos masivos';
      return { success: false, error: errorMessage };
    }
  };

  return {
    loading,
    error,
    cargarExcel,
    guardarImportacion,
    guardarMasivo,
  };
};


