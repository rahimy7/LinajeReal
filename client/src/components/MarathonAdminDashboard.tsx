import React, { useState, useEffect } from 'react';
import { 
  Users, BookOpen, Activity, Clock, CheckCircle2, AlertCircle, 
  Plus, Edit3, Trash2, Save, X, Search, Filter, Calendar,
  TrendingUp, Award, Target, RefreshCw, Settings, Eye,
  PlayCircle, PauseCircle, UserPlus, BookMarked
} from 'lucide-react';

// Configuración de la API
const API_BASE = process.env.NODE_ENV === 'production' 
  ? '/api/bible' 
  : 'http://localhost:5000/api/bible';

// Tipos de datos
interface Reader {
  id: number;
  uuid: string;
  name: string;
  email?: string;
  avatar_color: string;
  is_active: boolean;
  total_chapters_read: number;
  total_verses_read: number;
  reading_speed_wpm: number;
  created_at: string;
}

interface Book {
  id: number;
  key: string;
  name: string;
  testament: 'old' | 'new';
  order_index: number;
  total_chapters: number;
  completion_percentage: number;
  verses_read: number;
  total_verses: number;
}

interface MarathonConfig {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  current_book_id?: number;
  total_participants: number;
  description: string;
}

interface Stats {
  general: {
    total_books: number;
    total_readers: number;
    active_readers: number;
    total_verses_read: number;
    total_chapters: number;
    total_verses: number;
    completion_percentage: number;
  };
  readers: Reader[];
  books: Book[];
  marathon: MarathonConfig;
}

interface ReadingProgress {
  reader_id: number;
  reader_name: string;
  verse_id: number;
  book_name: string;
  chapter_number: number;
  verse_number: number;
  is_read: boolean;
  read_at?: string;
  notes?: string;
}

