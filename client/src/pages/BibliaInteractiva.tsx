import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Clock, BookOpen, FileText, Type, Zap, MapPin, Users, RefreshCw } from 'lucide-react';

// ==================== DATA ====================
const bibleData = {
  genesis: {
    name: "Génesis",
    chapters: 50,
    testament: "old",
    verses: {
      1: [
        "En el principio creó Dios los cielos y la tierra.",
        "Y la tierra estaba desordenada y vacía, y las tinieblas estaban sobre la faz del abismo, y el Espíritu de Dios se movía sobre la faz de las aguas.",
        "Y dijo Dios: Sea la luz; y fue la luz.",
        "Y vio Dios que la luz era buena; y separó Dios la luz de las tinieblas.",
        "Y llamó Dios a la luz Día, y a las tinieblas llamó Noche. Y fue la tarde y la mañana un día.",
        "Luego dijo Dios: Haya expansión en medio de las aguas, y separe las aguas de las aguas."
      ]
    }
  },
  exodo: { name: "Éxodo", chapters: 40, testament: "old", verses: {} },
  levitico: { name: "Levítico", chapters: 27, testament: "old", verses: {} },
  numeros: { name: "Números", chapters: 36, testament: "old", verses: {} },
  deuteronomio: { name: "Deuteronomio", chapters: 34, testament: "old", verses: {} },
  salmos: {
    name: "Salmos",
    chapters: 150,
    testament: "old",
    verses: {
      23: [
        "Jehová es mi pastor; nada me faltará.",
        "En lugares de delicados pastos me hará descansar;",
        "Junto a aguas de reposo me pastoreará.",
        "Confortará mi alma;",
        "Me guiará por sendas de justicia por amor de su nombre."
      ]
    }
  },
  proverbios: { name: "Proverbios", chapters: 31, testament: "old", verses: {} },
  isaias: { name: "Isaías", chapters: 66, testament: "old", verses: {} },
  mateo: {
    name: "Mateo",
    chapters: 28,
    testament: "new",
    verses: {
      1: [
        "Libro de la genealogía de Jesucristo, hijo de David, hijo de Abraham.",
        "Abraham engendró a Isaac, Isaac a Jacob, y Jacob a Judá y a sus hermanos."
      ]
    }
  },
  marcos: { name: "Marcos", chapters: 16, testament: "new", verses: {} },
  lucas: { name: "Lucas", chapters: 24, testament: "new", verses: {} },
  juan: {
    name: "Juan",
    chapters: 21,
    testament: "new",
    verses: {
      1: [
        "En el principio era el Verbo, y el Verbo era con Dios, y el Verbo era Dios.",
        "Este era en el principio con Dios.",
        "Todas las cosas por él fueron hechas, y sin él nada de lo que ha sido hecho, fue hecho."
      ]
    }
  },
  hechos: { name: "Hechos", chapters: 28, testament: "new", verses: {} },
  romanos: { name: "Romanos", chapters: 16, testament: "new", verses: {} },
  '1corintios': { name: "1 Corintios", chapters: 16, testament: "new", verses: {} },
  galatas: { name: "Gálatas", chapters: 6, testament: "new", verses: {} },
  efesios: { name: "Efesios", chapters: 6, testament: "new", verses: {} },
  filipenses: { name: "Filipenses", chapters: 4, testament: "new", verses: {} },
  '1timoteo': { name: "1 Timoteo", chapters: 6, testament: "new", verses: {} },
  hebreos: { name: "Hebreos", chapters: 13, testament: "new", verses: {} },
  santiago: { name: "Santiago", chapters: 5, testament: "new", verses: {} },
  '1pedro': { name: "1 Pedro", chapters: 5, testament: "new", verses: {} },
  '1juan': { name: "1 Juan", chapters: 5, testament: "new", verses: {} },
  apocalipsis: {
    name: "Apocalipsis",
    chapters: 22,
    testament: "new",
    verses: {
      1: [
        "La revelación de Jesucristo, que Dios le dio, para manifestar a sus siervos las cosas que deben suceder pronto.",
        "Y la declaró enviándola por medio de su ángel a su siervo Juan."
      ]
    }
  }
};

