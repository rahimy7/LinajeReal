import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Filter, X, Eye, EyeOff } from 'lucide-react';

// Importar el widget flotante del maratón que ya tenemos
import MarathonFloatingWidget from '../components/MarathonFloatingWidget';

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

// ==================== UTILITIES ====================
const generateMockReadingData = (preferredBooks: string[], totalChapters: number) => {
  const result: { [key: string]: number[] } = {};
  let chaptersAssigned = 0;
  
  for (const bookKey of preferredBooks) {
    if (!bibleData[bookKey as keyof typeof bibleData]) continue;
    
    const maxChapters = bibleData[bookKey as keyof typeof bibleData].chapters;
    const chaptersToAssign = Math.min(
      Math.floor(totalChapters / preferredBooks.length) + Math.floor(Math.random() * 10),
      maxChapters
    );
    
    result[bookKey] = [];
    const usedChapters = new Set<number>();
    
    for (let i = 0; i < chaptersToAssign && chaptersAssigned < totalChapters; i++) {
      let chapter: number;
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
};

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

interface BookPageProps {
  side: 'left' | 'right';
  content: React.ReactNode;
  pageNumber: number;
}

const BookPage: React.FC<BookPageProps> = ({ side, content, pageNumber }) => {
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

interface ChapterGridProps {
  book: string;
  bookData: { name: string; chapters: number };
  readingProgress: typeof initialReadingProgress;
  currentReader: string;
  currentChapter: { book: string; chapter: number };
  onSelectChapter: (book: string, chapter: number) => void;
}

const ChapterGrid: React.FC<ChapterGridProps> = ({ 
  book, 
  bookData, 
  readingProgress, 
  currentReader, 
  currentChapter, 
  onSelectChapter 
}) => {
  const getReaderClass = (chapter: number): string => {
    for (const [reader, books] of Object.entries(readingProgress)) {
      if (books[book] && books[book].includes(chapter)) {
        if (!currentReader || currentReader === reader) {
          return readerColors[reader as keyof typeof readerColors] || '';
        }
      }
    }
    return '';
  };

  const isFiltered = (chapter: number): boolean => {
    if (!currentReader) return false;
    const readerData = readingProgress[currentReader as keyof typeof readingProgress];
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

interface FilterPanelProps {
  currentReader: string;
  onReaderChange: (reader: string) => void;
  stats: { totalRead: number; percentage: number };
  totalChapters: number;
  isVisible: boolean;
  onToggle: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  currentReader,
  onReaderChange,
  stats,
  totalChapters,
  isVisible,
  onToggle
}) => {
  return (
    <div className="mb-4">
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="w-full bg-white/95 rounded-xl p-3 mb-2 flex items-center justify-between shadow-lg hover:shadow-xl transition-all"
      >
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-indigo-600" />
          <span className="font-semibold text-gray-800">Filtros y Estadísticas</span>
          <div className="flex gap-2">
            <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs font-medium">
              {stats.totalRead}/{totalChapters}
            </span>
            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
              {stats.percentage}%
            </span>
          </div>
        </div>
        {isVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>

      {/* Expandable Content */}
      {isVisible && (
        <div className="bg-white/95 rounded-xl p-4 shadow-xl space-y-4 animate-in slide-in-from-top duration-300">
          {/* Reader Filter */}
          <div className="flex flex-wrap items-center gap-3">
            <label className="font-semibold text-gray-700">Filtrar por lector:</label>
            <select 
              value={currentReader}
              onChange={(e) => onReaderChange(e.target.value)}
              className="px-4 py-2 rounded-lg border-2 border-indigo-300 text-sm bg-white cursor-pointer focus:border-indigo-500 focus:outline-none"
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

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
              <div className="text-blue-800 text-xs font-medium">Total Leído</div>
              <div className="text-blue-900 text-lg font-bold">{stats.totalRead}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg border border-purple-200">
              <div className="text-purple-800 text-xs font-medium">Total Capítulos</div>
              <div className="text-purple-900 text-lg font-bold">{totalChapters}</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg border border-green-200">
              <div className="text-green-800 text-xs font-medium">Completado</div>
              <div className="text-green-900 text-lg font-bold">{stats.percentage}%</div>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-3 rounded-lg border border-amber-200">
              <div className="text-amber-800 text-xs font-medium">Restante</div>
              <div className="text-amber-900 text-lg font-bold">{totalChapters - stats.totalRead}</div>
            </div>
          </div>

          {/* Legend */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm font-medium text-gray-700 mb-2">Leyenda de lectores:</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(readerColors).map(([reader, colors]) => (
                <div key={reader} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded border-2 ${colors}`} />
                  <span className="text-xs capitalize text-gray-600">{reader}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== MAIN COMPONENT ====================
export default function BibleApp() {
  const [currentBook, setCurrentBook] = useState('genesis');
  const [currentChapter, setCurrentChapter] = useState(1);
  const [currentReader, setCurrentReader] = useState('');
  const [readingProgress] = useState(initialReadingProgress);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showFilters, setShowFilters] = useState(false);
  const [showChapterGrid, setShowChapterGrid] = useState(false);

  const bookKeys = Object.keys(bibleData);
  const currentBookIndex = bookKeys.indexOf(currentBook);
  
  const totalChapters = useMemo(() => {
    return Object.values(bibleData).reduce((sum, book) => sum + book.chapters, 0);
  }, []);

  const stats = useMemo(() => {
    let totalRead = 0;
    
    if (currentReader) {
      const readerData = readingProgress[currentReader as keyof typeof readingProgress];
      if (readerData) {
        for (const chapters of Object.values(readerData)) {
          totalRead += chapters.length;
        }
      }
    } else {
      const uniqueChapters = new Set<string>();
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

  const handleSelectChapter = useCallback((book: string, chapter: number) => {
    setCurrentBook(book);
    setCurrentChapter(chapter);
  }, []);

  const handlePreviousChapter = useCallback(() => {
    if (currentChapter > 1) {
      setCurrentChapter(currentChapter - 1);
    } else if (currentBookIndex > 0) {
      const prevBook = bookKeys[currentBookIndex - 1];
      setCurrentBook(prevBook);
      setCurrentChapter(bibleData[prevBook as keyof typeof bibleData].chapters);
    }
  }, [currentChapter, currentBookIndex, bookKeys]);

  const handleNextChapter = useCallback(() => {
    const maxChapters = bibleData[currentBook as keyof typeof bibleData].chapters;
    if (currentChapter < maxChapters) {
      setCurrentChapter(currentChapter + 1);
    } else if (currentBookIndex < bookKeys.length - 1) {
      const nextBook = bookKeys[currentBookIndex + 1];
      setCurrentBook(nextBook);
      setCurrentChapter(1);
    }
  }, [currentBook, currentChapter, currentBookIndex, bookKeys]);

  const generateVerses = (chapter: number): string[] => {
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
    const bookData = bibleData[currentBook as keyof typeof bibleData];
    const verses = bookData.verses[currentChapter as keyof typeof bookData.verses] || generateVerses(currentChapter);
    
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
    const handleMouseMove = (e: MouseEvent) => {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 p-4">
      {/* Filter Panel */}
      <FilterPanel
        currentReader={currentReader}
        onReaderChange={setCurrentReader}
        stats={stats}
        totalChapters={totalChapters}
        isVisible={showFilters}
        onToggle={() => setShowFilters(!showFilters)}
      />

      {/* Bible Container */}
      <div className="flex-1 flex items-center justify-center perspective-1000 mb-4">
        <div 
          className="relative w-full max-w-6xl h-[70vh] max-h-[700px]"
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
      <div className="bg-white/95 rounded-2xl p-4 shadow-xl space-y-4">
        {/* Book Navigation */}
        <div className="flex gap-3 justify-center items-center flex-wrap">
          <button
            onClick={handlePreviousChapter}
            disabled={currentBookIndex === 0 && currentChapter === 1}
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold disabled:opacity-50 hover:shadow-lg transition-all flex items-center gap-2"
          >
            <ChevronLeft className="w-5 h-5" /> Anterior
          </button>
          
          <select 
            value={currentBook}
            onChange={(e) => {
              setCurrentBook(e.target.value);
              setCurrentChapter(1);
            }}
            className="px-4 py-3 rounded-xl border-2 border-indigo-300 bg-white font-semibold focus:border-indigo-500 focus:outline-none"
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
            disabled={currentBookIndex === bookKeys.length - 1 && currentChapter === bibleData[currentBook as keyof typeof bibleData].chapters}
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold disabled:opacity-50 hover:shadow-lg transition-all flex items-center gap-2"
          >
            Siguiente <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        {/* Chapter Grid Toggle */}
        <div className="text-center">
          <button
            onClick={() => setShowChapterGrid(!showChapterGrid)}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition-colors"
          >
            {showChapterGrid ? 'Ocultar' : 'Mostrar'} Cuadrícula de Capítulos
          </button>
        </div>
        
        {/* Chapter Grid */}
        {showChapterGrid && (
          <div className="bg-white/50 rounded-xl p-4 overflow-x-auto">
            <div className="flex gap-4">
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
          </div>
        )}
      </div>

      {/* Marathon Widget */}
      <MarathonFloatingWidget
        readingProgress={readingProgress}
        currentBook={currentBook}
        currentChapter={currentChapter}
        position="bottom-right"
        theme="default"
        youtubeVideoId="jfKfPfyJRdk"
      />
    </div>
  );
}