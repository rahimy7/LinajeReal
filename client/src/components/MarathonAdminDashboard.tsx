import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Users, Activity, Settings, TrendingUp, BookOpen, 
  Clock, UserPlus, Search, Filter, Edit2, Trash2, Calendar,
  CheckCircle, AlertCircle, RefreshCw, Download, Eye, EyeOff
} from 'lucide-react';
import ProgressManager from './ProgressManager';

// Interfaces
interface Reader {
  id: number;
  name: string;
  email: string;
  verses_read: number;
  percentage_completed: number;
  is_active: boolean;
  last_activity: string;
  assigned_books?: string[];
}

interface BibleStats {
  general: {
    total_readers: number;
    active_readers: number;
    total_verses_read: number;
    completion_percentage: number;
    verses_remaining: number;
  };
  readers: Reader[];
  books: Array<{
    name: string;
    verses_read: number;
    total_verses: number;
    completion_percentage: number;
  }>;
}

interface ReaderModalProps {
  reader: Reader | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (reader: Partial<Reader>) => void;
}

const API_BASE = process.env.NODE_ENV === 'production' 
  ? '/api/bible' 
  : 'http://localhost:5000/api/bible';


const ReaderModal: React.FC<ReaderModalProps> = ({ reader, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    is_active: true
  });

  useEffect(() => {
    if (reader) {
      setFormData({
        name: reader.name,
        email: reader.email,
        is_active: reader.is_active
      });
    } else {
      setFormData({ name: '', email: '', is_active: true });
    }
  }, [reader, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">
          {reader ? 'Editar Lector' : 'Nuevo Lector'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
              Lector activo
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {reader ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Componente principal
const MarathonAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<BibleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para gestión de lectores
  const [showReaderModal, setShowReaderModal] = useState(false);
  const [editingReader, setEditingReader] = useState<Reader | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/stats`);
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
        setError(null);
      } else {
        throw new Error('Error al cargar datos');
      }
    } catch (err) {
      setError('No se pudieron cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReader = async (readerData: Partial<Reader>) => {
    try {
      const url = editingReader 
        ? `${API_BASE}/readers/${editingReader.id}`
        : `${API_BASE}/readers`;
      
      const method = editingReader ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(readerData)
      });

      if (response.ok) {
        await loadStats(); // Recargar datos
        setEditingReader(null);
      } else {
        throw new Error('Error al guardar lector');
      }
    } catch (err) {
      setError('No se pudo guardar el lector');
    }
  };

  const handleDeleteReader = async (readerId: number) => {
    if (!confirm('¿Estás seguro de eliminar este lector?')) return;
    
    try {
      const response = await fetch(`${API_BASE}/readers/${readerId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadStats();
      } else {
        throw new Error('Error al eliminar lector');
      }
    } catch (err) {
      setError('No se pudo eliminar el lector');
    }
  };

  const handleToggleReaderStatus = async (reader: Reader) => {
    try {
      const response = await fetch(`${API_BASE}/readers/${reader.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !reader.is_active })
      });

      if (response.ok) {
        await loadStats();
      }
    } catch (err) {
      setError('No se pudo actualizar el estado del lector');
    }
  };

  const filteredReaders = stats?.readers?.filter(reader => {
    const matchesSearch = reader.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reader.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterActive === null || reader.is_active === filterActive;
    return matchesSearch && matchesFilter;
  }) || [];

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: BarChart3 },
    { id: 'readers', label: 'Lectores', icon: Users },
    { id: 'progress', label: 'Progreso', icon: BookOpen },
    { id: 'books', label: 'Libros', icon: TrendingUp },
    { id: 'settings', label: 'Configuración', icon: Settings }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Dashboard de Administración</h1>
                <p className="text-sm text-gray-600">Maratón Bíblico - Linaje Real</p>
              </div>
            </div>
            
            <button
              onClick={loadStats}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Lectores Activos</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.general.active_readers}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
                <div className="mt-2">
                  <span className="text-xs text-gray-500">
                    de {stats.general.total_readers} registrados
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Capítulos Leídos</p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.general.total_chapters_read?.toLocaleString() || 0}
                    </p>
                  </div>
                  <BookOpen className="w-8 h-8 text-green-500" />
                </div>
                <div className="mt-2">
                  <span className="text-xs text-gray-500">
                    {(1189 - (stats.general.total_chapters_read || 0)).toLocaleString()} restantes
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Progreso General</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {Math.round(stats.general.completion_percentage || 0)}%
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-500" />
                </div>
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${stats.general.completion_percentage || 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tiempo Estimado</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {stats.general.completion_percentage > 0 
                        ? Math.ceil((100 - stats.general.completion_percentage) / stats.general.completion_percentage * 72)
                        : 72
                      }h
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-500" />
                </div>
                <div className="mt-2">
                  <span className="text-xs text-gray-500">para completar</span>
                </div>
              </div>
            </div>

            {/* Top Readers */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Top Lectores</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {stats.readers
                    ?.sort((a, b) => (b.verses_read || 0) - (a.verses_read || 0))
                    .slice(0, 5)
                    .map((reader, index) => (
                      <div key={reader.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                            index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{reader.name}</p>
                            <p className="text-sm text-gray-500">{reader.email || 'Sin email'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            {reader.total_chapters_read || 0} capítulos
                          </p>
                          <p className="text-sm text-gray-500">
                            {Math.round(reader.percentage_completed || 0)}% completado
                          </p>
                        </div>
                      </div>
                    ))}
                  {(!stats.readers || stats.readers.length === 0) && (
                    <p className="text-gray-500 text-center py-4">No hay datos de lectores</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Readers Tab */}
        {activeTab === 'readers' && (
          <div className="space-y-6">
            {/* Readers Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Gestión de Lectores</h2>
                <p className="text-gray-600">Administra los participantes del maratón</p>
              </div>
              
              <button
                onClick={() => {
                  setEditingReader(null);
                  setShowReaderModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Nuevo Lector
              </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar lectores por nombre o email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <select
                    value={filterActive === null ? 'all' : filterActive ? 'active' : 'inactive'}
                    onChange={(e) => setFilterActive(
                      e.target.value === 'all' ? null : e.target.value === 'active'
                    )}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Todos los lectores</option>
                    <option value="active">Solo activos</option>
                    <option value="inactive">Solo inactivos</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Readers Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lector
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Progreso
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Última Actividad
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredReaders.map((reader) => (
                      <tr key={reader.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{reader.name}</div>
                            <div className="text-sm text-gray-500">{reader.email || 'Sin email'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                {reader.total_chapters_read || 0} capítulos
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${Math.min(reader.percentage_completed || 0, 100)}%` }}
                                ></div>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {Math.round(reader.percentage_completed || 0)}% completado
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleReaderStatus(reader)}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              reader.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {reader.is_active ? (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Activo
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Inactivo
                              </>
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {reader.last_activity 
                            ? new Date(reader.last_activity).toLocaleDateString()
                            : 'Sin actividad'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => {
                                setEditingReader(reader);
                                setShowReaderModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteReader(reader.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Marcar Progreso de Lectura</h2>
              <p className="text-gray-600">Selecciona libro, capítulo y lector para marcar como completado</p>
            </div>
            
           <ProgressManager onProgressUpdate={loadStats} />
          </div>
        )}

        {/* Books Tab */}
        {activeTab === 'books' && stats && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Progreso por Libros</h2>
              <p className="text-gray-600">Estado de lectura de cada libro bíblico</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stats.books?.map((book) => (
                <div key={book.name} className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{book.name}</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Versículos leídos</span>
                      <span className="font-medium">{book.verses_read || 0}/{book.total_verses}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${book.completion_percentage || 0}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Progreso</span>
                      <span className="font-medium text-green-600">
                        {Math.round(book.completion_percentage || 0)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Configuración del Maratón</h2>
              <p className="text-gray-600">Ajustes generales y preferencias del sistema</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuraciones Disponibles</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Exportar Datos</h4>
                    <p className="text-sm text-gray-500">Descargar reporte completo del maratón</p>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    <Download className="w-4 h-4" />
                    Exportar
                  </button>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Reiniciar Maratón</h4>
                    <p className="text-sm text-gray-500">Borrar todo el progreso y comenzar de nuevo</p>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                    <RefreshCw className="w-4 h-4" />
                    Reiniciar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Reader Modal */}
      <ReaderModal
        reader={editingReader}
        isOpen={showReaderModal}
        onClose={() => {
          setShowReaderModal(false);
          setEditingReader(null);
        }}
        onSave={handleSaveReader}
      />
    </div>
  );
};

export default MarathonAdminDashboard;