import React, { useState, useEffect } from 'react';
import { 
  Activity, Users, BookOpen, TrendingUp, Clock, 
  Wifi, WifiOff, RefreshCw, Maximize2, Volume2, VolumeX
} from 'lucide-react';

interface LiveStats {
  total_readers: number;
  active_readers: number;
  total_verses_read: number;
  completion_percentage: number;
  verses_remaining: number;
}

const API_BASE = process.env.NODE_ENV === 'production' 
  ? '/api/bible' 
  : 'http://localhost:5000/api/bible';

const RealTimeMarathonProgress: React.FC = () => {
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE}/stats`);
      
      if (response.ok) {
        const data = await response.json();
        
        setStats({
          total_readers: data.data.general.total_readers || 0,
          active_readers: data.data.general.active_readers || 0,
          total_verses_read: data.data.general.total_verses_read || 0,
          completion_percentage: data.data.general.completion_percentage || 0,
          verses_remaining: data.data.general.verses_remaining || 31102,
        });
        
        setIsConnected(true);
        setLastUpdate(new Date());
      } else {
        throw new Error('Error al cargar datos');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isAutoRefresh) {
      interval = setInterval(loadStats, 10000); // Actualizar cada 10 segundos
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAutoRefresh]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center text-white">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p className="text-xl">Conectando con el maratón...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white">
      {/* Header Controls */}
      <div className="p-4 flex items-center justify-between bg-black/20 backdrop-blur-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <Wifi className="w-5 h-5 text-green-400" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-400" />
            )}
            <span className={`text-sm ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
          
          {lastUpdate && (
            <div className="text-sm text-gray-300">
              Actualizado: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            className={`px-3 py-2 rounded-lg transition-colors ${
              isAutoRefresh ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'
            }`}
          >
            {isAutoRefresh ? 'Auto ON' : 'Auto OFF'}
          </button>
          
          <button
            onClick={loadStats}
            className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            title="Actualizar ahora"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            title="Pantalla completa"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-4 mb-4 bg-red-600/20 border border-red-500/50 rounded-lg p-4 flex items-center gap-3">
          <WifiOff className="w-5 h-5 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      <div className="p-6 space-y-8">
        {/* Main Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            Maratón Bíblico 2025
          </h1>
          <p className="text-xl md:text-2xl text-blue-200">Linaje Real - Progreso en Tiempo Real</p>
        </div>

        {/* Main Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-8 h-8 text-blue-400" />
                <div className="text-right">
                  <div className="text-2xl md:text-3xl font-bold">{stats.active_readers}</div>
                  <div className="text-sm text-blue-200">de {stats.total_readers} lectores</div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-blue-100">Lectores Activos</h3>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <BookOpen className="w-8 h-8 text-green-400" />
                <div className="text-right">
                  <div className="text-2xl md:text-3xl font-bold">{stats.total_verses_read.toLocaleString()}</div>
                  <div className="text-sm text-green-200">versículos leídos</div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-green-100">Progreso Total</h3>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="w-8 h-8 text-purple-400" />
                <div className="text-right">
                  <div className="text-2xl md:text-3xl font-bold">{Math.round(stats.completion_percentage)}%</div>
                  <div className="text-sm text-purple-200">completado</div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-purple-100">Avance General</h3>
              <div className="mt-3 w-full bg-gray-200/20 rounded-full h-3">
                <div 
                  className="bg-purple-600 h-3 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${stats.completion_percentage}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <Clock className="w-8 h-8 text-orange-400" />
                <div className="text-right">
                  <div className="text-2xl md:text-3xl font-bold">
                    {stats.verses_remaining.toLocaleString()}
                  </div>
                  <div className="text-sm text-orange-200">versículos restantes</div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-orange-100">Por Leer</h3>
            </div>
          </div>
        )}

        {/* Progress Bar Global */}
        {stats && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Progreso General del Maratón</h2>
              <p className="text-blue-200">
                {stats.total_verses_read.toLocaleString()} de 31,102 versículos completados
              </p>
            </div>
            
            <div className="relative">
              <div className="w-full bg-white/20 rounded-full h-6">
                <div 
                  className="bg-gradient-to-r from-green-500 to-blue-500 h-6 rounded-full transition-all duration-2000 ease-out relative overflow-hidden"
                  style={{ width: `${Math.min(stats.completion_percentage, 100)}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-white drop-shadow-lg">
                  {Math.round(stats.completion_percentage)}% Completado
                </span>
              </div>
            </div>
            
            <div className="mt-4 flex justify-between text-sm text-gray-300">
              <span>Inicio</span>
              <span>Meta: 100%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RealTimeMarathonProgress;