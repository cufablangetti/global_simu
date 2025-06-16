import axios from 'axios';
import { 
  GenerationRequest, 
  GenerationResponse, 
  ValidationResponse,
  StatisticalTestRequest,
  StatisticalTestResponse,
  RandomVariableRequest,
  RandomVariableResponse
} from '../types';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiService = {
  // Generación de números
  generateNumbers: async (request: GenerationRequest): Promise<GenerationResponse> => {
    const response = await api.post('/generate', request);
    return response.data;
  },

  // Validación de condiciones
  validateConditions: async (request: GenerationRequest): Promise<ValidationResponse> => {
    const response = await api.post('/validate', request);
    return response.data;
  },

  // Pruebas estadísticas
  runStatisticalTest: async (request: StatisticalTestRequest): Promise<StatisticalTestResponse> => {
    const response = await api.post('/statistical-test', request);
    return response.data;
  },

  // Variables aleatorias
  generateRandomVariables: async (request: RandomVariableRequest): Promise<RandomVariableResponse> => {
    const response = await api.post('/random-variables', request);
    return response.data;
  },

  // Verificar conexión con el backend
  checkConnection: async (): Promise<boolean> => {
    try {
      await api.get('/health');
      return true;
    } catch (error) {
      return false;
    }
  }
};