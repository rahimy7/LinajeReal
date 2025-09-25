import React, { useState, useEffect, useMemo } from 'react';
import { Clock, BookOpen, FileText, MapPin, Users, X, Maximize2, Minimize2, TrendingUp, Play } from 'lucide-react';

// Configuración de la API
const API_BASE = process.env.NODE_ENV === 'production' 
  ? '/api/bible' 
  : 'http://localhost:5000/api/bible';

// Interfaces
interface RealStats {
  general: {
    total_books: number;
    total_readers: number;
    active_readers: number;
    total_chapters_read: number;
    completion_percentage: number;
  };
  readers: Array<{
    id: number;
    name: string;
    total_chapters_read: number;
    is_active: boolean;
  }>;
  books: Array<{
    id: number;
    key: string;
    name: string;
    completion_percentage: number;
    chapters_completed: number;
  }>;
  marathon: {
    start_time: string;
    is_active: boolean;
  };
}

// Componente de Widget Flotante del Maratón
const MarathonFloatingWidget = ({ 
  position = 'bottom-right',
  youtubeVideoId = 'dQw4w9WgXcQ'
}) => {
  const [widgetState, setWidgetState] = useState('minimized');
  const [timer, setTimer] = useState('');
  const [realStats, setRealStats] = useState<RealStats | null>(null);
  const [loading, setLoading] = useState(true);
   const memoizedIframe = useMemo(() => (
    <iframe
      src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&mute=1`}
      title="YouTube video player"
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      className="w-full h-full relative z-10"
    />
  ), [youtubeVideoId]);

  // Posiciones predefinidas
  const positions = {
    'bottom-right': 'bottom-5 right-5',
    'bottom-left': 'bottom-5 left-5',
    'top-right': 'top-5 right-5',
    'top-left': 'top-5 left-5'
  };

  // Cargar datos reales desde la base de datos
  const loadRealData = async () => {
    try {
      const response = await fetch(`${API_BASE}/stats?t=${Date.now()}`);
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setRealStats(data.data);
        }
      }
    } catch (error) {
      console.error('Error loading real stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (widgetState === 'video') return;
    loadRealData();
    // Solo actualizar datos si NO está en modo video
    const interval = setInterval(() => {
      if (widgetState !== 'video') {
        loadRealData();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [widgetState]);

  // Timer del maratón - NO depende de realStats para evitar reiniciar
  useEffect(() => {
    if (!realStats?.marathon?.start_time) return;

    const startTime = new Date(realStats.marathon.start_time);
    
    const updateTimer = () => {
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
  }, [realStats?.marathon?.start_time]); // Solo depende del start_time, no de todo realStats

  if (loading) {
    return (
      <div className={`fixed z-50 ${positions[position]}`}>
        <div className="bg-blue-600 rounded-full p-3 shadow-lg">
          <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  const completionPercentage = realStats?.general?.completion_percentage || 0;
  const totalChaptersRead = realStats?.general?.total_chapters_read || 0;
  const activeReaders = realStats?.readers?.filter(r => r.is_active) || [];
  const totalReaders = realStats?.general?.total_readers || 0;
  const booksCompleted = realStats?.books?.filter(b => b.completion_percentage >= 100).length || 0;
  const totalBooks = realStats?.general?.total_books || 66;

  // SVG del círculo de progreso
  const radius = widgetState === 'minimized' ? 28 : 65;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionPercentage / 100) * circumference;

  // Widget minimizado
  const MinimizedView = () => {
    const handleCircleClick = (e) => {
      e.stopPropagation();
      setWidgetState('expanded'); // Saltar directamente a expandido
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
            <span className="text-[8px] text-gray-600 font-medium">
              Cap. {totalChaptersRead}
            </span>
          </div>
          
          {activeReaders.length > 0 && (
            <div className="absolute -top-1 -right-1 bg-green-500 rounded-full w-3 h-3 animate-pulse" />
          )}
        </div>

        <div className="relative">
          <div 
            className="relative w-16 h-12 bg-black rounded-lg overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 shadow-lg z-10"
            onClick={handleVideoClick}
          >
            <img 
              src={`https://img.youtube.com/vi/${youtubeVideoId}/mqdefault.jpg`}
              alt="Video thumbnail"
              className="w-full h-full object-cover"
            />
            
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
              <Play className="w-4 h-4 text-white fill-white" />
            </div>
            
            <div className="absolute bottom-1 left-1 right-1 bg-red-500 bg-opacity-90 rounded text-white text-[8px] font-bold text-center py-0.5">
              LIVE
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Vista expandida (sin vista compacta intermedia)
  const ExpandedView = () => (
    <div className="bg-gradient-to-br from-stone-100 to-stone-200 rounded-2xl shadow-2xl p-6 w-80 border border-stone-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-amber-800 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Maratón de Lectura Bíblica
        </h3>
        <div className="flex gap-1">
          <button
            onClick={() => setWidgetState('minimized')}
            className="p-1.5 hover:bg-white/50 rounded transition-colors"
            title="Minimizar"
          >
            <X className="w-4 h-4 text-gray-600" />
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
                <stop offset="0%" stopColor="#c8852c" />
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
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <span className="flex items-center gap-2 text-sm text-stone-600">
            <BookOpen className="w-4 h-4" /> Libros Completados
          </span>
          <span className="text-blue-700 font-bold">{booksCompleted}/{totalBooks}</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
          <span className="flex items-center gap-2 text-sm text-stone-600">
            <FileText className="w-4 h-4" /> Capítulos Completados
          </span>
          <span className="text-green-700 font-bold">
            {totalChaptersRead}/1189
          </span>
        </div>
      </div>

      <div className="p-3 bg-white/50 rounded-lg">
        <div className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
          <Users className="w-3 h-3" /> Participantes Activos ({activeReaders.length})
        </div>
        <div className="flex flex-wrap gap-1">
          {activeReaders
            .sort((a, b) => (b.total_chapters_read || 0) - (a.total_chapters_read || 0))
            .slice(0, 8)
            .map(reader => (
            <span 
              key={reader.id}
              className="px-2 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full text-[10px] font-medium capitalize"
              title={`${reader.name}: ${reader.total_chapters_read} capítulos`}
            >
              {reader.name}
            </span>
          ))}
          {activeReaders.length > 8 && (
            <span className="px-2 py-1 bg-gray-400 text-white rounded-full text-[10px] font-medium">
              +{activeReaders.length - 8}
            </span>
          )}
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
            onClick={() => setWidgetState('minimized')}
            className="p-1.5 hover:bg-white/20 rounded transition-colors"
            title="Minimizar"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      <div className="relative aspect-video bg-gray-800">
        {/* Simulación de video mientras carga */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-sm">Cargando transmisión...</div>
        </div>
       {memoizedIframe}
      </div>

      <div className="p-4 bg-gradient-to-r from-gray-800 to-gray-900">
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-300">
            <span className="text-red-500 font-bold">● LIVE</span> Maratón Bíblico
          </div>
          <div className="text-gray-400">
            {activeReaders.length} participantes
          </div>
        </div>
        
        <div className="mt-2 text-xs text-gray-400">
          Progreso: {Math.floor(completionPercentage)}% - {totalChaptersRead}/1,189 capítulos
        </div>
      </div>
    </div>
  );

  return (
    <div className={`fixed z-50 transition-all duration-300 ${positions[position]}`}>
      {widgetState === 'minimized' && <MinimizedView />}
      {widgetState === 'expanded' && <ExpandedView />}
      {widgetState === 'video' && <VideoView />}
    </div>
  );
};

// Componente principal - Solo el widget flotante
export default function App() {
  return (
    <MarathonFloatingWidget
      position="bottom-right"
      youtubeVideoId="HyoKx3hDnKQ"
    />
  );
}