// Función para generar datos mock de lectura
function generateMockReadingData(preferredBooks, totalChapters) {
  const result = {};
  let chaptersAssigned = 0;
  
  for (const bookKey of preferredBooks) {
    if (!bibleData[bookKey]) continue;
    
    const maxChapters = bibleData[bookKey].chapters;
    const chaptersToAssign = Math.min(
      Math.floor(totalChapters / preferredBooks.length) + Math.floor(Math.random() * 10),
      maxChapters
    );
    
    result[bookKey] = [];
    const usedChapters = new Set();
    
    for (let i = 0; i < chaptersToAssign && chaptersAssigned < totalChapters; i++) {
      let chapter;
      do {
        chapter = Math.floor(Math.random() * maxChapters) + 1;
      } while (usedChapters.has(chapter));
      
      usedChapters.add(chapter);
      result[bookKey].push(chapter);
      chaptersAssigned++;
    }
    
    result[bookKey].sort((a, b) => a - b);
  }
  
  return result;
}

const initialReadingProgress = {
  juan: generateMockReadingData(['genesis', 'exodo', 'salmos', 'mateo', 'juan', 'romanos', 'hebreos'], 325),
  maria: generateMockReadingData(['genesis', 'salmos', 'proverbios', 'lucas', 'juan', 'hechos', '1juan'], 280),
  pedro: generateMockReadingData(['exodo', 'numeros', 'isaias', 'marcos', 'hechos', '1pedro', 'santiago'], 215),
  ana: generateMockReadingData(['genesis', 'levitico', 'salmos', 'proverbios', 'lucas', 'efesios', 'filipenses'], 190),
  pablo: generateMockReadingData(['deuteronomio', 'isaias', 'romanos', '1corintios', 'galatas', 'efesios', '1timoteo'], 175),
  lucas: generateMockReadingData(['salmos', 'proverbios', 'mateo', 'lucas', 'hechos', 'hebreos'], 150),
  marcos: generateMockReadingData(['genesis', 'exodo', 'marcos', 'juan', 'apocalipsis'], 125),
  sara: generateMockReadingData(['salmos', 'proverbios', 'santiago', '1pedro', '1juan'], 95)
};

const readerColors = {
  juan: 'bg-blue-200 border-blue-400',
  maria: 'bg-purple-200 border-purple-400',
  pedro: 'bg-green-200 border-green-400',
  ana: 'bg-yellow-200 border-yellow-400',
  pablo: 'bg-red-200 border-red-400',
  lucas: 'bg-teal-200 border-teal-400',
  marcos: 'bg-orange-200 border-orange-400',
  sara: 'bg-gray-200 border-gray-400'
};

// ==================== COMPONENTS ====================

