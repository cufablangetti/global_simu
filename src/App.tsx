import React, { useState } from 'react';
import { AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import Navigation from './components/Navigation';
import GenerationTab from './components/generation/GenerationTab';
import ValidationTab from './components/validation/ValidationTab';
import RandomVariablesTab from './components/random-variables/RandomVariablesTab';
import { GenerationResponse } from './types';
import { apiService } from './services/api';

type TabType = 'generation' | 'validation' | 'random-variables';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('generation');
  const [generatedData, setGeneratedData] = useState<GenerationResponse | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [parameters, setParameters] = useState<Record<string, number>>({});
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);

  React.useEffect(() => {
    // Verificar conexión con el backend al cargar
    const checkBackend = async () => {
      const connected = await apiService.checkConnection();
      setBackendConnected(connected);
    };
    
    checkBackend();
    
    // Verificar cada 30 segundos
    const interval = setInterval(checkBackend, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleGenerationComplete = (data: GenerationResponse) => {
    setGeneratedData(data);
  };

  const handleMethodChange = (method: string, params: Record<string, number>) => {
    setSelectedMethod(method);
    setParameters(params);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Generador de Números Pseudoaleatorios
              </h1>
              <p className="text-sm text-gray-600">
                Métodos congruenciales, cuadrados medios y variables aleatorias
              </p>
            </div>
            
            {/* Indicador de conexión */}
            <div className="flex items-center space-x-2">
              {backendConnected === null ? (
                <div className="flex items-center space-x-2 text-gray-500">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
                  <span className="text-sm">Conectando...</span>
                </div>
              ) : backendConnected ? (
                <div className="flex items-center space-x-2 text-green-600">
                  <Wifi className="w-4 h-4" />
                  <span className="text-sm">Backend conectado</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-red-600">
                  <WifiOff className="w-4 h-4" />
                  <span className="text-sm">Backend desconectado</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Advertencia si no hay conexión */}
      {backendConnected === false && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                <strong>Sin conexión al backend:</strong> Asegúrese de que el servidor Python esta ejecutándose.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navegación */}
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto py-6">
        {activeTab === 'generation' && (
          <GenerationTab 
            onGenerationComplete={handleGenerationComplete}
            generatedData={generatedData}
          />
        )}
        
        {activeTab === 'validation' && (
          <ValidationTab 
            generatedData={generatedData}
            selectedMethod={selectedMethod}
            parameters={parameters}
          />
        )}
        
        {activeTab === 'random-variables' && (
          <RandomVariablesTab />
        )}
      </main>
    </div>
  );
}

export default App;