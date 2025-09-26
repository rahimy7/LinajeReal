import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Users, Activity, Settings, TrendingUp, BookOpen, 
  Clock, UserPlus, Search, Filter, Edit2, Trash2, Calendar,
  CheckCircle, AlertCircle, RefreshCw, Download, Eye, EyeOff, X,
  ArrowLeft
} from 'lucide-react';
import ProgressManager from './ProgressManager';
import BookProgressManager from './BookProgressManager';

const API_BASE = process.env.NODE_ENV === 'production' 
  ? '/api/bible' 
  : 'http://localhost:5000/api/bible';

// ==================== INTERFACES ====================
interface Reader {
  id: number;
  name: string;
  email?: string;
  avatar_color: string;
  is_active: boolean;
  chapters_completed: string;
  books_with_progress: string;
  verses_read: string;
  avg_reading_time: string;
  reading_speed_wpm: number;
  first_reading?: string;
  last_reading?: string;
  created_at: string;
}

interface Book {
  book_id: number;
  book_key: string;
  book_name: string;
  total_chapters: number;
  testament: string;
  completion_percentage: string;
  chapters_completed: string;
  unique_readers: string;
}

interface ReaderModalProps {
  reader: any | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (reader: any) => void;
}

// ==================== MODAL DE LECTORES ====================
const ReaderModal: React.FC<ReaderModalProps> = ({ reader, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    avatar_color: '#6366f1',
    is_active: true,
    reading_speed_wpm: 200
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [saving, setSaving] = useState(false);

  const avatarColors = [
    '#6366f1', '#8b5cf6', '#06b6d4', '#10b981', 
    '#f59e0b', '#ef4444', '#ec4899', '#84cc16'
  ];

  useEffect(() => {
    if (reader && reader.id !== 0) {
      setFormData({
        name: reader.name || '',
        email: reader.email || '',
        avatar_color: reader.avatar_color || '#6366f1',
        is_active: reader.is_active ?? true,
        reading_speed_wpm: reader.reading_speed_wpm || 200
      });
    } else {
      setFormData({
        name: '',
        email: '',
        avatar_color: '#6366f1',
        is_active: true,
        reading_speed_wpm: 200
      });
    }
    setErrors({});
  }, [reader, isOpen]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }
    
    if (formData.reading_speed_wpm < 50 || formData.reading_speed_wpm > 1000) {
      newErrors.reading_speed_wpm = 'La velocidad debe estar entre 50 y 1000 palabras por minuto';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSaving(true);
    try {
      await onSave({
        ...formData,
        name: formData.name.trim(),
        email: formData.email.trim() || undefined
      });
      onClose();
    } catch (error) {
      console.error('Error saving reader:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {reader && reader.id !== 0 ? 'Editar Lector' : 'Agregar Nuevo Lector'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={saving}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Nombre completo del lector"
                disabled={saving}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email (opcional)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="email@ejemplo.com"
                disabled={saving}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Avatar Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color de Avatar
              </label>
              <div className="flex items-center space-x-2">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                  style={{ backgroundColor: formData.avatar_color }}
                >
                  {formData.name.charAt(0).toUpperCase() || 'L'}
                </div>
                <div className="flex flex-wrap gap-2">
                  {avatarColors.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, avatar_color: color })}
                      className={`w-6 h-6 rounded-full border-2 ${
                        formData.avatar_color === color 
                          ? 'border-gray-800 ring-2 ring-blue-500' 
                          : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      disabled={saving}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Reading Speed */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Velocidad de Lectura (palabras por minuto)
              </label>
              <input
                type="number"
                value={formData.reading_speed_wpm}
                onChange={(e) => setFormData({ ...formData, reading_speed_wpm: parseInt(e.target.value) || 200 })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.reading_speed_wpm ? 'border-red-300' : 'border-gray-300'
                }`}
                min="50"
                max="1000"
                disabled={saving}
              />
              {errors.reading_speed_wpm && (
                <p className="text-red-500 text-xs mt-1">{errors.reading_speed_wpm}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Promedio: 200-250 palabras por minuto
              </p>
            </div>

            {/* Active Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={saving}
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                Lector activo
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {saving && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                {saving ? 'Guardando...' : (reader && reader.id !== 0 ? 'Actualizar' : 'Crear')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// ==================== COMPONENTE PRINCIPAL ====================
const MarathonAdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [editingReader, setEditingReader] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  
  // NUEVO: Estado para manejar el libro seleccionado
  const [selectedBookForProgress, setSelectedBookForProgress] = useState<Book | null>(null);

  // ==================== FUNCIONES DE API ====================
  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE}/stats`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Stats loaded:', data);
      
      const processedStats = {
        ...data.data,
        readers: data.data.readers || [],
        books: data.data.books || [],
        processed_metrics: {
          total_verses_read: data.data.readers?.reduce((total: number, reader: any) => {
            return total + parseInt(reader.verses_read || '0');
          }, 0) || 0,
          active_readers_count: data.data.readers?.filter((r: any) => 
            r.is_active && parseInt(r.chapters_completed || '0') > 0
          ).length || 0,
          completed_books_count: data.data.books?.filter((book: any) => 
            parseFloat(book.completion_percentage) === 100
          ).length || 0,
          books_in_progress: data.data.books?.filter((book: any) => {
            const percentage = parseFloat(book.completion_percentage);
            return percentage > 0 && percentage < 100;
          }).length || 0
        }
      };
      
      setStats(processedStats);
      
    } catch (err) {
      console.error('Error loading stats:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReader = async (readerData: any) => {
    try {
      const isEdit = editingReader && editingReader.id !== 0;
      const url = isEdit 
        ? `${API_BASE}/readers/${editingReader.id}`
        : `${API_BASE}/readers`;
      const method = isEdit ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(readerData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al guardar lector');
      }

      await loadStats();
      setEditingReader(null);
      
    } catch (err) {
      console.error('Error saving reader:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar el lector');
    }
  };

  const handleDeleteReader = async (readerId: number) => {
    if (!confirm('¿Estás seguro de eliminar este lector? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE}/readers/${readerId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar lector');
      }

      await loadStats();
      
    } catch (err) {
      console.error('Error deleting reader:', err);
      setError(err instanceof Error ? err.message : 'Error al eliminar el lector');
    }
  };

  const handleToggleReaderStatus = async (reader: any) => {
    try {
      const response = await fetch(`${API_BASE}/readers/${reader.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          is_active: !reader.is_active 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar estado del lector');
      }

      await loadStats();
      
    } catch (err) {
      console.error('Error toggling reader status:', err);
      setError(err instanceof Error ? err.message : 'Error al actualizar el estado del lector');
    }
  };

  // NUEVA FUNCIÓN: Manejar selección de libro
  const handleBookSelect = (book: Book) => {
    setSelectedBookForProgress(book);
  };

  // NUEVA FUNCIÓN: Volver a la vista de libros
  const handleBackToBooks = () => {
    setSelectedBookForProgress(null);
  };

  // ==================== FUNCIONES DE FILTRADO ====================
  const getFilteredReaders = () => {
    if (!stats?.readers) return [];
    
    return stats.readers.filter((reader: any) => {
      const matchesSearch = !searchTerm || 
        reader.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (reader.email && reader.email.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesFilter = filterActive === null || reader.is_active === filterActive;
      
      return matchesSearch && matchesFilter;
    });
  };

  const filteredReaders = getFilteredReaders();

  // ==================== EFECTOS ====================
  useEffect(() => {
    loadStats();
    
   /*  const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadStats();
      }
    }, 30000);
    
    return () => clearInterval(interval); */
  }, []);

  // ==================== CONSTANTES ====================
  const tabs = [
    { id: 'overview', label: 'Resumen', icon: BarChart3 },
    { id: 'readers', label: 'Lectores', icon: Users },
    { id: 'books', label: 'Libros', icon: BookOpen },
  
    { id: 'settings', label: 'Configuración', icon: Settings }
  ];

  // ==================== RENDER ====================
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
                onClick={() => {
                  setActiveTab(id);
                  // Reset book selection when changing tabs
                  if (id !== 'books') {
                    setSelectedBookForProgress(null);
                  }
                }}
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
                    <p className="text-sm font-medium text-gray-600">Lectores Registrados</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.readers?.length || 0}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
                <div className="mt-2">
                  <span className="text-xs text-gray-500">
                    {stats.readers?.filter((r: any) => r.is_active).length || 0} activos
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Capítulos Completados</p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.general.chapters_completed?.toLocaleString() || 0}
                    </p>
                  </div>
                  <BookOpen className="w-8 h-8 text-green-500" />
                </div>
                <div className="mt-2">
                  <span className="text-xs text-gray-500">
                    {(stats.general.total_chapters - stats.general.chapters_completed).toLocaleString()} restantes
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Progreso Total</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {stats.general.completion_percentage?.toFixed(1) || 0}%
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-500" />
                </div>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(stats.general.completion_percentage || 0, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Versículos Leídos</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {stats.readers?.reduce((total: number, reader: any) => {
                        return total + parseInt(reader.verses_read || '0');
                      }, 0).toLocaleString() || 0}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-500" />
                </div>
                <div className="mt-2">
                  <span className="text-xs text-gray-500">
                    Aprox. {Math.round((stats.readers?.reduce((total: number, reader: any) => {
                      return total + parseInt(reader.verses_read || '0');
                    }, 0) || 0) / 25)} páginas
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Readers Tab */}
        {activeTab === 'readers' && stats && (
          <div className="space-y-6">
            {/* Header with Add Button */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Gestión de Lectores ({stats.readers?.length || 0})
              </h3>
              <button
                onClick={() => setEditingReader({ id: 0, name: '', email: '', is_active: true })}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <UserPlus className="w-4 h-4" />
                Agregar Lector
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
                        Actividad
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredReaders.length > 0 ? filteredReaders.map((reader: any) => (
                      <tr key={reader.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium mr-4"
                              style={{ backgroundColor: reader.avatar_color || '#6366f1' }}
                            >
                              {reader.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{reader.name}</div>
                              <div className="text-sm text-gray-500">{reader.email}</div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">
                                {parseInt(reader.chapters_completed || '0')} capítulos
                              </span>
                              <span className="text-gray-500">•</span>
                              <span className="text-gray-600">
                                {parseInt(reader.verses_read || '0').toLocaleString()} versículos
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {parseInt(reader.books_with_progress || '0')} libros iniciados
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            reader.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                              reader.is_active ? 'bg-green-500' : 'bg-red-500'
                            }`} />
                            {reader.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {reader.last_reading 
                                ? new Date(reader.last_reading).toLocaleDateString('es-ES', {
                                    day: '2-digit',
                                    month: 'short'
                                  })
                                : 'Sin actividad'
                              }
                            </div>
                            {reader.avg_reading_time && (
                              <div className="flex items-center mt-1">
                                <Clock className="w-4 h-4 mr-1" />
                                {reader.avg_reading_time}min/cap
                              </div>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end items-center space-x-2">
                            <button
                              onClick={() => handleToggleReaderStatus(reader)}
                              className={`p-1.5 rounded-full hover:bg-gray-100 ${
                                reader.is_active ? 'text-red-600' : 'text-green-600'
                              }`}
                              title={reader.is_active ? 'Desactivar' : 'Activar'}
                            >
                              {reader.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            
                            <button
                              onClick={() => setEditingReader(reader)}
                              className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-full"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => handleDeleteReader(reader.id)}
                              className="p-1.5 text-red-600 hover:bg-red-100 rounded-full"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <Users className="w-12 h-12 text-gray-300 mb-4" />
                            <p className="text-gray-500 text-lg">No hay lectores que mostrar</p>
                            <p className="text-gray-400 text-sm mt-1">
                              {searchTerm || filterActive !== null 
                                ? 'Intenta ajustar los filtros de búsqueda'
                                : 'Agrega el primer lector para comenzar'
                              }
                            </p>
                            {!searchTerm && filterActive === null && (
                              <button
                                onClick={() => setEditingReader({ id: 0, name: '', email: '', is_active: true })}
                                className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                              >
                                <UserPlus className="w-4 h-4" />
                                Agregar Primer Lector
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Reader Statistics Summary */}
            {stats.readers && stats.readers.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center">
                    <Users className="w-6 h-6 text-blue-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Total Registrados</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.readers.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center">
                    <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Lectores Activos</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.readers.filter((r: any) => r.is_active).length}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center">
                    <Activity className="w-6 h-6 text-purple-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Con Progreso</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.readers.filter((r: any) => parseInt(r.chapters_completed || '0') > 0).length}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center">
                    <TrendingUp className="w-6 h-6 text-orange-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Promedio Cap/Lector</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.readers.length > 0 
                          ? (stats.readers.reduce((acc: number, r: any) => acc + parseInt(r.chapters_completed || '0'), 0) / stats.readers.length).toFixed(1)
                          : '0'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Books Tab */}
        {activeTab === 'books' && stats && (
          <div className="space-y-6">
            {selectedBookForProgress ? (
              // Vista de progreso individual del libro
              <div>
                {/* Header con botón de regreso */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleBackToBooks}
                      className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Volver a Libros
                    </button>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Progreso de {selectedBookForProgress.book_name}
                    </h3>
                  </div>
                </div>

                {/* Componente de progreso del libro */}
                <BookProgressManager 
                  book={selectedBookForProgress} 
                  onProgressUpdate={loadStats} 
                />
              </div>
            ) : (
              // Vista principal de libros
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Progreso por Libros</h3>
                  <p className="text-sm text-gray-500">
                    Haz clic en un libro para ver capítulos y marcar como completados
                  </p>
                </div>

                {/* Books Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.books?.map((book: any) => {
                    const completionPercentage = parseFloat(book.completion_percentage || '0');
                    const chaptersCompleted = parseInt(book.chapters_completed || '0');
                    const totalChapters = book.total_chapters;
                    
                    return (
                      <div 
                        key={book.book_id} 
                        onClick={() => handleBookSelect(book)}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-all cursor-pointer hover:bg-gray-100"
                      >
                        {/* Book Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">
                              {book.book_name}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                              {book.testament === 'old' ? 'Antiguo Testamento' : 'Nuevo Testamento'}
                            </p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            completionPercentage === 100 
                              ? 'bg-green-100 text-green-800' 
                              : completionPercentage > 0 
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-600'
                          }`}>
                            {completionPercentage.toFixed(0)}%
                          </span>
                        </div>

                        {/* Progress Info */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Capítulos leídos</span>
                            <span className="font-medium text-gray-900">
                              {chaptersCompleted}/{totalChapters}
                            </span>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                completionPercentage === 100 
                                  ? 'bg-green-500' 
                                  : completionPercentage > 0 
                                    ? 'bg-blue-500'
                                    : 'bg-gray-300'
                              }`}
                              style={{ width: `${Math.min(completionPercentage, 100)}%` }}
                            />
                          </div>

                          {/* Additional Info */}
                          <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                            <span>
                              {book.unique_readers > 0 && `${book.unique_readers} lector${book.unique_readers !== '1' ? 'es' : ''}`}
                            </span>
                            {completionPercentage === 100 && (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                        </div>

                        {/* Click hint */}
                        <div className="mt-3 pt-2 border-t border-gray-200">
                          <p className="text-xs text-blue-600 flex items-center">
                            <BookOpen className="w-3 h-3 mr-1" />
                            Clic para gestionar capítulos
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Books Summary */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <BookOpen className="w-6 h-6 text-blue-500 mr-3" />
                      <div>
                        <p className="text-sm text-blue-600 font-medium">Total de Libros</p>
                        <p className="text-2xl font-bold text-blue-900">{stats.general.total_books}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
                      <div>
                        <p className="text-sm text-green-600 font-medium">Libros Completados</p>
                        <p className="text-2xl font-bold text-green-900">
                          {stats.books?.filter((book: any) => parseFloat(book.completion_percentage) === 100).length || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <Activity className="w-6 h-6 text-yellow-500 mr-3" />
                      <div>
                        <p className="text-sm text-yellow-600 font-medium">En Progreso</p>
                        <p className="text-2xl font-bold text-yellow-900">
                          {stats.general.books_with_progress || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <TrendingUp className="w-6 h-6 text-purple-500 mr-3" />
                      <div>
                        <p className="text-sm text-purple-600 font-medium">Progreso Promedio</p>
                        <p className="text-2xl font-bold text-purple-900">
                          {(stats.books?.reduce((acc: number, book: any) => 
                            acc + parseFloat(book.completion_percentage || '0'), 0) / (stats.books?.length || 1)
                          ).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Gestor de Progreso Manual
              </h3>
              <ProgressManager onProgressUpdate={loadStats} />
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Configuración del Maratón
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Maratón
                  </label>
                  <input
                    type="text"
                    value={stats?.marathon?.name || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    readOnly
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <span className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                    stats?.marathon?.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {stats?.marathon?.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Inicio
                  </label>
                  <input
                    type="datetime-local"
                    value={stats?.marathon?.start_time ? stats.marathon.start_time.substring(0, 16) : ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    readOnly
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Fin
                  </label>
                  <input
                    type="datetime-local"
                    value={stats?.marathon?.end_time ? stats.marathon.end_time.substring(0, 16) : ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    readOnly
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={stats?.marathon?.description || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reader Modal */}
        {editingReader && (
          <ReaderModal
            reader={editingReader}
            isOpen={!!editingReader}
            onClose={() => setEditingReader(null)}
            onSave={handleSaveReader}
          />
        )}
      </main>
    </div>
  );
};

export default MarathonAdminDashboard;