import React, { useState, useEffect } from 'react';
import { Clock, BookOpen, FileText, MapPin, Users, X, Maximize2, Minimize2, TrendingUp, Play } from 'lucide-react';

const API_BASE = process.env.NODE_ENV === 'production' 
  ? '/api/bible' 
  : 'http://localhost:5000/api/bible';

interface RealStats {
  general: {
    total_readers: number;
    active_readers: number;
    total_chapters_read: number;
    completion_percentage: number;
  };
  readers: Array<{
    id: number;
    name: string;
    total_chapters_read: number;
    percentage_completed: number;
    is_active: boolean;
  }>;
}

// Componente de Widget Flotante del Maratón
const MarathonFloatingWidget = ({ 
  position = 'bottom-right',
  youtubeVideoId = 'HyoKx3hDnKQ'
}) => {
  const [widgetState, setWidgetState] = useState('minimized');
  const [timer, setTimer] = useState('');
  const [realStats, setRealStats] = useState<RealStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Posiciones predefinidas
  const positions = {
    'bottom-right': 'bottom-5 right-5',
    'bottom-left': 'bottom-5 left-5',
    'top-right': 'top-5 right-5',
    'top-left': 'top-5 left-5'
  };

  // Cargar datos reales
  const loadRealData = async () => {
    try {
      const response = await fetch(`${API_BASE}/stats`);
      if (response.ok) {
        const data = await response.json();
        setRealStats(data.data);
      }
    } catch (error) {
      console.error('Error loading real stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRealData();
    const interval = setInterval(loadRealData, 30000); // Actualizar cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  // Timer del maratón - mostrar tiempo transcurrido
  useEffect(() => {
    const updateTimer = () => {
      const startTime = new Date('2025-01-20T00:00:00');
      const now = new Date();
      const elapsed = now.getTime() - startTime.getTime();
      
      if (elapsed > 0) {
        const days = Math.floor(elapsed / (1000 * 60 * 60 * 24));
        const hours = Math.floor((elapsed % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((elapsed % (1000 * 60)) / 1000);
        
        let timerText = '';
        if (days > 0) timerText += `${days}D `;
        timerText += `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        setTimer(timerText);
      } else {
        setTimer('00:00:00');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className={`fixed z-50 ${positions[position]}`}>
        <div className="bg-blue-600 rounded-full p-3 shadow-lg">
          <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  const completionPercentage = realStats?.general.completion_percentage || 0;
  const totalChaptersRead = realStats?.general.total_chapters_read || 0;
  const activeReaders = realStats?.readers?.filter(r => r.is_active) || [];
  const totalReaders = realStats?.general.total_readers || 0;

  // SVG del círculo de progreso
  const radius = widgetState === 'minimized' ? 28 : widgetState === 'compact' ? 35 : 65;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionPercentage / 100) * circumference;

  // Widget minimizado
  const MinimizedView = () => {
    const handleCircleClick = (e) => {
      e.stopPropagation();
      setWidgetState('compact');
    };

    const handleVideoClick = (e) => {
      e.stopPropagation();
      setWidgetState('video');
    };

    return (
      <div className="flex flex-col items-center gap-2">
        <div 
          className="relative bg-white rounded-full shadow-2xl p-2 cursor-pointer transform transition-all duration-300 hover:scale-110"
          onClick={handleCircleClick}
        >
          <svg width="72" height="72" className="transform -rotate-90">
            <circle cx="36" cy="36" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="6" />
            <circle
              cx="36" cy="36" r={radius} fill="none" stroke="url(#mini-gradient)"
              strokeWidth="6" strokeLinecap="round" strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset} className="transition-all duration-1000"
            />
            <defs>
              <linearGradient id="mini-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>
            </defs>
          </svg>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-lg font-bold text-gray-800">
              {Math.floor(completionPercentage)}%
            </span>
            <span className="text-[7px] text-gray-600 font-medium leading-none">
              {totalChaptersRead} cap
            </span>
          </div>
        </div>
        
        <button
          className="relative bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg transition-colors flex items-center gap-1 overflow-hidden"
          onClick={handleVideoClick}
        >
          {/* Miniatura de video de fondo */}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-600 opacity-80"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCA0MCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMzc0MTUxIi8+CjxyZWN0IHg9IjQiIHk9IjQiIHdpZHRoPSIzMiIgaGVpZ2h0PSIxMiIgcng9IjIiIGZpbGw9IiM2Mzc0OEIiLz4KPGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iMiIgZmlsbD0iI0Y1OUUwQiIvPgo8Y2lyY2xlIGN4PSIxOCIgY3k9IjEwIiByPSIyIiBmaWxsPSIjREM5MzI2Ii8+CjxjaXJjbGUgY3g9IjI2IiBjeT0iMTAiIHI9IjIiIGZpbGw9IiNFRjQ0NDQiLz4KPC9zdmc+Cg==')] opacity-30"></div>
          
          {/* Efectos de ondas */}
          <div className="absolute -inset-1 bg-red-500 rounded-full animate-ping opacity-20"></div>
          <div className="absolute -inset-0.5 bg-red-400 rounded-full animate-pulse opacity-30"></div>
          
          {/* Contenido */}
          <div className="relative flex items-center gap-1 z-10">
            <div className="relative">
              <Play className="w-3 h-3" />
              <div className="absolute -inset-1 bg-white rounded-full animate-ping opacity-40"></div>
            </div>
            <span className="font-bold">EN VIVO</span>
          </div>
        </button>
      </div>
    );
  };

  // Vista compacta
  const CompactView = () => (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-2xl p-4 w-72 border border-amber-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-amber-900 flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          Maratón Bíblico 2025
        </h3>
        <div className="flex gap-1">
          <button
            onClick={() => setWidgetState('expanded')}
            className="p-1.5 hover:bg-amber-100 rounded transition-colors"
            title="Ver más"
          >
            <Maximize2 className="w-3 h-3 text-amber-700" />
          </button>
          <button
            onClick={() => setWidgetState('minimized')}
            className="p-1.5 hover:bg-amber-100 rounded transition-colors"
            title="Minimizar"
          >
            <X className="w-3 h-3 text-amber-700" />
          </button>
        </div>
      </div>

      <div className="text-center p-3 bg-white/60 rounded-xl mb-4">
        <div className="text-xs text-gray-600 mb-1 flex items-center justify-center gap-1">
          <Clock className="w-3 h-3" />
          Tiempo transcurrido
        </div>
        <div className="text-lg font-bold text-amber-700 font-mono">{timer}</div>
      </div>

      <div className="flex justify-center mb-4">
        <div className="relative">
          <svg width="100" height="100">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="8" />
            <circle
              cx="50" cy="50" r={radius} fill="none" stroke="url(#compact-gradient)"
              strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset} transform="rotate(-90 50 50)"
              className="transition-all duration-1000"
            />
            <defs>
              <linearGradient id="compact-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>
            </defs>
          </svg>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-amber-800">
              {Math.floor(completionPercentage)}%
            </span>
            <span className="text-xs text-gray-600">completado</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between p-2 bg-white/50 rounded-lg">
          <span className="text-xs text-gray-600 flex items-center gap-1">
            <FileText className="w-3 h-3" /> Capítulos
          </span>
          <span className="text-xs font-bold text-gray-800">
            {totalChaptersRead}/1,189
          </span>
        </div>
        
        <div className="flex items-center justify-between p-2 bg-white/50 rounded-lg">
          <span className="text-xs text-gray-600 flex items-center gap-1">
            <Users className="w-3 h-3" /> Lectores
          </span>
          <span className="text-xs font-bold text-gray-800">
            {activeReaders.length}/{totalReaders}
          </span>
        </div>
      </div>
    </div>
  );

  // Vista expandida
  const ExpandedView = () => (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-2xl p-6 w-80 border border-amber-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-amber-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Maratón Bíblico
        </h3>
        <div className="flex gap-1">
          <button
            onClick={() => setWidgetState('compact')}
            className="p-2 hover:bg-amber-100 rounded transition-colors"
            title="Vista compacta"
          >
            <Minimize2 className="w-4 h-4 text-amber-700" />
          </button>
          <button
            onClick={() => setWidgetState('minimized')}
            className="p-2 hover:bg-amber-100 rounded transition-colors"
            title="Minimizar"
          >
            <X className="w-4 h-4 text-amber-700" />
          </button>
        </div>
      </div>

      <div className="text-center p-3 bg-white/60 rounded-xl mb-4">
        <div className="text-xs text-gray-600 mb-1 flex items-center justify-center gap-1">
          <Clock className="w-3 h-3" />
          Tiempo transcurrido
        </div>
        <div className="text-2xl font-bold text-amber-700 font-mono">{timer}</div>
      </div>

      <div className="flex justify-center mb-4">
        <div className="relative">
          <svg width="150" height="150">
            <circle cx="75" cy="75" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="12" />
            <circle
              cx="75" cy="75" r={radius} fill="none" stroke="url(#full-gradient)"
              strokeWidth="12" strokeLinecap="round" strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset} transform="rotate(-90 75 75)"
              className="transition-all duration-1000"
            />
            <defs>
              <linearGradient id="full-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>
            </defs>
          </svg>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-amber-800">
              {Math.floor(completionPercentage)}%
            </span>
            <span className="text-sm text-gray-600">completado</span>
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
          <span className="flex items-center gap-2 text-sm text-gray-600">
            <FileText className="w-4 h-4" /> Capítulos Completados
          </span>
          <span className="text-green-700 font-bold">
            {totalChaptersRead}/1,189
          </span>
        </div>

        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <span className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4" /> Lectores Activos
          </span>
          <span className="text-blue-700 font-bold">
            {activeReaders.length}/{totalReaders}
          </span>
        </div>
      </div>

      <div className="p-3 bg-white/50 rounded-lg">
        <div className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
          <Users className="w-3 h-3" /> Top Lectores
        </div>
        <div className="space-y-1">
          {activeReaders
            .sort((a, b) => (b.total_chapters_read || 0) - (a.total_chapters_read || 0))
            .slice(0, 3)
            .map((reader, index) => (
              <div key={reader.id} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                  }`}>
                    {index + 1}
                  </span>
                  {reader.name}
                </span>
                <span className="font-medium">{reader.total_chapters_read || 0} cap.</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );

  // Vista de video
  const VideoView = () => (
    <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-2xl overflow-hidden w-96 border border-gray-700">
      <div className="flex items-center justify-between p-4 bg-black bg-opacity-50">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Play className="w-4 h-4 text-red-500" />
          Maratón en Vivo
        </h3>
        <div className="flex gap-1">
          <button
            onClick={() => setWidgetState('compact')}
            className="p-1.5 hover:bg-white/20 rounded transition-colors"
            title="Vista compacta"
          >
            <Minimize2 className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={() => setWidgetState('minimized')}
            className="p-1.5 hover:bg-white/20 rounded transition-colors"
            title="Minimizar"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      <div className="relative aspect-video">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&mute=1`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>

      <div className="p-4 bg-gradient-to-r from-gray-800 to-gray-900">
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-300">
            <span className="text-red-500 font-bold">● LIVE</span> Maratón Bíblico
          </div>
          <div className="text-gray-400">
            {activeReaders.length} participantes activos
          </div>
        </div>
        
        <div className="mt-2 text-xs text-gray-400">
          Progreso: {Math.floor(completionPercentage)}% completado - {totalChaptersRead}/1,189 capítulos
        </div>
      </div>
    </div>
  );

  return (
    <div className={`fixed z-50 transition-all duration-300 ${positions[position]}`}>
      {widgetState === 'minimized' && <MinimizedView />}
      {widgetState === 'compact' && <CompactView />}
      {widgetState === 'expanded' && <ExpandedView />}
      {widgetState === 'video' && <VideoView />}
    </div>
  );
};

export default MarathonFloatingWidget;