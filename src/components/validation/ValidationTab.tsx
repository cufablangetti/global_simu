import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, BarChart } from 'lucide-react';
import { GenerationResponse, ValidationResponse, StatisticalTestResponse } from '../../types';
import { apiService } from '../../services/api';
import ErrorMessage from '../common/ErrorMessage';
import LoadingSpinner from '../common/LoadingSpinner';

interface ValidationTabProps {
  selectedMethod: string;
  parameters: Record<string, number>;
}

export default function ValidationTab({ selectedMethod, parameters }: ValidationTabProps) {
  const [numbers, setNumbers] = useState<number[]>([]);
  const [validationData, setValidationData] = useState<ValidationResponse | null>(null);
  const [validationLoading, setValidationLoading] = useState(false);
  const [validationError, setValidationError] = useState<string>('');

  const [chiSquareIntervals, setChiSquareIntervals] = useState<string>('');
  const [ksSignificance, setKsSignificance] = useState<string>('0.05');
  const [chiSquareResult, setChiSquareResult] = useState<StatisticalTestResponse | null>(null);
  const [ksResult, setKsResult] = useState<StatisticalTestResponse | null>(null);
  const [testLoading, setTestLoading] = useState<{ chi: boolean; ks: boolean }>({ chi: false, ks: false });
  const [testErrors, setTestErrors] = useState<{ chi: string; ks: string }>({ chi: '', ks: '' });

  const significanceOptions = [
    { value: '0.01', label: '0.01 (99% confianza)' },
    { value: '0.05', label: '0.05 (95% confianza)' },
    { value: '0.10', label: '0.10 (90% confianza)' }
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
    if (!numbers || !chiSquareIntervals) {
      setTestErrors(prev => ({ ...prev, chi: 'Debe especificar el número de intervalos' }));
      return;
    }

    const intervals = parseInt(chiSquareIntervals);
    if (isNaN(intervals) || intervals < 2) {
      setTestErrors(prev => ({ ...prev, chi: 'El número de intervalos debe ser mayor a 1' }));
      return;
    }

    setTestLoading(prev => ({ ...prev, chi: true }));
    setTestErrors(prev => ({ ...prev, chi: '' }));

    try {
      const response = await apiService.runStatisticalTest({
        numbers: numbers,
        test_type: 'chi_square',
        parameters: { intervals }
      });
      setChiSquareResult(response);
    } catch (err: any) {
      setTestErrors(prev => ({ ...prev, chi: err.response?.data?.detail || 'Error en prueba Chi-cuadrado' }));
    } finally {
      setTestLoading(prev => ({ ...prev, chi: false }));
    }
  };

  const runKolmogorovSmirnovTest = async () => {
    if (!numbers || numbers.length === 0) {
      setTestErrors(prev => ({ ...prev, ks: 'No hay datos generados' }));
      return;
    }

    setTestLoading(prev => ({ ...prev, ks: true }));
    setTestErrors(prev => ({ ...prev, ks: '' }));

    try {
      const response = await apiService.runStatisticalTest({
        numbers: numbers,
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

  const handleSubmitNumbers = (e: React.FormEvent) => {
    e.preventDefault();
    const textarea = e.currentTarget.querySelector('textarea') as HTMLTextAreaElement;
    const inputNumbers = textarea.value
      .split('\n')
      .map(num => num.trim())
      .filter(num => !isNaN(Number(num)) && Number(num) !== 0)
      .map(num => Number(num));
    if (inputNumbers.length === 0) {
      setValidationError('Debe ingresar al menos un número válido');
      return;
    }
    setNumbers(inputNumbers);
    setValidationError('');
  }


  return (
    <div className="flex flex-1 justify-between gap-2 w-full mx-auto p-6">
      <form onSubmit={handleSubmitNumbers} className="w-80 h-240 flex flex-col justify-center items-center bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Ingrese numeros a analizar</h2>
        <textarea className='flex-1 border w-full rounded-xl p-2' rows={4} cols={50}></textarea>
        <button
          className="px-4 py-3 mt-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
        >Guardar</button>
      </form>
      <div>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de intervalos
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
                  <button
                    onClick={runChiSquareTest}
                    disabled={testLoading.chi || !chiSquareIntervals}
                    className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
                  >
                    {testLoading.chi ? <LoadingSpinner size="sm" /> : 'Ejecutar'}
                  </button>
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
                  <span className="text-sm text-gray-600">Usando un α = 0.05</span>
                </div>
              </div>

              {testErrors.chi && <ErrorMessage message={testErrors.chi} />}

              {chiSquareResult && (
                <div className={`p-4 rounded-lg border-2 ${chiSquareResult.passes ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="space-y-2 text-sm">
                    <div><strong>Valor calculado:</strong> {chiSquareResult.calculated_value.toFixed(4)}</div>
                    <div><strong>Valor crítico:</strong> {chiSquareResult.critical_value.toFixed(4)}</div>
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
    </div>
  );
}