import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Users, Activity, Settings, Eye, 
  TrendingUp, BookOpen, Clock, Shield, ArrowRight,
  RefreshCw, AlertCircle, CheckCircle2, Calendar
} from 'lucide-react';
import { useLocation } from 'wouter';

const API_BASE = process.env.NODE_ENV === 'production' 
  ? '/api/bible' 
  : 'http://localhost:5000/api/bible';

interface QuickStats {
  total_readers: number;
  active_readers: number;
  chapters_completed: number;
  completion_percentage: number;
  marathon_active: boolean;
  total_books: number;
  total_chapters: number;
  readers_with_progress: number;
}

const AdminIndexPage: React.FC = () => {
  const [, navigate] = useLocation();
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadQuickStats();
  }, []);

  const loadQuickStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/stats`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Stats data received:', data); // Debug
        
        // Calcular total de versículos leídos desde la información de lectores
        const totalVersesRead = data.data.readers?.reduce((total: number, reader: any) => {
          return total + parseInt(reader.verses_read || '0');
        }, 0) || 0;

        // Contar lectores activos con progreso real
        const activeReadersCount = data.data.readers?.filter((reader: any) => 
          reader.is_active && parseInt(reader.chapters_completed || '0') > 0
        ).length || 0;

        setQuickStats({
          total_readers: data.data.readers?.length || 0,
          active_readers: activeReadersCount,
          chapters_completed: data.data.general.chapters_completed || 0,
          completion_percentage: data.data.general.completion_percentage || 0,
          marathon_active: data.data.marathon?.is_active || false,
          total_books: data.data.general.total_books || 66,
          total_chapters: data.data.general.total_chapters || 1189,
          readers_with_progress: data.data.general.readers_with_progress || 0
        });
        setError(null);
      } else {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
      setError('No se pudieron cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const adminSections = [
    {
      title: 'Dashboard Principal',
      description: 'Vista general completa del maratón con estadísticas detalladas y métricas en tiempo real',
      icon: BarChart3,
      href: '/admin/dashboard',
      color: 'blue',
      features: ['Estadísticas completas', 'Gráficos interactivos', 'Métricas de rendimiento']
    },
    {
      title: 'Gestión de Lectores',
      description: 'Administra participantes del maratón, edita perfiles y supervisa progreso individual',
      icon: Users,
      href: '/admin/readers',
      color: 'green',
      features: ['Crear/editar lectores', 'Ver progreso detallado', 'Gestionar permisos']
    },
    {
      title: 'Monitor en Tiempo Real',
      description: 'Supervisa la actividad del maratón en vivo con actualizaciones automáticas',
      icon: Activity,
      href: '/admin/live',
      color: 'purple',
      features: ['Actividad en vivo', 'Notificaciones automáticas', 'Métricas instantáneas']
    },
    {
      title: 'Vista Pública en Vivo',
      description: 'Transmisión pública del progreso del maratón para la congregación',
      icon: Eye,
      href: '/live',
      color: 'red',
      features: ['Acceso público', 'Sin login requerido', 'Optimizado para pantallas'],
      public: true
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100',
      green: 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100',
      purple: 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100',
      red: 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
    };
    return colorMap[color] || colorMap.blue;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
                  <p className="text-gray-600">Maratón Bíblico - Linaje Real 2025</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Septiembre 2025</span>
              </div>
              <button
                onClick={loadQuickStats}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Actualizar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-700 hover:text-red-900 text-xl font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* Quick Stats */}
        {quickStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Lectores Registrados</p>
                  <p className="text-2xl font-semibold text-gray-900">{quickStats.total_readers}</p>
                  <p className="text-xs text-gray-500">{quickStats.active_readers} activos</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BookOpen className="w-8 h-8 text-green-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Capítulos Completados</p>
                  <p className="text-2xl font-semibold text-gray-900">{quickStats.chapters_completed.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">de {quickStats.total_chapters.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="w-8 h-8 text-purple-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Progreso Total</p>
                  <p className="text-2xl font-semibold text-gray-900">{quickStats.completion_percentage.toFixed(1)}%</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(quickStats.completion_percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Activity className={`w-8 h-8 ${quickStats.marathon_active ? 'text-green-500' : 'text-red-500'}`} />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Estado del Maratón</p>
                  <p className={`text-2xl font-semibold ${quickStats.marathon_active ? 'text-green-600' : 'text-red-600'}`}>
                    {quickStats.marathon_active ? 'Activo' : 'Inactivo'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {quickStats.readers_with_progress} con progreso
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Admin Sections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {adminSections.map((section, index) => {
            const IconComponent = section.icon;
            return (
              <div
                key={index}
                className={`bg-white rounded-lg shadow-sm border-2 transition-all duration-200 hover:shadow-md ${getColorClasses(section.color)}`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        section.color === 'blue' ? 'bg-blue-100' :
                        section.color === 'green' ? 'bg-green-100' :
                        section.color === 'purple' ? 'bg-purple-100' :
                        'bg-red-100'
                      }`}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{section.title}</h3>
                        {section.public && (
                          <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full mt-1">
                            Público
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                  
                  <p className="mt-3 text-gray-600">{section.description}</p>
                  
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Características:</h4>
                    <ul className="space-y-1">
                      {section.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center text-sm text-gray-600">
                          <CheckCircle2 className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="mt-6">
                    <button
                      onClick={() => navigate(section.href)}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-white border border-current rounded-lg hover:bg-current hover:text-white transition-colors"
                    >
                      <span>Acceder</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="flex items-center space-x-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <BarChart3 className="w-5 h-5" />
              <span>Ver Dashboard</span>
            </button>
            
            <button
              onClick={() => navigate('/admin/live')}
              className="flex items-center space-x-2 px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <Activity className="w-5 h-5" />
              <span>Monitor en Vivo</span>
            </button>
            
            <button
              onClick={() => navigate('/live')}
              className="flex items-center space-x-2 px-4 py-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
            >
              <Eye className="w-5 h-5" />
              <span>Vista Pública</span>
            </button>
            
            <button
              onClick={loadQuickStats}
              className="flex items-center space-x-2 px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Actualizar Datos</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminIndexPage;