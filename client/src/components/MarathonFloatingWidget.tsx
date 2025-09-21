import React, { useState, useEffect } from 'react';
import { Clock, BookOpen, FileText, Type, Zap, MapPin, Users, X, Maximize2, Minimize2, TrendingUp } from 'lucide-react';

// Componente de Widget Flotante del Maratón
const MarathonFloatingWidget = ({ 
  readingProgress = {}, 
  currentBook = 'genesis', 
  currentChapter = 1,
  position = 'bottom-right', // 'bottom-right', 'bottom-left', 'top-right', 'top-left'
  theme = 'default' // 'default', 'dark', 'minimal'
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [timer, setTimer] = useState('');
  const [marathonStats, setMarathonStats] = useState({
    completedChapters: 0,
    completedVerses: 0,
    completedWords: 0,
    readingSpeed: 0,
    percentage: 0,
    activeReaders: []
  });
  const [isDragging, setIsDragging] = useState(false);
  const [widgetPosition, setWidgetPosition] = useState({ x: null, y: null });

  // Posiciones predefinidas
  const positions = {
    'bottom-right': 'bottom-5 right-5',
    'bottom-left': 'bottom-5 left-5',
    'top-right': 'top-5 right-5',
    'top-left': 'top-5 left-5'
  };

  // Datos de la Biblia (simplificado para el ejemplo)
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
      const diff = endTime - now;
      
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
      for (const [book, chapters] of Object.entries(books)) {
        if (chapters && chapters.length > 0) {
          hasChapters = true;
          chapters.forEach(chapter => {
            allReadChapters.add(`${book}-${chapter}`);
          });
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
  const radius = isMinimized ? 28 : 65;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (marathonStats.percentage / 100) * circumference;

  // Manejar arrastre del widget (solo en vista compacta)
  const handleDragStart = (e) => {
    e.preventDefault();
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    const handleMouseMove = (e) => {
      setWidgetPosition({
        x: e.clientX - offsetX,
        y: e.clientY - offsetY
      });
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const positionStyle = widgetPosition.x !== null && widgetPosition.y !== null
    ? { left: `${widgetPosition.x}px`, top: `${widgetPosition.y}px`, right: 'auto', bottom: 'auto' }
    : {};

  // Widget minimizado (solo círculo y capítulo)
  const MinimizedView = () => {
    const handleClick = (e) => {
      e.stopPropagation();
      setIsMinimized(false);
    };

    return (
      <div 
        className={`
          relative bg-white rounded-full shadow-2xl p-2 cursor-pointer
          transform transition-all duration-300 hover:scale-110
        `}
        onClick={handleClick}
      >
        {/* Anillo pulsante de atención */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 opacity-20 animate-ping" />
        
        {/* Círculo de progreso */}
        <svg width="72" height="72" className="transform -rotate-90">
          <circle
            cx="36"
            cy="36"
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="6"
          />
          <circle
            cx="36"
            cy="36"
            r={radius}
            fill="none"
            stroke="url(#mini-gradient)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000"
          />
          <defs>
            <linearGradient id="mini-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Porcentaje en el centro */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-lg font-bold text-gray-800">
            {Math.floor(marathonStats.percentage)}%
          </span>
          <span className="text-[8px] text-gray-600 font-medium">
            Cap. {currentChapter}
          </span>
        </div>
        
        {/* Badge de notificación */}
        {marathonStats.activeReaders.length > 0 && (
          <div className="absolute -top-1 -right-1 bg-green-500 rounded-full w-3 h-3 animate-pulse" />
        )}
      </div>
    );
  };

  // Vista compacta (información resumida)
  const CompactView = () => (
    <div 
      className={`bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl p-4 w-64 border border-gray-200 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      onMouseDown={handleDragStart}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pointer-events-none">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1">
          <TrendingUp className="w-4 h-4 text-amber-600" />
          Maratón Bíblico
        </h3>
        <div className="flex gap-1 pointer-events-auto">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(true);
            }}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <Maximize2 className="w-3 h-3 text-gray-600" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(true);
            }}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <Minimize2 className="w-3 h-3 text-gray-600" />
          </button>
        </div>
      </div>
      
      {/* Círculo de progreso mediano */}
      <div className="flex items-center gap-4 mb-3 pointer-events-none">
        <div className="relative">
          <svg width="80" height="80">
            <circle
              cx="40"
              cy="40"
              r="35"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="8"
            />
            <circle
              cx="40"
              cy="40"
              r="35"
              fill="none"
              stroke="url(#compact-gradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={220}
              strokeDashoffset={220 - (marathonStats.percentage / 100) * 220}
              transform="rotate(-90 40 40)"
              className="transition-all duration-1000"
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
      
      {/* Barra de lectores activos */}
      <div className="flex items-center gap-2 pointer-events-none">
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

  // Vista expandida completa
  const ExpandedView = () => (
    <div className="bg-gradient-to-br from-stone-100 to-stone-200 rounded-2xl shadow-2xl p-6 w-80 border border-stone-300">
      {/* Header con controles */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-amber-800 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Maratón de Lectura Bíblica
        </h3>
        <div className="flex gap-1">
          <button
            onClick={() => setIsExpanded(false)}
            className="p-1.5 hover:bg-white/50 rounded transition-colors"
          >
            <Minimize2 className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 hover:bg-white/50 rounded transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Timer */}
      <div className="text-center p-3 bg-white/60 rounded-xl mb-4">
        <div className="text-xs text-gray-600 mb-1 flex items-center justify-center gap-1">
          <Clock className="w-3 h-3" />
          Tiempo restante
        </div>
        <div className="text-2xl font-bold text-amber-700 font-mono">{timer}</div>
      </div>

      {/* Círculo de progreso grande */}
      <div className="flex justify-center mb-4">
        <div className="relative">
          <svg width="150" height="150">
            <circle
              cx="75"
              cy="75"
              r={radius}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="12"
            />
            <circle
              cx="75"
              cy="75"
              r={radius}
              fill="none"
              stroke="url(#full-gradient)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 75 75)"
              className="transition-all duration-1000"
            />
            <defs>
              <linearGradient id="full-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#c8852c" />
                <stop offset="100%" stopColor="#a06b20" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold text-amber-800">
              {Math.floor(marathonStats.percentage)}%
            </span>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between p-2 bg-white/70 rounded-lg hover:bg-white/90 transition-colors">
          <span className="flex items-center gap-2 text-sm text-stone-600">
            <BookOpen className="w-4 h-4" /> Capítulos
          </span>
          <span className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-3 py-1 rounded-full text-xs font-bold">
            {marathonStats.completedChapters}/1189
          </span>
        </div>
        <div className="flex items-center justify-between p-2 bg-white/70 rounded-lg hover:bg-white/90 transition-colors">
          <span className="flex items-center gap-2 text-sm text-stone-600">
            <FileText className="w-4 h-4" /> Versículos
          </span>
          <span className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-3 py-1 rounded-full text-xs font-bold">
            {marathonStats.completedVerses}/31102
          </span>
        </div>
        <div className="flex items-center justify-between p-2 bg-white/70 rounded-lg hover:bg-white/90 transition-colors">
          <span className="flex items-center gap-2 text-sm text-stone-600">
            <Type className="w-4 h-4" /> Palabras
          </span>
          <span className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-3 py-1 rounded-full text-xs font-bold">
            {marathonStats.completedWords}/783137
          </span>
        </div>
        <div className="flex items-center justify-between p-2 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
          <span className="flex items-center gap-2 text-sm text-stone-600">
            <Zap className="w-4 h-4" /> Velocidad
          </span>
          <span className="text-amber-700 font-bold text-sm">
            {marathonStats.readingSpeed} p/hora
          </span>
        </div>
      </div>

      {/* Estado actual */}
      <div className="p-3 bg-white/80 rounded-lg border-l-4 border-amber-600 mb-3">
        <div className="text-xs font-bold text-amber-800 mb-1 flex items-center gap-1">
          <MapPin className="w-3 h-3" /> Estado Actual
        </div>
        <div className="text-xs text-stone-600">
          Escribiendo {bibleData[currentBook]?.name || 'Génesis'}, Capítulo {currentChapter}
        </div>
      </div>

      {/* Participantes activos */}
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

  return (
    <div 
      className={`fixed z-50 transition-all duration-300 ${widgetPosition.x === null ? positions[position] : ''}`}
      style={positionStyle}
    >
      {isMinimized ? (
        <MinimizedView />
      ) : isExpanded ? (
        <ExpandedView />
      ) : (
        <CompactView />
      )}
    </div>
  );
};

// Ejemplo de uso del widget
export default function App() {
  // Datos de ejemplo
  const mockReadingProgress = {
    juan: { genesis: [1, 2, 3, 5, 10], mateo: [1, 3, 5] },
    maria: { salmos: [1, 23, 51], juan: [1, 2, 3] },
    pedro: { exodo: [1, 2, 3], marcos: [1] }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Página Principal</h1>
        <p className="text-gray-600 mb-8">
          Esta es tu página principal. El widget del maratón está flotando en la esquina.
        </p>
        
        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <h2 className="text-xl font-semibold mb-3">Contenido de ejemplo</h2>
          <p className="text-gray-600">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-3">Configuración del Widget</h2>
          <p className="text-gray-600 mb-4">
            El widget del maratón tiene tres estados:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li><strong>Minimizado:</strong> Solo muestra el círculo de progreso y capítulo actual</li>
            <li><strong>Compacto:</strong> Vista resumida con información esencial</li>
            <li><strong>Expandido:</strong> Vista completa con todas las estadísticas</li>
          </ul>
        </div>
      </div>

      {/* Widget Flotante del Maratón */}
      <MarathonFloatingWidget
        readingProgress={mockReadingProgress}
        currentBook="genesis"
        currentChapter={15}
        position="bottom-right"
        theme="default"
      />
    </div>
  );
}