// Marathon Panel Component
const MarathonPanel = ({ readingProgress, currentBook, currentChapter }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [timer, setTimer] = useState('');
  const [marathonStats, setMarathonStats] = useState({
    completedChapters: 0,
    completedVerses: 0,
    completedWords: 0,
    readingSpeed: 0,
    percentage: 0
  });

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

  useEffect(() => {
    const allReadChapters = new Set();
    
    for (const [reader, books] of Object.entries(readingProgress)) {
      for (const [book, chapters] of Object.entries(books)) {
        chapters.forEach(chapter => {
          allReadChapters.add(`${book}-${chapter}`);
        });
      }
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
      percentage
    });
  }, [readingProgress]);

  const circumference = 2 * Math.PI * 65;
  const strokeDashoffset = circumference - (marathonStats.percentage / 100) * circumference;

  return (
    <div className={`fixed right-5 top-1/2 -translate-y-1/2 w-80 bg-gradient-to-br from-stone-100 to-stone-200 rounded-2xl p-6 shadow-2xl border border-stone-300 z-50 transition-all duration-300 ${isCollapsed ? 'w-20 p-4' : ''}`}>
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-16 bg-gradient-to-r from-amber-700 to-amber-600 rounded-l-2xl flex items-center justify-center text-white hover:from-amber-800 hover:to-amber-700 transition-colors"
      >
        {isCollapsed ? '▶' : '◀'}
      </button>

      {!isCollapsed && (
        <div className="space-y-4">
          <div className="text-center p-4 bg-white/50 rounded-xl">
            <div className="text-xs text-gray-600 mb-1 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" />
              Tiempo restante
            </div>
            <div className="text-3xl font-bold text-amber-700 font-mono">{timer}</div>
          </div>

          <div className="text-center">
            <h3 className="text-sm font-bold text-amber-800 mb-4">📊 PROGRESO DE ESCRITURA</h3>
            
            <div className="relative inline-block">
              <svg width="150" height="150">
                <defs>
                  <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#c8852c" />
                    <stop offset="100%" stopColor="#a06b20" />
                  </linearGradient>
                </defs>
                <circle
                  cx="75"
                  cy="75"
                  r="65"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="12"
                />
                <circle
                  cx="75"
                  cy="75"
                  r="65"
                  fill="none"
                  stroke="url(#progress-gradient)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  transform="rotate(-90 75 75)"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-amber-800">
                  {Math.floor(marathonStats.percentage)}%
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-white/70 rounded-lg">
              <span className="flex items-center gap-2 text-sm text-stone-600">
                <BookOpen className="w-4 h-4" /> Capítulos
              </span>
              <span className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-3 py-1 rounded-full text-xs font-bold">
                {marathonStats.completedChapters}/1189
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-white/70 rounded-lg">
              <span className="flex items-center gap-2 text-sm text-stone-600">
                <FileText className="w-4 h-4" /> Versículos
              </span>
              <span className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-3 py-1 rounded-full text-xs font-bold">
                {marathonStats.completedVerses}/31102
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-white/70 rounded-lg">
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
                {marathonStats.readingSpeed} palabras/hora
              </span>
            </div>
          </div>

          <div className="p-3 bg-white/80 rounded-lg border-l-4 border-amber-600">
            <div className="text-xs font-bold text-amber-800 mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Estado Actual
            </div>
            <div className="text-xs text-stone-600">
              Escribiendo {bibleData[currentBook]?.name || 'Génesis'}, Capítulo {currentChapter}...
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Book Page Component
const BookPage = ({ side, content, pageNumber }) => {
  const isLeft = side === 'left';
  
  return (
    <div className={`absolute w-[48%] h-full bg-gradient-to-r ${isLeft ? 'from-stone-50 to-stone-100 left-[1%] border-r' : 'from-stone-100 to-stone-50 right-[1%] border-l'} border-stone-300 rounded shadow-xl overflow-hidden`}>
      <div className="p-6 h-full overflow-y-auto">
        {content}
      </div>
      <div className={`absolute bottom-4 text-xs text-amber-800 italic ${isLeft ? 'left-6' : 'right-6'}`}>
        Pág. {pageNumber}
      </div>
    </div>
  );
};

// Chapter Grid Component
const ChapterGrid = ({ book, bookData, readingProgress, currentReader, currentChapter, onSelectChapter }) => {
  const getReaderClass = (chapter) => {
    for (const [reader, books] of Object.entries(readingProgress)) {
      if (books[book] && books[book].includes(chapter)) {
        if (!currentReader || currentReader === reader) {
          return readerColors[reader] || '';
        }
      }
    }
    return '';
  };

  const isFiltered = (chapter) => {
    if (!currentReader) return false;
    const readerData = readingProgress[currentReader];
    if (!readerData || !readerData[book]) return true;
    return !readerData[book].includes(chapter);
  };

  return (
    <div className="min-w-[150px]">
      <div 
        className={`font-bold text-amber-800 mb-2 p-2 bg-gradient-to-r from-gray-100 to-gray-200 rounded text-center text-sm cursor-pointer hover:from-indigo-500 hover:to-purple-500 hover:text-white transition-all ${book === currentChapter.book ? 'from-indigo-500 to-purple-500 text-white' : ''}`}
        onClick={() => onSelectChapter(book, 1)}
      >
        {bookData.name}
      </div>
      <div className="grid grid-cols-5 gap-1">
        {Array.from({ length: bookData.chapters }, (_, i) => i + 1).map(chapter => (
          <button
            key={chapter}
            onClick={() => !isFiltered(chapter) && onSelectChapter(book, chapter)}
            className={`
              aspect-square flex items-center justify-center text-xs font-bold rounded cursor-pointer
              transition-all hover:scale-110 hover:-translate-y-1 hover:shadow-lg
              ${getReaderClass(chapter)}
              ${book === currentChapter.book && chapter === currentChapter.chapter ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : ''}
              ${isFiltered(chapter) ? 'opacity-20 cursor-not-allowed' : 'bg-white shadow border border-stone-300'}
            `}
            disabled={isFiltered(chapter)}
          >
            {chapter}
          </button>
        ))}
      </div>
    </div>
  );
};

// Main Bible App Component
export default function BibleApp() {
  const [currentBook, setCurrentBook] = useState('genesis');
  const [currentChapter, setCurrentChapter] = useState(1);
  const [currentReader, setCurrentReader] = useState('');
  const [readingProgress, setReadingProgress] = useState(initialReadingProgress);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const bookKeys = Object.keys(bibleData);
  const currentBookIndex = bookKeys.indexOf(currentBook);
  
  const totalChapters = useMemo(() => {
    return Object.values(bibleData).reduce((sum, book) => sum + book.chapters, 0);
  }, []);

  const stats = useMemo(() => {
    let totalRead = 0;
    
    if (currentReader) {
      const readerData = readingProgress[currentReader];
      if (readerData) {
        for (const chapters of Object.values(readerData)) {
          totalRead += chapters.length;
        }
      }
    } else {
      const uniqueChapters = new Set();
      for (const [reader, books] of Object.entries(readingProgress)) {
        for (const [book, chapters] of Object.entries(books)) {
          chapters.forEach(chapter => {
            uniqueChapters.add(`${book}-${chapter}`);
          });
        }
      }
      totalRead = uniqueChapters.size;
    }
    
    return {
      totalRead,
      percentage: Math.round((totalRead / totalChapters) * 100)
    };
  }, [readingProgress, currentReader, totalChapters]);

  const handleSelectChapter = useCallback((book, chapter) => {
    setCurrentBook(book);
    setCurrentChapter(chapter);
  }, []);

  const handlePreviousChapter = useCallback(() => {
    if (currentChapter > 1) {
      setCurrentChapter(currentChapter - 1);
    } else if (currentBookIndex > 0) {
      const prevBook = bookKeys[currentBookIndex - 1];
      setCurrentBook(prevBook);
      setCurrentChapter(bibleData[prevBook].chapters);
    }
  }, [currentChapter, currentBookIndex, bookKeys]);

  const handleNextChapter = useCallback(() => {
    const maxChapters = bibleData[currentBook].chapters;
    if (currentChapter < maxChapters) {
      setCurrentChapter(currentChapter + 1);
    } else if (currentBookIndex < bookKeys.length - 1) {
      const nextBook = bookKeys[currentBookIndex + 1];
      setCurrentBook(nextBook);
      setCurrentChapter(1);
    }
  }, [currentBook, currentChapter, currentBookIndex, bookKeys]);

  const generateVerses = (chapter) => {
    const templates = [
      `Este es el comienzo del capítulo ${chapter}.`,
      "Y aconteció en aquellos días que se cumplieron las palabras.",
      "El Señor habló a su pueblo con gran misericordia y amor.",
      "Y todos los que escucharon estas palabras fueron llenos de gozo.",
      "Porque grandes son las obras del Señor y maravillosos sus caminos.",
      "Bienaventurados los que guardan sus mandamientos."
    ];
    return templates.slice(0, Math.floor(Math.random() * 3) + 4);
  };

  const getChapterContent = () => {
    const bookData = bibleData[currentBook];
    const verses = bookData.verses[currentChapter] || generateVerses(currentChapter);
    
    const midPoint = Math.ceil(verses.length / 2);
    const leftVerses = verses.slice(0, midPoint);
    const rightVerses = verses.slice(midPoint);
    
    const leftContent = (
      <>
        <h1 className="text-2xl font-bold text-amber-800 text-center mb-4 uppercase tracking-wider border-b-2 border-amber-700 pb-3">
          {bookData.name}
        </h1>
        <div className="text-lg font-bold text-amber-700 text-center mb-4">
          Capítulo {currentChapter}
        </div>
        {leftVerses.map((verse, index) => (
          <p key={index} className="text-sm leading-relaxed text-stone-700 mb-2 text-justify">
            <span className="text-xs font-bold text-amber-700 align-super mr-1">{index + 1}</span>
            {verse}
          </p>
        ))}
      </>
    );
    
    const rightContent = (
      <>
        {rightVerses.map((verse, index) => (
          <p key={index} className="text-sm leading-relaxed text-stone-700 mb-2 text-justify">
            <span className="text-xs font-bold text-amber-700 align-super mr-1">{midPoint + index + 1}</span>
            {verse}
          </p>
        ))}
      </>
    );
    
    return { leftContent, rightContent };
  };

  const { leftContent, rightContent } = getChapterContent();

  // Mouse move effect for 3D
  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 10;
      const y = (e.clientY / window.innerHeight - 0.5) * 10;
      setMousePosition({ x, y });
    };

    if (window.innerWidth > 768) {
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-600 p-2 flex flex-col">
      {/* Top Controls */}
      <div className="bg-white/95 rounded-2xl p-3 mb-2 flex items-center justify-between gap-2 flex-wrap shadow-xl">
        <div className="flex items-center gap-2">
          <label className="font-bold text-stone-700 text-sm">Filtrar por lector:</label>
          <select 
            value={currentReader}
            onChange={(e) => setCurrentReader(e.target.value)}
            className="px-3 py-1 rounded-full border-2 border-indigo-500 text-sm bg-white cursor-pointer"
          >
            <option value="">Todos los capítulos</option>
            <option value="juan">Juan (325 capítulos)</option>
            <option value="maria">María (280 capítulos)</option>
            <option value="pedro">Pedro (215 capítulos)</option>
            <option value="ana">Ana (190 capítulos)</option>
            <option value="pablo">Pablo (175 capítulos)</option>
            <option value="lucas">Lucas (150 capítulos)</option>
            <option value="marcos">Marcos (125 capítulos)</option>
            <option value="sara">Sara (95 capítulos)</option>
          </select>
        </div>
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1">
            <span>Total leído:</span>
            <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-2 py-1 rounded-full font-bold">
              {stats.totalRead}/{totalChapters}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span>Completado:</span>
            <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-2 py-1 rounded-full font-bold">
              {stats.percentage}%
            </span>
          </div>
        </div>
      </div>

      {/* Bible Container */}
      <div className="flex-1 flex items-center justify-center perspective-1000">
        <div 
          className="relative w-full max-w-6xl h-[60vh] max-h-[600px]"
          style={{
            transform: `rotateY(${mousePosition.x}deg) rotateX(${-mousePosition.y}deg)`,
            transformStyle: 'preserve-3d',
            transition: 'transform 0.1s'
          }}
        >
          {/* Book Spine */}
          <div className="absolute w-[2%] h-full bg-gradient-to-r from-amber-800 via-amber-700 to-amber-800 left-1/2 -translate-x-1/2 shadow-2xl z-10" />
          
          {/* Pages */}
          <BookPage side="left" content={leftContent} pageNumber={currentChapter * 2 - 1} />
          <BookPage side="right" content={rightContent} pageNumber={currentChapter * 2} />
        </div>
      </div>

      {/* Navigation Panel */}
      <div className="bg-white/95 rounded-2xl p-4 mt-2 flex flex-col gap-3 shadow-xl">
        <div className="flex gap-2 justify-center items-center flex-wrap">
          <button
            onClick={handlePreviousChapter}
            disabled={currentBookIndex === 0 && currentChapter === 1}
            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full font-bold text-sm disabled:opacity-50 hover:shadow-lg transition-all flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> Anterior
          </button>
          
          <select 
            value={currentBook}
            onChange={(e) => {
              setCurrentBook(e.target.value);
              setCurrentChapter(1);
            }}
            className="px-3 py-2 rounded-full border-2 border-indigo-500 text-sm bg-white"
          >
            <optgroup label="Antiguo Testamento">
              {Object.entries(bibleData)
                .filter(([_, data]) => data.testament === 'old')
                .map(([key, data]) => (
                  <option key={key} value={key}>{data.name}</option>
                ))}
            </optgroup>
            <optgroup label="Nuevo Testamento">
              {Object.entries(bibleData)
                .filter(([_, data]) => data.testament === 'new')
                .map(([key, data]) => (
                  <option key={key} value={key}>{data.name}</option>
                ))}
            </optgroup>
          </select>
          
          <button
            onClick={handleNextChapter}
            disabled={currentBookIndex === bookKeys.length - 1 && currentChapter === bibleData[currentBook].chapters}
            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full font-bold text-sm disabled:opacity-50 hover:shadow-lg transition-all flex items-center gap-1"
          >
            Siguiente <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        
        {/* Books and Chapters Grid */}
        <div className="flex gap-4 overflow-x-auto p-2 bg-white/50 rounded-xl">
          {Object.entries(bibleData).map(([bookKey, bookData]) => (
            <ChapterGrid
              key={bookKey}
              book={bookKey}
              bookData={bookData}
              readingProgress={readingProgress}
              currentReader={currentReader}
              currentChapter={{ book: currentBook, chapter: currentChapter }}
              onSelectChapter={handleSelectChapter}
            />
          ))}
        </div>
        
        {/* Legend */}
        <div className="flex gap-2 flex-wrap p-2 bg-white/30 rounded-xl text-xs">
          {Object.entries(readerColors).map(([reader, colors]) => (
            <div key={reader} className="flex items-center gap-1">
              <div className={`w-4 h-4 rounded ${colors}`} />
              <span className="capitalize">{reader}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Marathon Panel */}
      <MarathonPanel 
        readingProgress={readingProgress}
        currentBook={currentBook}
        currentChapter={currentChapter}
      />
    </div>
  );
}