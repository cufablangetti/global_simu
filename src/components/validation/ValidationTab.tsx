import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, BarChart, Info } from 'lucide-react';

// Tipos simulados (reemplazar con los tipos reales)
interface GenerationResponse {
  numbers: number[];
}

interface ValidationResponse {
  all_satisfied: boolean;
  explanation: string;
  conditions: Array<{
    name: string;
    description: string;
    satisfied: boolean;
    details?: string;
  }>;
}

interface StatisticalTestResponse {
  test_name: string;
  calculated_value: number;
  critical_value: number;
  passes: boolean;
  details: string;
  alpha?: number;
  confidence_level?: string;
  degrees_of_freedom?: number;
  sample_size?: number;
  intervals?: number;
  observed_frequencies?: number[];
  expected_frequency?: number;
  p_value?: number;
}

// Componentes simulados
const ErrorMessage = ({ message }: { message: string }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
    <div className="flex">
      <XCircle className="h-5 w-5 text-red-400" />
      <div className="ml-3">
        <p className="text-sm text-red-800">{message}</p>
      </div>
    </div>
  </div>
);

const LoadingSpinner = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };
  
  return (
    <div className={`animate-spin rounded-full border-2 border-blue-600 border-t-transparent ${sizeClasses[size]}`} />
  );
};

// Servicio API simulado
const apiService = {
  validateConditions: async (data: any) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { all_satisfied: true, explanation: "Simulación", conditions: [] };
  },
  runStatisticalTest: async (data: any) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
      test_name: data.test_type === 'chi_square' ? 'Chi-cuadrado' : 'Kolmogorov-Smirnov',
      calculated_value: Math.random() * 10,
      critical_value: Math.random() * 15,
      passes: Math.random() > 0.5,
      details: "Prueba simulada",
      alpha: data.parameters?.alpha || data.parameters?.significance_level,
      confidence_level: data.parameters?.alpha ? `${(1 - data.parameters.alpha) * 100}%` : undefined,
      p_value: Math.random()
    };
  }
};

interface ValidationTabProps {
  generatedData: GenerationResponse | null;
  selectedMethod: string;
  parameters: Record<string, number>;
}

