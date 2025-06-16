import React from 'react';
import { Calculator, CheckCircle, BarChart3 } from 'lucide-react';

interface NavigationProps {
  activeTab: 'generation' | 'validation' | 'random-variables';
  onTabChange: (tab: 'generation' | 'validation' | 'random-variables') => void;
}

export default function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const tabs = [
    {
      id: 'generation' as const,
      name: 'Generación',
      icon: Calculator,
      description: 'Generar números pseudoaleatorios'
    },
    {
      id: 'validation' as const,
      name: 'Comprobación',
      icon: CheckCircle,
      description: 'Validar condiciones y pruebas estadísticas'
    },
    {
      id: 'random-variables' as const,
      name: 'Variables Aleatorias',
      icon: BarChart3,
      description: 'Método de aceptación-rechazo'
    }
  ];

  return (
    <nav className="border-b border-gray-200 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  flex items-center px-1 py-4 border-b-2 text-sm font-medium transition-colors duration-200
                  ${isActive 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-5 h-5 mr-2" />
                <div className="text-left">
                  <div className="font-medium">{tab.name}</div>
                  <div className="text-xs text-gray-400 hidden sm:block">
                    {tab.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}