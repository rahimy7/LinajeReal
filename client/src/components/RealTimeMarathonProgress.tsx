import React, { useState, useEffect } from 'react';
import { 
  Clock, Users, BookOpen, TrendingUp, RefreshCw, 
  Play, Pause, SkipForward, Volume2, VolumeX,
  Calendar, Award, Target, Activity
} from 'lucide-react';

const API_BASE = process.env.NODE_ENV === 'production' 
  ? '/api/bible' 
  : 'http://localhost:5000/api/bible';

interface RealtimeStats {
  overall_completion_percentage: number;
  total_verses: number;
  verses_read: number;
  total_chapters: number;
  chapters_with_progress: number;
  active_readers_count: number;
  current_pace: number;
  estimated_completion_time: string;
}

interface ActiveReader {
  id: number;
  name: string;
  avatar_color: string;
  recent_verses_read: number;
  last_activity: string;
}

interface MarathonSession {
  id: string;
  current_book: string;
  current_chapter: number;
  current_reader: string;
  start_time: string;
  estimated_duration: number;
}

const RealTimeMarathonProgress: React.FC = () => {
  const [stats, setStats] = useState<RealtimeStats | null>(null);
  const [activeReaders, setActiveReaders] = useState<ActiveReader[]>([]);
  const [currentSession, setCurrentSession] = useState<MarathonSession | null>(null);
  const [isLive, setIsLive] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 segundos
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [lastVerseCount, setLastVerseCount] = useState(0);

  // Cargar datos en tiempo real
  const loadRealTimeData = async () => {
    try {
      const [statsResponse, activeReadersResponse] = await Promise.all([
        fetch(`${API_BASE}/reports/realtime/stats`),
        fetch(`${API_BASE}/reports/realtime/active-readers`)
      ]);

      if (statsResponse.ok && activeReadersResponse.ok) {
        const statsData = await statsResponse.json();
        const activeReadersData = await activeReadersResponse.json();
        
        setStats(statsData.data);
        setActiveReaders(activeReadersData.data);
        
        // Reproducir sonido si hay progreso nuevo
        if (soundEnabled && statsData.data.verses_read > lastVerseCount) {
          playProgressSound();
        }
        setLastVerseCount(statsData.data.verses_read);
        
        setError(null);
      }
    } catch (err) {
      setError('Error al cargar datos en tiempo real');
    } finally {
      setLoading(false);
    }
  };

  // Reproducir sonido de progreso
  const playProgressSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcCzmI0fPTgjMGJny96+OGRA0PVqzk7...'); // Base64 de un sonido corto
      audio.volume = 0.3;
      audio.play();
    } catch (error) {
      console.log('No se pudo reproducir el sonido de progreso');
    }
  };

  // Efecto para actualización automática
  useEffect(() => {
    loadRealTimeData();
    
    const interval = setInterval(() => {
      if (isLive) {
        loadRealTimeData();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [isLive, refreshInterval, soundEnabled, lastVerseCount]);

  // Calcular estadísticas derivadas
  const calculateDerivedStats = () => {
    if (!stats) return null;

    const completionRate = stats.overall_completion_percentage;
    const versesPerHour = stats.current_pace || 0;
    const remainingVerses = stats.total_verses - stats.verses_read;
    const estimatedHours = versesPerHour > 0 ? remainingVerses / versesPerHour : 0;
    
    return {
      progress: completionRate,
      pace: versesPerHour,
      timeRemaining: estimatedHours,
      efficiency: (stats.verses_read / stats.total_verses) * 100
    };
  };

  const derivedStats = calculateDerivedStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-4" />
          <p>Cargando datos en tiempo real...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header con controles */}
      <header className="bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                Maratón Bíblico - EN VIVO
              </h1>
              <p className="text-gray-400 mt-1">Linaje Real 2025 • Progreso en Tiempo Real</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`p-2 rounded-lg transition-colors ${
                    soundEnabled ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                  className="bg-gray-700 text-white px-3 py-2 rounded-lg text-sm"
                >
                  <option value={5000}>5s</option>
                  <option value={10000}>10s</option>
                  <option value={30000}>30s</option>
                  <option value={60000}>1m</option>
                </select>
                
                <button
                  onClick={() => setIsLive(!isLive)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isLive ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  {isLive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isLive ? 'Pausar' : 'Reanudar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas Principales */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-800 to-blue-900 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm font-medium">Progreso Total</p>
                  <p className="text-3xl font-bold text-white">
                    {stats.overall_completion_percentage.toFixed(1)}%
                  </p>
                </div>
                <Target className="w-10 h-10 text-blue-300" />
              </div>
              <div className="mt-4">
                <div className="w-full bg-blue-700 rounded-full h-2">
                  <div 
                    className="bg-blue-400 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${stats.overall_completion_percentage}%` }}
                  />
                </div>
                <p className="text-xs text-blue-200 mt-2">
                  {stats.verses_read.toLocaleString()} / {stats.total_verses.toLocaleString()} versículos
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-800 to-green-900 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-200 text-sm font-medium">Lectores Activos</p>
                  <p className="text-3xl font-bold text-white">{activeReaders.length}</p>
                </div>
                <Users className="w-10 h-10 text-green-300" />
              </div>
              <div className="mt-4">
                <div className="flex -space-x-2">
                  {activeReaders.slice(0, 4).map((reader, index) => (
                    <div
                      key={reader.id}
                      className="w-8 h-8 rounded-full border-2 border-green-400 flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: reader.avatar_color }}
                      title={reader.name}
                    >
                      {reader.name.charAt(0)}
                    </div>
                  ))}
                  {activeReaders.length > 4 && (
                    <div className="w-8 h-8 rounded-full bg-green-600 border-2 border-green-400 flex items-center justify-center text-xs font-bold text-white">
                      +{activeReaders.length - 4}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-800 to-purple-900 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-200 text-sm font-medium">Ritmo Actual</p>
                  <p className="text-3xl font-bold text-white">
                    {derivedStats?.pace.toFixed(0)} <span className="text-lg">v/h</span>
                  </p>
                </div>
                <TrendingUp className="w-10 h-10 text-purple-300" />
              </div>
              <div className="mt-4">
                <p className="text-xs text-purple-200">
                  Versículos por hora
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-800 to-orange-900 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-200 text-sm font-medium">Tiempo Estimado</p>
                  <p className="text-3xl font-bold text-white">
                    {derivedStats ? Math.floor(derivedStats.timeRemaining) : 0}h
                  </p>
                </div>
                <Clock className="w-10 h-10 text-orange-300" />
              </div>
              <div className="mt-4">
                <p className="text-xs text-orange-200">
                  Para completar el maratón
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Lectores Activos en Tiempo Real */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-gray-800 rounded-xl shadow-lg">
            <div className="p-6 border-b border-gray-700">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-500" />
                Actividad Reciente
              </h3>
              <p className="text-gray-400 text-sm mt-1">Última hora de lectura</p>
            </div>
            <div className="p-6">
              {activeReaders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                  <p>No hay lectores activos en este momento</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeReaders.map((reader) => (
                    <div key={reader.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                          style={{ backgroundColor: reader.avatar_color }}
                        >
                          {reader.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-white">{reader.name}</p>
                          <p className="text-sm text-gray-400">
                            {new Date(reader.last_activity).toLocaleTimeString('es-ES')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-400">
                          {reader.recent_verses_read} versículos
                        </p>
                        <p className="text-xs text-gray-500">última hora</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Progreso Visual */}
          <div className="bg-gray-800 rounded-xl shadow-lg">
            <div className="p-6 border-b border-gray-700">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-500" />
                Progreso Visual
              </h3>
              <p className="text-gray-400 text-sm mt-1">Avance general del maratón</p>
            </div>
            <div className="p-6">
              {stats && (
                <div className="space-y-6">
                  {/* Barra de progreso principal */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-300">Versículos Completados</span>
                      <span className="text-sm text-white font-medium">
                        {stats.overall_completion_percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-4">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-green-500 h-4 rounded-full transition-all duration-1000 flex items-center justify-end pr-2"
                        style={{ width: `${stats.overall_completion_percentage}%` }}
                      >
                        {stats.overall_completion_percentage > 10 && (
                          <span className="text-xs text-white font-bold">
                            {stats.overall_completion_percentage.toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Métricas adicionales */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-gray-700 rounded-lg">
                      <p className="text-2xl font-bold text-blue-400">
                        {stats.chapters_with_progress}
                      </p>
                      <p className="text-sm text-gray-400">Capítulos iniciados</p>
                    </div>
                    <div className="text-center p-4 bg-gray-700 rounded-lg">
                      <p className="text-2xl font-bold text-green-400">
                        {((stats.chapters_with_progress / stats.total_chapters) * 100).toFixed(0)}%
                      </p>
                      <p className="text-sm text-gray-400">Cobertura</p>
                    </div>
                  </div>

                  {/* Indicador de ritmo */}
                  <div className="p-4 bg-gradient-to-r from-purple-800 to-blue-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-semibold">Ritmo del Maratón</p>
                        <p className="text-purple-200 text-sm">
                          {derivedStats ? `${derivedStats.pace.toFixed(0)} versículos/hora` : 'Calculando...'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-white">
                          {derivedStats ? `${Math.floor(derivedStats.timeRemaining)}h` : '∞'}
                        </p>
                        <p className="text-purple-200 text-sm">restantes</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer con información adicional */}
        <div className="bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <Calendar className="w-8 h-8 mx-auto mb-2 text-blue-400" />
              <p className="text-white font-semibold">Maratón Bíblico 2025</p>
              <p className="text-gray-400 text-sm">Iglesia Linaje Real</p>
            </div>
            <div>
              <Award className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
              <p className="text-white font-semibold">72 Horas Continuas</p>
              <p className="text-gray-400 text-sm">Lectura ininterrumpida</p>
            </div>
            <div>
              <BookOpen className="w-8 h-8 mx-auto mb-2 text-green-400" />
              <p className="text-white font-semibold">66 Libros Bíblicos</p>
              <p className="text-gray-400 text-sm">Antiguo y Nuevo Testamento</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RealTimeMarathonProgress;