export default function ValidationTab({ generatedData, selectedMethod, parameters }: ValidationTabProps) {
  const [validationData, setValidationData] = useState<ValidationResponse | null>(null);
  const [validationLoading, setValidationLoading] = useState(false);
  const [validationError, setValidationError] = useState<string>('');
  
  // Estados para Chi-cuadrado
  const [chiSquareIntervals, setChiSquareIntervals] = useState<string>('');
  const [chiSquareAlpha, setChiSquareAlpha] = useState<string>('0.05');
  const [chiSquareResult, setChiSquareResult] = useState<StatisticalTestResponse | null>(null);
  
  // Estados para Kolmogorov-Smirnov
  const [ksSignificance, setKsSignificance] = useState<string>('0.05');
  const [ksResult, setKsResult] = useState<StatisticalTestResponse | null>(null);
  
  const [testLoading, setTestLoading] = useState<{ chi: boolean; ks: boolean }>({ chi: false, ks: false });
  const [testErrors, setTestErrors] = useState<{ chi: string; ks: string }>({ chi: '', ks: '' });

  // Opciones de nivel de significancia
  const significanceOptions = [
    { value: '0.01', label: '0.01 (99% confianza)', description: 'Muy estricto - Mayor confianza' },
    { value: '0.05', label: '0.05 (95% confianza)', description: 'Estándar - Equilibrio entre confianza y sensibilidad' },
    { value: '0.10', label: '0.10 (90% confianza)', description: 'Menos estricto - Mayor sensibilidad' }
  ];

  const intervalOptions = [2, 5, 10, 15, 20, 25, 30];

  useEffect(() => {
    if (selectedMethod && parameters && Object.keys(parameters).length > 0) {
      loadValidationData();
    }
  }, [selectedMethod, parameters]);

  const loadValidationData = async () => {
    if (!selectedMethod.includes('congruential')) {
      setValidationData(null);
      return;
    }

    setValidationLoading(true);
    setValidationError('');

    try {
      const response = await apiService.validateConditions({
        method: selectedMethod,
        parameters: parameters
      });
      setValidationData(response);
    } catch (err: any) {
      setValidationError(err.response?.data?.detail || 'Error al validar condiciones');
    } finally {
      setValidationLoading(false);
    }
  };

  const runChiSquareTest = async () => {
    if (!generatedData || !chiSquareIntervals) {
      setTestErrors(prev => ({ ...prev, chi: 'Debe especificar el número de intervalos' }));
      return;
    }

    const intervals = parseInt(chiSquareIntervals);
    if (isNaN(intervals) || intervals < 2) {
      setTestErrors(prev => ({ ...prev, chi: 'El número de intervalos debe ser mayor a 1' }));
      return;
    }

    const alpha = parseFloat(chiSquareAlpha);
    if (![0.01, 0.05, 0.10].includes(alpha)) {
      setTestErrors(prev => ({ ...prev, chi: 'Nivel de significancia no válido' }));
      return;
    }

    setTestLoading(prev => ({ ...prev, chi: true }));
    setTestErrors(prev => ({ ...prev, chi: '' }));

    try {
      const response = await apiService.runStatisticalTest({
        numbers: generatedData.numbers,
        test_type: 'chi_square',
        parameters: { 
          intervals: intervals,
          alpha: alpha
        }
      });
      setChiSquareResult(response);
    } catch (err: any) {
      setTestErrors(prev => ({ ...prev, chi: err.response?.data?.detail || 'Error en prueba Chi-cuadrado' }));
    } finally {
      setTestLoading(prev => ({ ...prev, chi: false }));
    }
  };

  const runKolmogorovSmirnovTest = async () => {
    if (!generatedData) {
      setTestErrors(prev => ({ ...prev, ks: 'No hay datos generados' }));
      return;
    }

    setTestLoading(prev => ({ ...prev, ks: true }));
    setTestErrors(prev => ({ ...prev, ks: '' }));

    try {
      const response = await apiService.runStatisticalTest({
        numbers: generatedData.numbers,
        test_type: 'kolmogorov_smirnov',
        parameters: { significance_level: parseFloat(ksSignificance) }
      });
      setKsResult(response);
    } catch (err: any) {
      setTestErrors(prev => ({ ...prev, ks: err.response?.data?.detail || 'Error en prueba Kolmogorov-Smirnov' }));
    } finally {
      setTestLoading(prev => ({ ...prev, ks: false }));
    }
  };

  const handleIntervalSelect = (interval: number) => {
    setChiSquareIntervals(interval.toString());
    setTestErrors(prev => ({ ...prev, chi: '' }));
  };

  const getAlphaDescription = (alpha: string) => {
    const option = significanceOptions.find(opt => opt.value === alpha);
    return option?.description || '';
  };

  if (!generatedData) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-yellow-800 mb-2">Sin datos para validar</h3>
          <p className="text-yellow-700">
            Primero debe generar números en la pestaña "Generación" para poder realizar validaciones y pruebas estadísticas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Validación de condiciones teóricas */}
      {selectedMethod.includes('congruential') && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Validación de Condiciones Teóricas</h2>
          
          {validationLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="lg" />
              <span className="ml-3 text-gray-600">Validando condiciones...</span>
            </div>
          ) : validationError ? (
            <ErrorMessage message={validationError} />
          ) : validationData ? (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg border-2 ${validationData.all_satisfied ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center space-x-2 mb-2">
                  {validationData.all_satisfied ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600" />
                  )}
                  <span className={`font-semibold ${validationData.all_satisfied ? 'text-green-800' : 'text-red-800'}`}>
                    {validationData.all_satisfied ? 'Todas las condiciones se cumplen' : 'Algunas condiciones no se cumplen'}
                  </span>
                </div>
                {validationData.explanation && (
                  <p className={`text-sm ${validationData.all_satisfied ? 'text-green-700' : 'text-red-700'}`}>
                    {validationData.explanation}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                {validationData.conditions.map((condition, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    {condition.satisfied ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                      <div className="font-medium text-gray-900">{condition.name}</div>
                      <div className="text-sm text-gray-600">{condition.description}</div>
                      {condition.details && (
                        <div className="text-xs text-gray-500 mt-1">{condition.details}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Pruebas estadísticas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Pruebas Estadísticas</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chi-cuadrado */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <BarChart className="w-5 h-5 mr-2" />
              Prueba Chi-cuadrado
            </h3>
            
            <div className="space-y-4">
              {/* Número de intervalos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de intervalos (K) *
                </label>
                <div className="flex space-x-2 mb-3">
                  <input
                    type="number"
                    value={chiSquareIntervals}
                    onChange={(e) => {
                      setChiSquareIntervals(e.target.value);
                      setTestErrors(prev => ({ ...prev, chi: '' }));
                    }}
                    placeholder="Ej: 10"
                    min="2"
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-sm text-gray-600">Opciones comunes:</span>
                  {intervalOptions.map(interval => (
                    <button
                      key={interval}
                      onClick={() => handleIntervalSelect(interval)}
                      className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                    >
                      {interval}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nivel de significancia Alpha */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nivel de significancia (α) *
                </label>
                <select
                  value={chiSquareAlpha}
                  onChange={(e) => setChiSquareAlpha(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {significanceOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {chiSquareAlpha && (
                  <div className="mt-2 p-2 bg-blue-50 rounded-lg flex items-start space-x-2">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-800">
                      {getAlphaDescription(chiSquareAlpha)}
                    </p>
                  </div>
                )}
              </div>

              {/* Botón ejecutar */}
              <button
                onClick={runChiSquareTest}
                disabled={testLoading.chi || !chiSquareIntervals || !chiSquareAlpha}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {testLoading.chi ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Ejecutando...</span>
                  </>
                ) : (
                  'Ejecutar Prueba Chi-cuadrado'
                )}
              </button>
            </div>

            {testErrors.chi && <ErrorMessage message={testErrors.chi} />}

            {chiSquareResult && (
              <div className={`p-4 rounded-lg border-2 ${chiSquareResult.passes ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div><strong>χ² calculado:</strong> {chiSquareResult.calculated_value.toFixed(4)}</div>
                    <div><strong>χ² crítico:</strong> {chiSquareResult.critical_value.toFixed(4)}</div>
                    <div><strong>Grados de libertad:</strong> {chiSquareResult.degrees_of_freedom}</div>
                    <div><strong>Nivel de confianza:</strong> {chiSquareResult.confidence_level}</div>
                  </div>
                  {chiSquareResult.p_value !== undefined && (
                    <div><strong>P-valor:</strong> {chiSquareResult.p_value.toFixed(6)}</div>
                  )}
                  <div><strong>Resultado:</strong> 
                    <span className={`ml-2 font-semibold ${chiSquareResult.passes ? 'text-green-700' : 'text-red-700'}`}>
                      {chiSquareResult.passes ? 'PASA' : 'NO PASA'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">{chiSquareResult.details}</div>
                </div>
              </div>
            )}
          </div>

          {/* Kolmogorov-Smirnov */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <BarChart className="w-5 h-5 mr-2" />
              Prueba Kolmogorov-Smirnov
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nivel de significancia
              </label>
              <div className="flex space-x-2">
                <select
                  value={ksSignificance}
                  onChange={(e) => setKsSignificance(e.target.value)}
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {significanceOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={runKolmogorovSmirnovTest}
                  disabled={testLoading.ks}
                  className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {testLoading.ks ? <LoadingSpinner size="sm" /> : 'Ejecutar'}
                </button>
              </div>
            </div>

            {testErrors.ks && <ErrorMessage message={testErrors.ks} />}

            {ksResult && (
              <div className={`p-4 rounded-lg border-2 ${ksResult.passes ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="space-y-2 text-sm">
                  <div><strong>Valor calculado:</strong> {ksResult.calculated_value.toFixed(4)}</div>
                  <div><strong>Valor crítico:</strong> {ksResult.critical_value.toFixed(4)}</div>
                  {ksResult.p_value !== undefined && (
                    <div><strong>P-valor:</strong> {ksResult.p_value.toFixed(4)}</div>
                  )}
                  <div><strong>Resultado:</strong> 
                    <span className={`ml-2 font-semibold ${ksResult.passes ? 'text-green-700' : 'text-red-700'}`}>
                      {ksResult.passes ? 'PASA' : 'NO PASA'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">{ksResult.details}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}