// Funciones de API
const api = {
  async getStats(): Promise<Stats> {
    const response = await fetch(`${API_BASE}/stats`);
    if (!response.ok) throw new Error('Error al cargar estadísticas');
    const data = await response.json();
    return data.data;
  },

  async getReaders(): Promise<Reader[]> {
    const response = await fetch(`${API_BASE}/readers`);
    if (!response.ok) throw new Error('Error al cargar lectores');
    const data = await response.json();
    return data.data;
  },

  async createReader(reader: Omit<Reader, 'id' | 'uuid' | 'created_at'>): Promise<Reader> {
    const response = await fetch(`${API_BASE}/readers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reader)
    });
    if (!response.ok) throw new Error('Error al crear lector');
    const data = await response.json();
    return data.data;
  },

  async updateReader(id: number, reader: Partial<Reader>): Promise<Reader> {
    const response = await fetch(`${API_BASE}/readers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reader)
    });
    if (!response.ok) throw new Error('Error al actualizar lector');
    const data = await response.json();
    return data.data;
  },

  async deleteReader(id: number): Promise<void> {
    const response = await fetch(`${API_BASE}/readers/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Error al eliminar lector');
  },

  async getReaderProgress(readerId: number): Promise<ReadingProgress[]> {
    const response = await fetch(`${API_BASE}/progress/${readerId}`);
    if (!response.ok) throw new Error('Error al cargar progreso');
    const data = await response.json();
    return data.data;
  },

  async markVerseAsRead(readerId: number, verseId: number, isRead: boolean = true, notes?: string): Promise<void> {
    const response = await fetch(`${API_BASE}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        reader_id: readerId, 
        verse_id: verseId, 
        is_read: isRead,
        notes 
      })
    });
    if (!response.ok) throw new Error('Error al marcar progreso');
  },

  async updateMarathonConfig(config: Partial<MarathonConfig>): Promise<MarathonConfig> {
    const response = await fetch(`${API_BASE}/marathon/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    if (!response.ok) throw new Error('Error al actualizar configuración');
    const data = await response.json();
    return data.data;
  }
};

const MarathonAdminDashboard: React.FC = () => {
  // Estados principales
  const [activeTab, setActiveTab] = useState<'overview' | 'readers' | 'progress' | 'config'>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [readers, setReaders] = useState<Reader[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para modales y formularios
  const [showReaderModal, setShowReaderModal] = useState(false);
  const [editingReader, setEditingReader] = useState<Reader | null>(null);
  const [selectedReader, setSelectedReader] = useState<Reader | null>(null);
  const [readerProgress, setReaderProgress] = useState<ReadingProgress[]>([]);

  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | 'all'>('all');
  
  // Cargar datos iniciales
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [statsData, readersData] = await Promise.all([
        api.getStats(),
        api.getReaders()
      ]);
      
      setStats(statsData);
      setReaders(readersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const loadReaderProgress = async (reader: Reader) => {
    try {
      const progress = await api.getReaderProgress(reader.id);
      setReaderProgress(progress);
      setSelectedReader(reader);
    } catch (err) {
      setError('Error al cargar progreso del lector');
    }
  };

  const handleSaveReader = async (readerData: Omit<Reader, 'id' | 'uuid' | 'created_at'>) => {
    try {
      if (editingReader) {
        await api.updateReader(editingReader.id, readerData);
      } else {
        await api.createReader(readerData);
      }
      
      setShowReaderModal(false);
      setEditingReader(null);
      await loadData(); // Recargar datos
    } catch (err) {
      setError('Error al guardar lector');
    }
  };

  const handleDeleteReader = async (reader: Reader) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar a ${reader.name}?`)) {
      try {
        await api.deleteReader(reader.id);
        await loadData();
      } catch (err) {
        setError('Error al eliminar lector');
      }
    }
  };

  // Filtrar lectores
  const filteredReaders = readers.filter(reader => {
    const matchesSearch = reader.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reader.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterActive === 'all' || reader.is_active === filterActive;
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="mt-2 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Administración del Maratón Bíblico
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Linaje Real - Gestión completa del evento
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={loadData}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Actualizar
              </button>
              
              {stats?.marathon?.is_active ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-800 rounded-lg">
                  <PlayCircle className="w-4 h-4" />
                  Maratón Activo
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-800 rounded-lg">
                  <PauseCircle className="w-4 h-4" />
                  Maratón Inactivo
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
            <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="border-b border-gray-200">
          <div className="flex space-x-8">
            {[
              { key: 'overview', label: 'Resumen', icon: Activity },
              { key: 'readers', label: 'Lectores', icon: Users },
              { key: 'progress', label: 'Progreso', icon: BookOpen },
              { key: 'config', label: 'Configuración', icon: Settings }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                    <p className="text-sm font-medium text-gray-600">Progreso Total</p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.general.completion_percentage.toFixed(1)}%
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
                <div className="mt-2">
                  <span className="text-xs text-gray-500">
                    {stats.general.total_verses_read.toLocaleString()} versículos leídos
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Libros</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.general.total_books}</p>
                  </div>
                  <BookOpen className="w-8 h-8 text-purple-500" />
                </div>
                <div className="mt-2">
                  <span className="text-xs text-gray-500">
                    {stats.general.total_chapters.toLocaleString()} capítulos
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tiempo Estimado</p>
                    <p className="text-2xl font-bold text-orange-600">72h</p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-500" />
                </div>
                <div className="mt-2">
                  <span className="text-xs text-gray-500">Maratón completo</span>
                </div>
              </div>
            </div>

            {/* Top Readers */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-500" />
                  Top Lectores
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {stats.readers
                    .sort((a, b) => (b.total_verses_read || 0) - (a.total_verses_read || 0))
                    .slice(0, 5)
                    .map((reader, index) => (
                      <div key={reader.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                              index === 0 ? 'bg-yellow-500' :
                              index === 1 ? 'bg-gray-400' :
                              index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                            }`}>
                              {index + 1}
                            </div>
                          </div>
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                            style={{ backgroundColor: reader.avatar_color }}
                          >
                            {reader.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{reader.name}</p>
                            <p className="text-sm text-gray-500">{reader.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {reader.total_chapters_read || 0} capítulos
                          </p>
                          <p className="text-sm text-gray-500">
                            {reader.total_verses_read || 0} versículos
                          </p>
                        </div>
                      </div>
                    ))}
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
                    value={filterActive}
                    onChange={(e) => setFilterActive(
                      e.target.value === 'all' ? 'all' : 
                      e.target.value === 'true'
                    )}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Todos</option>
                    <option value="true">Activos</option>
                    <option value="false">Inactivos</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Readers List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lector
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Progreso
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Velocidad
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
                          <div className="flex items-center">
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold mr-4"
                              style={{ backgroundColor: reader.avatar_color }}
                            >
                              {reader.name.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {reader.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {reader.email || 'Sin email'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            reader.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {reader.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {reader.total_chapters_read || 0} capítulos
                          </div>
                          <div className="text-sm text-gray-500">
                            {reader.total_verses_read || 0} versículos
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {reader.reading_speed_wpm} wpm
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => loadReaderProgress(reader)}
                              className="text-blue-600 hover:text-blue-900 p-1"
                              title="Ver progreso"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingReader(reader);
                                setShowReaderModal(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-900 p-1"
                              title="Editar"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteReader(reader)}
                              className="text-red-600 hover:text-red-900 p-1"
                              title="Eliminar"
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
        {activeTab === 'progress' && stats && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Progreso del Maratón</h2>
              <p className="text-gray-600">Seguimiento detallado de la lectura</p>
            </div>

            {/* Progress by Books */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Progreso por Libros</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {stats.books.map((book) => (
                    <div key={book.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-gray-900">{book.name}</h4>
                        <span className="text-sm font-medium text-gray-600">
                          {book.completion_percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${book.completion_percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{book.verses_read} / {book.total_verses} versículos</span>
                        <span>{book.total_chapters} capítulos</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Configuration Tab */}
        {activeTab === 'config' && stats?.marathon && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Configuración del Maratón</h2>
              <p className="text-gray-600">Ajustes generales del evento</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Maratón
                  </label>
                  <input
                    type="text"
                    defaultValue={stats.marathon.name}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <select
                    defaultValue={stats.marathon.is_active ? 'active' : 'inactive'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Inicio
                  </label>
                  <input
                    type="datetime-local"
                    defaultValue={new Date(stats.marathon.start_time).toISOString().slice(0, 16)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Fin
                  </label>
                  <input
                    type="datetime-local"
                    defaultValue={new Date(stats.marathon.end_time).toISOString().slice(0, 16)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    rows={3}
                    defaultValue={stats.marathon.description}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe el objetivo y características del maratón..."
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Guardar Configuración
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Reader Modal */}
      {showReaderModal && (
        <ReaderModal
          reader={editingReader}
          onSave={handleSaveReader}
          onClose={() => {
            setShowReaderModal(false);
            setEditingReader(null);
          }}
        />
      )}

      {/* Progress Modal */}
      {selectedReader && (
        <ProgressModal
          reader={selectedReader}
          progress={readerProgress}
          onClose={() => {
            setSelectedReader(null);
            setReaderProgress([]);
          }}
          onMarkProgress={api.markVerseAsRead}
        />
      )}
    </div>
  );
};

// Componente Modal para Lectores
interface ReaderModalProps {
  reader: Reader | null;
  onSave: (reader: Omit<Reader, 'id' | 'uuid' | 'created_at'>) => void;
  onClose: () => void;
}

const ReaderModal: React.FC<ReaderModalProps> = ({ reader, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: reader?.name || '',
    email: reader?.email || '',
    avatar_color: reader?.avatar_color || '#6366f1',
    is_active: reader?.is_active ?? true,
    reading_speed_wpm: reader?.reading_speed_wpm || 200,
    total_chapters_read: reader?.total_chapters_read || 0,
    total_verses_read: reader?.total_verses_read || 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const colors = [
    '#6366f1', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6b7280'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              {reader ? 'Editar Lector' : 'Nuevo Lector'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre Completo *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Pastor Fernando"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="correo@linajereal.org"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color del Avatar
              </label>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, avatar_color: color })}
                    className={`w-8 h-8 rounded-full border-2 ${
                      formData.avatar_color === color ? 'border-gray-900' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Velocidad de Lectura (palabras por minuto)
              </label>
              <input
                type="number"
                min="50"
                max="500"
                value={formData.reading_speed_wpm}
                onChange={(e) => setFormData({ ...formData, reading_speed_wpm: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                Lector activo en el maratón
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {reader ? 'Actualizar' : 'Crear'} Lector
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Componente Modal para Progreso
interface ProgressModalProps {
  reader: Reader;
  progress: ReadingProgress[];
  onClose: () => void;
  onMarkProgress: (readerId: number, verseId: number, isRead: boolean, notes?: string) => Promise<void>;
}

const ProgressModal: React.FC<ProgressModalProps> = ({ reader, progress, onClose, onMarkProgress }) => {
  const [filter, setFilter] = useState<'all' | 'read' | 'unread'>('all');

  const filteredProgress = progress.filter(item => {
    if (filter === 'read') return item.is_read;
    if (filter === 'unread') return !item.is_read;
    return true;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
                style={{ backgroundColor: reader.avatar_color }}
              >
                {reader.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Progreso de {reader.name}
                </h3>
                <p className="text-gray-600">
                  {reader.total_verses_read || 0} versículos leídos • {reader.total_chapters_read || 0} capítulos
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Todos ({progress.length})
              </button>
              <button
                onClick={() => setFilter('read')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'read' ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Leídos ({progress.filter(p => p.is_read).length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'unread' ? 'bg-red-100 text-red-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                No leídos ({progress.filter(p => !p.is_read).length})
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto max-h-96 p-6">
          {filteredProgress.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BookMarked className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No hay registros de progreso para mostrar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProgress.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onMarkProgress(reader.id, item.verse_id, !item.is_read)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        item.is_read 
                          ? 'bg-green-500 border-green-500 text-white' 
                          : 'border-gray-300 hover:border-green-500'
                      }`}
                    >
                      {item.is_read && <CheckCircle2 className="w-4 h-4" />}
                    </button>
                    <div>
                      <p className="font-medium text-gray-900">
                        {item.book_name} {item.chapter_number}:{item.verse_number}
                      </p>
                      {item.read_at && (
                        <p className="text-sm text-gray-500">
                          Leído: {new Date(item.read_at).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      )}
                      {item.notes && (
                        <p className="text-sm text-blue-600 mt-1">
                          Nota: {item.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarathonAdminDashboard;