import React, { useState } from 'react';
import { Play, Download, Eye, EyeOff } from 'lucide-react';
import { GenerationMethod, GenerationResponse } from '../../types';
import { apiService } from '../../services/api';
import ErrorMessage from '../common/ErrorMessage';
import LoadingSpinner from '../common/LoadingSpinner';

const METHODS: GenerationMethod[] = [
  {
    id: 'mixed_congruential',
    name: 'Congruencial Mixto',
    parameters: [
      { name: 'x0', label: 'Semilla (x₀)', type: 'number', required: true, description: 'Valor inicial de la secuencia' },
      { name: 'a', label: 'Multiplicador (a)', type: 'number', required: true, description: 'Factor multiplicativo' },
      { name: 'b', label: 'Incremento (b)', type: 'number', required: true, description: 'Valor de incremento' },
      { name: 'm', label: 'Módulo (m)', type: 'number', required: true, description: 'Valor del módulo' }
    ]
  },
  {
    id: 'multiplicative_congruential',
    name: 'Congruencial Multiplicativo',
    parameters: [
      { name: 'x0', label: 'Semilla (x₀)', type: 'number', required: true, description: 'Valor inicial de la secuencia' },
      { name: 'a', label: 'Multiplicador (a)', type: 'number', required: true, description: 'Factor multiplicativo' },
      { name: 'm', label: 'Módulo (m)', type: 'number', required: true, description: 'Valor del módulo' }
    ]
  },
  {
    id: 'middle_squares',
    name: 'Cuadrados Medios',
    parameters: [
      { name: 'x0', label: 'Semilla (x₀)', type: 'number', required: true, description: 'Valor inicial (4 dígitos recomendado)' },
      { name: 'digits', label: 'Dígitos', type: 'number', required: true, description: 'Número de dígitos a extraer' }
    ]
  }
];

interface GenerationTabProps {
  onGenerationComplete: (data: GenerationResponse) => void;
  generatedData: GenerationResponse | null;
}

export default function GenerationTab({ onGenerationComplete, generatedData }: GenerationTabProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [parameters, setParameters] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showAllNumbers, setShowAllNumbers] = useState(false);

  const currentMethod = METHODS.find(m => m.id === selectedMethod);

  const handleMethodChange = (methodId: string) => {
    setSelectedMethod(methodId);
    setParameters({});
    setError('');
  };

  const handleParameterChange = (paramName: string, value: string) => {
    setParameters(prev => ({
      ...prev,
      [paramName]: value
    }));
    setError('');
  };

  const validateInputs = (): string | null => {
    if (!selectedMethod) {
      return 'Debe seleccionar un método de generación';
    }

    if (!currentMethod) return 'Método no válido';

    for (const param of currentMethod.parameters) {
      const value = parameters[param.name];
      
      if (!value || value.trim() === '') {
        return `El parámetro ${param.label} es requerido`;
      }

      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        return `El parámetro ${param.label} debe ser un número válido`;
      }

      if (numValue === 0 && param.name !== 'b') {
        return `El parámetro ${param.label} no puede ser cero`;
      }

      if (numValue < 0) {
        return `El parámetro ${param.label} debe ser positivo`;
      }
    }

    return null;
  };

  const handleGenerate = async () => {
    const validationError = validateInputs();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const numericParameters = Object.fromEntries(
        Object.entries(parameters).map(([key, value]) => [key, parseFloat(value)])
      );

      const response = await apiService.generateNumbers({
        method: selectedMethod,
        parameters: numericParameters
      });

      onGenerationComplete(response);
      setShowAllNumbers(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al generar números');
    } finally {
      setLoading(false);
    }
  };

  const downloadResults = () => {
    if (!generatedData) return;

    const content = [
      `Método: ${METHODS.find(m => m.id === selectedMethod)?.name}`,
      `Parámetros: ${JSON.stringify(parameters, null, 2)}`,
      `Total generados: ${generatedData.statistics.count}`,
      `Razón de parada: ${generatedData.statistics.stopped_reason}`,
      '',
      'Números generados:',
      ...generatedData.numbers.map((num, index) => `${index + 1}: ${num}`)
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `numeros_${selectedMethod}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const displayNumbers = generatedData ? 
    (showAllNumbers ? generatedData.numbers : generatedData.numbers.slice(0, 20)) : [];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Generación de Números Pseudoaleatorios</h2>
        
        {/* Selector de método */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Método de Generación
          </label>
          <select
            value={selectedMethod}
            onChange={(e) => handleMethodChange(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="">Seleccione un método...</option>
            {METHODS.map(method => (
              <option key={method.id} value={method.id}>
                {method.name}
              </option>
            ))}
          </select>
        </div>

        {/* Parámetros del método */}
        {currentMethod && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {currentMethod.parameters.map(param => (
              <div key={param.name}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {param.label}
                  {param.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="number"
                  value={parameters[param.name] || ''}
                  onChange={(e) => handleParameterChange(param.name, e.target.value)}
                  placeholder="Ingrese valor..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                {param.description && (
                  <p className="text-xs text-gray-500 mt-1">{param.description}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {error && <ErrorMessage message={error} className="mb-4" />}

        <button
          onClick={handleGenerate}
          disabled={loading || !selectedMethod}
          className="w-full md:w-auto flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? <LoadingSpinner size="sm" /> : <Play className="w-5 h-5" />}
          <span>{loading ? 'Generando...' : 'Generar Números'}</span>
        </button>
      </div>

      {/* Resultados */}
      {generatedData && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Resultados</h3>
            <button
              onClick={downloadResults}
              className="flex items-center space-x-2 text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Descargar</span>
            </button>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{generatedData.statistics.count}</div>
              <div className="text-sm text-gray-600">Total Generados</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{generatedData.statistics.min}</div>
              <div className="text-sm text-gray-600">Mínimo</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{generatedData.statistics.max}</div>
              <div className="text-sm text-gray-600">Máximo</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{generatedData.statistics.mean.toFixed(4)}</div>
              <div className="text-sm text-gray-600">Media</div>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600">
              <strong>Razón de parada:</strong> {generatedData.statistics.stopped_reason}
            </p>
            {generatedData.statistics.period && (
              <p className="text-sm text-gray-600">
                <strong>Período detectado:</strong> {generatedData.statistics.period}
              </p>
            )}
          </div>

          {/* Lista de números */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">
                Números Generados {!showAllNumbers && generatedData.numbers.length > 20 && `(Mostrando primeros 20 de ${generatedData.numbers.length})`}
              </h4>
              {generatedData.numbers.length > 20 && (
                <button
                  onClick={() => setShowAllNumbers(!showAllNumbers)}
                  className="flex items-center space-x-2 text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors"
                >
                  {showAllNumbers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span>{showAllNumbers ? 'Mostrar menos' : 'Ver todos'}</span>
                </button>
              )}
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
              <div className="grid grid-cols-5 md:grid-cols-10 gap-2 text-sm font-mono">
                {displayNumbers.map((num, index) => (
                  <div key={index} className="bg-white px-2 py-1 rounded text-center">
                    {num}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}