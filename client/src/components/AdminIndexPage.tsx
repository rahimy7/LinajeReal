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
  total_verses_read: number;
  completion_percentage: number;
  marathon_active: boolean;
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
        setQuickStats({
          total_readers: data.data.general.total_readers,
          active_readers: data.data.general.active_readers || data.data.general.total_readers,
          total_verses_read: data.data.general.total_verses_read,
          completion_percentage: data.data.general.completion_percentage || 0,
          marathon_active: data.data.marathon?.is_active || false
        });
        setError(null);
      } else {
        throw new Error('Error al cargar estadísticas');
      }
    } catch (err) {
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
      href: '/admin',
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
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Panel de Administración
                  </h1>
                  <p className="text-gray-600">Maratón Bíblico - Linaje Real 2025</p>
                </div>
              </div>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Quick Stats */}
        {quickStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Estado del Maratón</p>
                  <div className="flex items-center gap-2 mt-1">
                    {quickStats.marathon_active ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <span className="text-lg font-semibold text-green-600">Activo</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-5 h-5 text-gray-400" />
                        <span className="text-lg font-semibold text-gray-600">Inactivo</span>
                      </>
                    )}
                  </div>
                </div>
                <Calendar className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Lectores Activos</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {quickStats.active_readers}
                  </p>
                  <p className="text-xs text-gray-500">
                    de {quickStats.total_readers} registrados
                  </p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Progreso Total</p>
                  <p className="text-2xl font-bold text-green-600">
                    {quickStats.completion_percentage.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500">
                    {quickStats.total_verses_read.toLocaleString()} versículos
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tiempo Estimado</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {quickStats.completion_percentage > 0 ? 
                      Math.ceil((100 - quickStats.completion_percentage) / quickStats.completion_percentage * 72) : 72
                    }h
                  </p>
                  <p className="text-xs text-gray-500">para completar</p>
                </div>
                <Clock className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>
        )}

        {/* Admin Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {adminSections.map((section) => (
            <div
              key={section.href}
              className={`bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden ${
                section.public ? 'ring-2 ring-red-200' : ''
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-${section.color}-100`}>
                      <section.icon className={`w-6 h-6 text-${section.color}-600`} />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        {section.title}
                        {section.public && (
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                            Público
                          </span>
                        )}
                      </h3>
                      <p className="text-gray-600 mt-1">{section.description}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Funcionalidades:</h4>
                  <ul className="space-y-1">
                    {section.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => navigate(section.href)}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                    section.public
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : `bg-${section.color}-600 hover:bg-${section.color}-700 text-white`
                  }`}
                >
                  Acceder a {section.title}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-12 bg-blue-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Acerca del Maratón Bíblico
              </h3>
              <p className="text-blue-700 mb-4">
                El Maratón Bíblico de Linaje Real es un evento de 72 horas donde la congregación 
                lee toda la Biblia de forma continua, fortaleciendo la fe y la unidad comunitaria.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-800">66 libros bíblicos</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-800">72 horas continuas</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-800">Participación comunitaria</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminIndexPage;