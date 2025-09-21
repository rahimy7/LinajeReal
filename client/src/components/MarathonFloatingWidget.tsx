import React, { useState, useEffect } from 'react';
import { Clock, BookOpen, FileText, MapPin, Users, X, Maximize2, Minimize2, TrendingUp, Play } from 'lucide-react';

// Componente de Widget Flotante del Maratón
const MarathonFloatingWidget = ({ 
  readingProgress = {}, 
  currentBook = 'genesis', 
  currentChapter = 1,
  position = 'bottom-right',
  theme = 'default',
  youtubeVideoId = 'dQw4w9WgXcQ'
}) => {
  const [widgetState, setWidgetState] = useState('minimized');
  const [timer, setTimer] = useState('');
  const [marathonStats, setMarathonStats] = useState({
    completedChapters: 0,
    completedVerses: 0,
    completedWords: 0,
    readingSpeed: 0,
    percentage: 0,
    activeReaders: []
  });

  // Posiciones predefinidas
  const positions = {
    'bottom-right': 'bottom-5 right-5',
    'bottom-left': 'bottom-5 left-5',
    'top-right': 'top-5 right-5',
    'top-left': 'top-5 left-5'
  };

  // Datos de la Biblia
  const bibleData = {
    genesis: { name: "Génesis", chapters: 50 },
    exodo: { name: "Éxodo", chapters: 40 },
    salmos: { name: "Salmos", chapters: 150 },
    mateo: { name: "Mateo", chapters: 28 },
    juan: { name: "Juan", chapters: 21 },
    apocalipsis: { name: "Apocalipsis", chapters: 22 }
  };

  // Timer del maratón
  useEffect(() => {
    const updateTimer = () => {
      const startTime = new Date('2024-01-01T00:00:00');
      const endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + 70);
      
      const now = new Date();
      const diff = endTime.getTime() - now.getTime();
      
      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        let timerText = '';
        if (days > 0) timerText += `${days}D `;
        timerText += `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        setTimer(timerText);
      } else {
        setTimer('COMPLETADO');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calcular estadísticas
  useEffect(() => {
    const allReadChapters = new Set();
    const activeReaders = new Set();
    
    for (const [reader, books] of Object.entries(readingProgress)) {
      let hasChapters = false;
      
      if (books && typeof books === 'object' && !Array.isArray(books)) {
        for (const [book, chapters] of Object.entries(books)) {
          if (Array.isArray(chapters) && chapters.length > 0) {
            hasChapters = true;
            chapters.forEach((chapter) => {
              allReadChapters.add(`${book}-${chapter}`);
            });
          }
        }
      }
      
      if (hasChapters) activeReaders.add(reader);
    }
    
    const totalChapters = 1189;
    const totalVerses = 31102;
    const totalWords = 783137;
    
    const completedChapters = allReadChapters.size;
    const percentage = (completedChapters / totalChapters) * 100;
    
    setMarathonStats({
      completedChapters,
      completedVerses: Math.floor(totalVerses * (percentage / 100)),
      completedWords: Math.floor(totalWords * (percentage / 100)),
      readingSpeed: Math.floor(Math.random() * 1000 + 500),
      percentage,
      activeReaders: Array.from(activeReaders)
    });
  }, [readingProgress]);

  // SVG del círculo de progreso
  const radius = widgetState === 'minimized' ? 28 : widgetState === 'compact' ? 35 : 65;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (marathonStats.percentage / 100) * circumference;

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
              {Math.floor(marathonStats.percentage)}%
            </span>
            <span className="text-[8px] text-gray-600 font-medium">
              Cap. {currentChapter}
            </span>
          </div>
          
          {marathonStats.activeReaders.length > 0 && (
            <div className="absolute -top-1 -right-1 bg-green-500 rounded-full w-3 h-3 animate-pulse" />
          )}
        </div>

        <div className="relative">
          <div className="absolute inset-0 w-16 h-12">
            <div className="absolute inset-0 bg-red-500 rounded-lg opacity-75 animate-ping"></div>
            <div className="absolute inset-0 bg-red-400 rounded-lg opacity-50 animate-ping" style={{ animationDelay: '0.3s', animationDuration: '1.5s' }}></div>
            <div className="absolute inset-0 bg-red-600 rounded-lg opacity-25 animate-ping" style={{ animationDelay: '0.6s', animationDuration: '2s' }}></div>
          </div>
          
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

  // Vista compacta
  const CompactView = () => (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl p-4 w-64 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1">
          <TrendingUp className="w-4 h-4 text-amber-600" />
          Maratón Bíblico
        </h3>
        <div className="flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setWidgetState('expanded');
            }}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Expandir"
          >
            <Maximize2 className="w-3 h-3 text-gray-600" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setWidgetState('minimized');
            }}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Minimizar"
          >
            <Minimize2 className="w-3 h-3 text-gray-600" />
          </button>
        </div>
      </div>
      
      <div className="flex items-center gap-4 mb-3">
        <div className="relative">
          <svg width="80" height="80">
            <circle cx="40" cy="40" r="35" fill="none" stroke="#e5e7eb" strokeWidth="8" />
            <circle
              cx="40" cy="40" r="35" fill="none" stroke="url(#compact-gradient)"
              strokeWidth="8" strokeLinecap="round" strokeDasharray={220}
              strokeDashoffset={220 - (marathonStats.percentage / 100) * 220}
              transform="rotate(-90 40 40)" className="transition-all duration-1000"
            />
            <defs>
              <linearGradient id="compact-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-gray-800">
              {Math.floor(marathonStats.percentage)}%
            </span>
          </div>
        </div>
        
        <div className="flex-1 space-y-1">
          <div className="text-xs text-gray-600">
            <span className="font-semibold">{marathonStats.completedChapters}</span>/1189 cap.
          </div>
          <div className="text-xs text-gray-600">
            {timer}
          </div>
          <div className="text-xs font-medium text-amber-700">
            {bibleData[currentBook]?.name || 'Génesis'} {currentChapter}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Users className="w-3 h-3 text-gray-500" />
        <div className="flex -space-x-2">
          {marathonStats.activeReaders.slice(0, 5).map((reader, i) => (
            <div
              key={reader}
              className="w-6 h-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 border-2 border-white flex items-center justify-center text-white text-[10px] font-bold"
              title={reader}
            >
              {reader.charAt(0).toUpperCase()}
            </div>
          ))}
          {marathonStats.activeReaders.length > 5 && (
            <div className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-gray-700 text-[10px] font-bold">
              +{marathonStats.activeReaders.length - 5}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Vista expandida
  const ExpandedView = () => (
    <div className="bg-gradient-to-br from-stone-100 to-stone-200 rounded-2xl shadow-2xl p-6 w-80 border border-stone-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-amber-800 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Maratón de Lectura Bíblica
        </h3>
        <div className="flex gap-1">
          <button
            onClick={() => setWidgetState('compact')}
            className="p-1.5 hover:bg-white/50 rounded transition-colors"
            title="Vista compacta"
          >
            <Minimize2 className="w-4 h-4 text-gray-600" />
          </button>
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
          Tiempo restante
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
              {Math.floor(marathonStats.percentage)}%
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
          <span className="text-blue-700 font-bold">12/66</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
          <span className="flex items-center gap-2 text-sm text-stone-600">
            <FileText className="w-4 h-4" /> Capítulos Completados
          </span>
          <span className="text-green-700 font-bold">
            {marathonStats.completedChapters}/1189
          </span>
        </div>
      </div>

      <div className="p-3 bg-white/80 rounded-lg border-l-4 border-amber-600 mb-3">
        <div className="text-xs font-bold text-amber-800 mb-1 flex items-center gap-1">
          <MapPin className="w-3 h-3" /> Estado Actual
        </div>
        <div className="text-xs text-stone-600">
          Escribiendo {bibleData[currentBook]?.name || 'Génesis'}, Capítulo {currentChapter}
        </div>
      </div>

      <div className="p-3 bg-white/50 rounded-lg">
        <div className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
          <Users className="w-3 h-3" /> Participantes Activos ({marathonStats.activeReaders.length})
        </div>
        <div className="flex flex-wrap gap-1">
          {marathonStats.activeReaders.map(reader => (
            <span 
              key={reader}
              className="px-2 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full text-[10px] font-medium capitalize"
            >
              {reader}
            </span>
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
            {marathonStats.activeReaders.length} participantes
          </div>
        </div>
        
        <div className="mt-2 text-xs text-gray-400">
          Leyendo: {bibleData[currentBook]?.name || 'Génesis'}, Capítulo {currentChapter}
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

// Componente principal - Solo el widget flotante
export default function App() {
  const mockReadingProgress = {
    juan: { genesis: [1, 2, 3, 5, 10], mateo: [1, 3, 5] },
    maria: { salmos: [1, 23, 51], juan: [1, 2, 3] },
    pedro: { exodo: [1, 2, 3], marcos: [1] }
  };

  return (
    <MarathonFloatingWidget
      readingProgress={mockReadingProgress}
      currentBook="genesis"
      currentChapter={15}
      position="bottom-right"
      theme="default"
      youtubeVideoId="HyoKx3hDnKQ"
    />
  );
}