import { useState } from 'react';
import { Zap, BarChart3, Download } from 'lucide-react';
import { RandomVariableResponse } from '../../types';
import { apiService } from '../../services/api';
import ErrorMessage from '../common/ErrorMessage';
import LoadingSpinner from '../common/LoadingSpinner';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ScatterController
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ScatterController
);

export default function RandomVariablesTab() {
  const [selectedFunction, setSelectedFunction] = useState<string>('linear');
  const [count, setCount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [result, setResult] = useState<RandomVariableResponse | null>(null);

  const validateInputs = (): string | null => {
    if (!count || count.trim() === '') {
      return 'Debe especificar la cantidad de números a generar';
    }

    const numCount = parseInt(count);
    if (isNaN(numCount) || numCount <= 0) {
      return 'La cantidad debe ser un número entero positivo';
    }

    if (numCount > 10000) {
      return 'La cantidad máxima permitida es 10,000';
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
      const response = await apiService.generateRandomVariables({
        count: parseInt(count),
        method: 'acceptance_rejection',
        fx: selectedFunction
      });

      setResult(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al generar variables aleatorias');
    } finally {
      setLoading(false);
    }
  };

  const downloadResults = () => {
    if (!result) return;

    const content = [
      'Variables Aleatorias - Método de Aceptación-Rechazo',
      `Cantidad solicitada: ${count}`,
      `Tasa de aceptación: ${(result.acceptance_rate * 100).toFixed(2)}%`,
      `Valores generados: ${result.generated_values.length}`,
      '',
      'R1 (números aleatorios):',
      ...result.r1.map((num, index) => `${index + 1}: ${num.toFixed(6)}`),
      '',
      'R2 (números aleatorios):',
      ...result.r2.map((num, index) => `${index + 1}: ${num.toFixed(6)}`),
      '',
      'Valores aceptados:',
      ...result.generated_values.map((num, index) => `${index + 1}: ${num.toFixed(6)}`)
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `variables_aleatorias_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const chartDataDensidad = result ? {
    datasets: [
      {
        label: 'Puntos Aceptados',
        data: result.chart_data.x_d.map((x, i) => ({
          x: x,
          y: result.chart_data.y_d[i]
        })).filter((_, i) => result.chart_data.accepted[i]),
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
        borderColor: 'rgba(34, 197, 94, 1)',
        pointRadius: 3,
        showLine: false
      },
      {
        label: 'Puntos Rechazados',
        data: result.chart_data.x_d.map((x, i) => ({
          x: x,
          y: result.chart_data.y_d[i]
        })).filter((_, i) => !result.chart_data.accepted[i]),
        backgroundColor: 'rgba(239, 68, 68, 0.6)',
        borderColor: 'rgba(239, 68, 68, 1)',
        pointRadius: 3,
        showLine: false
      },
      {
        label: 'Función de densidad f(x) = 2x',
        data: result.chart_data.points_fx_d.map((y, i) => ({
          x: result.chart_data.points_x_d[i],
          y: y
        })),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        showLine: true,
        fill: true
      }
    ]
  } : null;

  const chartOptionsDensidad = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Método de Aceptación-Rechazo para ${result ? result.chart_data.function_name : 'f(x)'}`
      }
    },
    scales: {
      x: {
        type: 'linear' as const,
        position: 'bottom' as const,
        title: {
          display: true,
          text: 'x'
        },
        min: result ? result.chart_data.a : 0,
        max: result ? result.chart_data.b : 2.5
      },
      y: {
        title: {
          display: true,
          text: 'y'
        },
        min: 0,
        max: result ? result.chart_data.M : 1.0
      }
    }
  };

  // Configuración del gráfico
  const chartData = result ? {
    datasets: [
      {
        label: 'Puntos Aceptados',
        data: result.chart_data.x.map((x, i) => ({
          x: x,
          y: result.chart_data.y[i]
        })).filter((_, i) => result.chart_data.accepted[i]),
        backgroundColor: 'rgba(67, 170, 139, 1.0)',
        borderColor: 'rgba(67, 170, 139, 1.0)',
        pointRadius: 3,
        showLine: false
      },
      {
        label: 'Puntos Rechazados',
        data: result.chart_data.x.map((x, i) => ({
          x: x,
          y: result.chart_data.y[i]
        })).filter((_, i) => !result.chart_data.accepted[i]),
        backgroundColor: 'rgba(249, 65, 68, 1.0)',
        borderColor: 'rgba(249, 65, 68, 1.0)',
        pointRadius: 3,
        showLine: false
      },
      {
        label: 'f(x) / M',
        data: result.chart_data.x.map((x, i) => ({
          x: x,
          y: result.chart_data.y[i]
        })),
        backgroundColor: 'rgba(244, 162, 97, 0.2)',
        borderColor: 'rgba(244, 162, 97, 1.0)',
        pointRadius: 3,
        showLine: true
      },
      {
        label: 'r2',
        data: result.chart_data.r2.map((y, i) => ({
          x: result.chart_data.x[i],
          y: y
        })),
        backgroundColor: 'rgba(42, 157, 143, 0.2)',
        borderColor: 'rgba(42, 157, 143, 1.0)',
        borderWidth: 2,
        pointRadius: 0,
        showLine: true,
        fill: true
      }
    ]
  } : null;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Método de Aceptación-Rechazo para ${result ? result.chart_data.function_name : 'f(x)'}`
      }
    },
    scales: {
      x: {
        type: 'linear' as const,
        position: 'bottom' as const,
        title: {
          display: true,
          text: 'x'
        },
        min: 1,

      },
      y: {
        title: {
          display: true,
          text: 'y'
        },
        min: 0,
        max: 1
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Variables Aleatorias - Método de Aceptación-Rechazo</h2>

        <div className="mb-6 p-6 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl shadow-md">
          <h3 className="text-lg font-bold text-blue-800 mb-4">Selecciona una función de densidad:</h3>
          <select
            value={selectedFunction}
            onChange={(e) => setSelectedFunction(e.target.value)}
            className="w-full p-3 bg-white border border-blue-300 rounded-xl text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200"
          >
            <option value="linear">f(x) = 2x | Dominio: [0, 1]</option>
            <option value="cuadratic">f(x) = -(x-2)^2 + 4 | Dominio: [0, 4]</option>
            <option value="hyperbola">f(x) = 1/x | Dominio: [0.5, 3]</option>
          </select>
          <p className='text-sm text-blue-600 mt-2'>Se utiliza g(x) = 1</p>
        </div>


        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Cantidad de números aleatorios a generar
          </label>
          <div className="flex space-x-4">
            <input
              type="number"
              value={count}
              onChange={(e) => {
                setCount(e.target.value);
                setError('');
              }}
              placeholder="Ej: 1000"
              min="1"
              max="10000"
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleGenerate}
              disabled={loading || !count}
              className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? <LoadingSpinner size="sm" /> : <Zap className="w-5 h-5" />}
              <span>{loading ? 'Generando...' : 'Generar'}</span>
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Máximo: 10,000 números</p>
        </div>

        {error && <ErrorMessage message={error} className="mb-4" />}
      </div>

      {result && (
        <>
          {/* Estadísticas */}
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

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{result.r1.length}</div>
                <div className="text-sm text-gray-600">R1 Generados</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{result.r2.length}</div>
                <div className="text-sm text-gray-600">R2 Generados</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-700">{result.generated_values.length}</div>
                <div className="text-sm text-green-600">Valores Aceptados</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">{(result.acceptance_rate * 100).toFixed(1)}%</div>
                <div className="text-sm text-blue-600">Tasa de Aceptación</div>
              </div>
            </div>
          </div>

          {/* Gráfico */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Visualización del Método de Aceptación-Rechazo
            </h3>

            {chartData && (
              <div className="h-96">
                <Line data={chartData} options={chartOptions} />
              </div>
            )}

            {chartDataDensidad && (
              <div className="h-96">
                <Line data={chartDataDensidad} options={chartOptionsDensidad} />
              </div>
            )}
          </div>

          {/* Listas de números */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* R1 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h4 className="font-semibold text-gray-900 mb-3">R1 (Primeros 20)</h4>
              <div className="bg-gray-50 p-3 rounded-lg max-h-64 overflow-y-auto">
                <div className="space-y-1 text-sm font-mono">
                  {result.r1.slice(0, 20).map((num, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-gray-500">{index + 1}:</span>
                      <span>{num.toFixed(6)}</span>
                    </div>
                  ))}
                  {result.r1.length > 20 && (
                    <div className="text-center text-gray-500 text-xs mt-2">
                      ... y {result.r1.length - 20} más
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* R2 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h4 className="font-semibold text-gray-900 mb-3">R2 (Primeros 20)</h4>
              <div className="bg-gray-50 p-3 rounded-lg max-h-64 overflow-y-auto">
                <div className="space-y-1 text-sm font-mono">
                  {result.r2.slice(0, 20).map((num, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-gray-500">{index + 1}:</span>
                      <span>{num.toFixed(6)}</span>
                    </div>
                  ))}
                  {result.r2.length > 20 && (
                    <div className="text-center text-gray-500 text-xs mt-2">
                      ... y {result.r2.length - 20} más
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Valores aceptados */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h4 className="font-semibold text-gray-900 mb-3">Valores Aceptados (Primeros 20)</h4>
              <div className="bg-green-50 p-3 rounded-lg max-h-64 overflow-y-auto">
                <div className="space-y-1 text-sm font-mono">
                  {result.generated_values.slice(0, 20).map((num, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-green-600">{index + 1}:</span>
                      <span className="font-semibold">{num.toFixed(6)}</span>
                    </div>
                  ))}
                  {result.generated_values.length > 20 && (
                    <div className="text-center text-green-600 text-xs mt-2">
                      ... y {result.generated_values.length - 20} más
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}