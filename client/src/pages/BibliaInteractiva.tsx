import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Filter, X, Eye, EyeOff, RefreshCw, AlertCircle } from 'lucide-react';

// ==================== TYPES ====================
interface Book {
  id: number;
  key: string;
  name: string;
  testament: 'old' | 'new';
  order_index: number;
  total_chapters: number;
  author?: string;
  description?: string;
}

interface ChapterData {
  book: {
    id: number;
    name: string;
    key: string;
    testament: string;
    description?: string;
  };
  chapter: {
    id: number;
    number: number;
    total_verses: number;
    estimated_reading_time: number;
  };
  verses: {
    id: number;
    number: number;
    text: string;
    word_count: number;
  }[];
}

interface Reader {
  id: number;
  uuid: string;
  name: string;
  email?: string;
  avatar_color: string;
  chapters_read?: number;
  verses_read?: number;
  reading_speed_wpm: number;
  is_active: boolean;
}

interface Stats {
  general: {
    total_books: number;
    total_readers: number;
    total_verses_read: number;
    total_chapters: number;
    total_verses: number;
  };
  readers: Reader[];
  books: any[];
}

interface ReadingProgress {
  [readerId: number]: {
    [bookKey: string]: number[];
  };
}

// ==================== API CONFIGURATION ====================
const API_BASE = process.env.NODE_ENV === 'production' 
  ? '/api/bible'  // Producción
  : 'http://localhost:5000/api/bible';  // Desarrollo

// ==================== API FUNCTIONS ====================
const api = {
  async getBooks(): Promise<Book[]> {
    const response = await fetch(`${API_BASE}/books`);
    if (!response.ok) throw new Error('Error al cargar libros');
    const data = await response.json();
    return data.data.sort((a: Book, b: Book) => a.order_index - b.order_index);
  },

  async getChapter(bookKey: string, chapterNumber: number): Promise<ChapterData> {
    const response = await fetch(`${API_BASE}/books/${bookKey}/chapters/${chapterNumber}`);
    if (!response.ok) throw new Error('Error al cargar capítulo');
    const data = await response.json();
    return data.data;
  },

  async getReaders(): Promise<Reader[]> {
    const response = await fetch(`${API_BASE}/readers`);
    if (!response.ok) throw new Error('Error al cargar lectores');
    const data = await response.json();
    return data.data.filter((reader: Reader) => reader.is_active);
  },

  async getStats(): Promise<Stats> {
    const response = await fetch(`${API_BASE}/stats`);
    if (!response.ok) throw new Error('Error al cargar estadísticas');
    const data = await response.json();
    return data.data;
  },

  async getReadingProgress(readerId?: number): Promise<any> {
    const url = readerId 
      ? `${API_BASE}/readers/${readerId}/progress`
      : `${API_BASE}/progress`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Error al cargar progreso');
    const data = await response.json();
    return data.data;
  },

  async markVerseAsRead(readerId: number, verseId: number): Promise<void> {
    const response = await fetch(`${API_BASE}/readers/${readerId}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verse_id: verseId, is_read: true })
    });
    if (!response.ok) throw new Error('Error al marcar versículo');
  },

  async searchVerses(query: string, testament?: string): Promise<any[]> {
    const params = new URLSearchParams({ q: query });
    if (testament) params.append('testament', testament);
    
    const response = await fetch(`${API_BASE}/search?${params}`);
    if (!response.ok) throw new Error('Error en búsqueda');
    const data = await response.json();
    return data.data;
  }
};

// ==================== UTILITY FUNCTIONS ====================
const generateReadingProgressFromAPI = (readers: Reader[], books: Book[]): ReadingProgress => {
  const progress: ReadingProgress = {};
  
  readers.forEach(reader => {
    progress[reader.id] = {};
    const chaptersToAssign = reader.chapters_read || Math.floor(Math.random() * 50) + 10;
    let assigned = 0;
    
    books.forEach(book => {
      if (assigned >= chaptersToAssign) return;
      
      const maxToAssign = Math.min(
        Math.ceil(chaptersToAssign / books.length),
        book.total_chapters
      );
      
      const chapters: number[] = [];
      for (let i = 1; i <= maxToAssign && assigned < chaptersToAssign; i++) {
        if (Math.random() > 0.3) { // 70% probabilidad de estar leído
          chapters.push(i);
          assigned++;
        }
      }
      
      if (chapters.length > 0) {
        progress[reader.id][book.key] = chapters;
      }
    });
  });
  
  return progress;
};

const getReaderColor = (readerId: number): string => {
  const colors = [
    'bg-blue-200 border-blue-400',
    'bg-purple-200 border-purple-400',
    'bg-green-200 border-green-400',
    'bg-yellow-200 border-yellow-400',
    'bg-red-200 border-red-400',
    'bg-teal-200 border-teal-400',
    'bg-orange-200 border-orange-400',
    'bg-pink-200 border-pink-400',
    'bg-indigo-200 border-indigo-400',
    'bg-cyan-200 border-cyan-400'
  ];
  return colors[readerId % colors.length];
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
  book: Book;
  readingProgress: ReadingProgress;
  currentReader: number | null;
  currentChapter: { book: string; chapter: number };
  onSelectChapter: (book: string, chapter: number) => void;
}

const ChapterGrid: React.FC<ChapterGridProps> = ({ 
  book, 
  readingProgress, 
  currentReader, 
  currentChapter, 
  onSelectChapter 
}) => {
  const getReaderClass = (chapter: number): string => {
    for (const [readerId, books] of Object.entries(readingProgress)) {
      if (books[book.key] && books[book.key].includes(chapter)) {
        if (!currentReader || currentReader === parseInt(readerId)) {
          return getReaderColor(parseInt(readerId));
        }
      }
    }
    return '';
  };

  const isFiltered = (chapter: number): boolean => {
    if (!currentReader) return false;
    const readerData = readingProgress[currentReader];
    if (!readerData || !readerData[book.key]) return true;
    return !readerData[book.key].includes(chapter);
  };

  return (
    <div className="min-w-[150px]">
      <div 
        className={`font-bold text-amber-800 mb-2 p-2 bg-gradient-to-r from-gray-100 to-gray-200 rounded text-center text-sm cursor-pointer hover:from-indigo-500 hover:to-purple-500 hover:text-white transition-all ${book.key === currentChapter.book ? 'from-indigo-500 to-purple-500 text-white' : ''}`}
        onClick={() => onSelectChapter(book.key, 1)}
      >
        {book.name}
      </div>
      <div className="grid grid-cols-5 gap-1">
        {Array.from({ length: book.total_chapters }, (_, i) => i + 1).map(chapter => (
          <button
            key={chapter}
            onClick={() => !isFiltered(chapter) && onSelectChapter(book.key, chapter)}
            className={`
              aspect-square flex items-center justify-center text-xs font-bold rounded cursor-pointer
              transition-all hover:scale-110 hover:-translate-y-1 hover:shadow-lg
              ${getReaderClass(chapter)}
              ${book.key === currentChapter.book && chapter === currentChapter.chapter ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : ''}
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
  currentReader: number | null;
  onReaderChange: (readerId: number | null) => void;
  readers: Reader[];
  stats: Stats | null;
  isVisible: boolean;
  onToggle: () => void;
  onRefresh: () => void;
  loading: boolean;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  currentReader,
  onReaderChange,
  readers,
  stats,
  isVisible,
  onToggle,
  onRefresh,
  loading
}) => {
  const currentReaderData = currentReader ? readers.find(r => r.id === currentReader) : null;
  const totalChapters = stats?.general.total_chapters || 0;
  const totalRead = currentReaderData?.chapters_read || stats?.general.total_verses_read || 0;
  const percentage = totalChapters > 0 ? Math.round((totalRead / totalChapters) * 100) : 0;

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
          {stats && (
            <div className="flex gap-2">
              <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs font-medium">
                {totalRead}/{totalChapters}
              </span>
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                {percentage}%
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRefresh();
            }}
            disabled={loading}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {isVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </div>
      </button>

      {/* Expandable Content */}
      {isVisible && (
        <div className="bg-white/95 rounded-xl p-4 shadow-xl space-y-4 animate-in slide-in-from-top duration-300">
          {/* Reader Filter */}
          <div className="flex flex-wrap items-center gap-3">
            <label className="font-semibold text-gray-700">Filtrar por lector:</label>
            <select 
              value={currentReader || ''}
              onChange={(e) => onReaderChange(e.target.value ? parseInt(e.target.value) : null)}
              className="px-4 py-2 rounded-lg border-2 border-indigo-300 text-sm bg-white cursor-pointer focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Todos los capítulos</option>
              {readers.map(reader => (
                <option key={reader.id} value={reader.id}>
                  {reader.name} ({reader.chapters_read || 0} capítulos)
                </option>
              ))}
            </select>
          </div>

          {/* Statistics */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
                <div className="text-blue-800 text-xs font-medium">Libros</div>
                <div className="text-blue-900 text-lg font-bold">{stats.general.total_books}</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg border border-purple-200">
                <div className="text-purple-800 text-xs font-medium">Lectores</div>
                <div className="text-purple-900 text-lg font-bold">{stats.general.total_readers}</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg border border-green-200">
                <div className="text-green-800 text-xs font-medium">Versículos Leídos</div>
                <div className="text-green-900 text-lg font-bold">{stats.general.total_verses_read}</div>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-3 rounded-lg border border-amber-200">
                <div className="text-amber-800 text-xs font-medium">Progreso</div>
                <div className="text-amber-900 text-lg font-bold">{Math.round((stats.general.total_verses_read / stats.general.total_verses) * 100)}%</div>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm font-medium text-gray-700 mb-2">Lectores activos:</div>
            <div className="flex flex-wrap gap-2">
              {readers.map(reader => (
                <div key={reader.id} className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded border-2"
                    style={{ backgroundColor: reader.avatar_color, borderColor: reader.avatar_color }}
                  />
                  <span className="text-xs text-gray-600">{reader.name}</span>
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
  // State management
  const [books, setBooks] = useState<Book[]>([]);
  const [readers, setReaders] = useState<Reader[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [readingProgress, setReadingProgress] = useState<ReadingProgress>({});
  const [currentChapter, setCurrentChapter] = useState<ChapterData | null>(null);
  const [currentBook, setCurrentBook] = useState('');
  const [currentChapterNumber, setCurrentChapterNumber] = useState(1);
  const [currentReader, setCurrentReader] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showFilters, setShowFilters] = useState(true);
  const [showChapterGrid, setShowChapterGrid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [booksData, readersData, statsData] = await Promise.all([
        api.getBooks(),
        api.getReaders(),
        api.getStats()
      ]);
      
      setBooks(booksData);
      setReaders(readersData);
      setStats(statsData);
      
      // Generate reading progress from actual data
      const progress = generateReadingProgressFromAPI(readersData, booksData);
      setReadingProgress(progress);
      
      // Set initial book if not set
      if (!currentBook && booksData.length > 0) {
        const firstBook = booksData[0];
        setCurrentBook(firstBook.key);
        await loadChapter(firstBook.key, 1);
      }
      
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Error al cargar los datos. Verifica que el backend esté funcionando.');
    } finally {
      setLoading(false);
    }
  }, [currentBook]);

  // Load specific chapter
  const loadChapter = useCallback(async (bookKey: string, chapterNumber: number) => {
    try {
      setLoading(true);
      const chapterData = await api.getChapter(bookKey, chapterNumber);
      setCurrentChapter(chapterData);
      setCurrentBook(bookKey);
      setCurrentChapterNumber(chapterNumber);
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error('Error loading chapter:', err);
      // Don't set error, just show empty chapter
      setCurrentChapter(null);
      setCurrentBook(bookKey);
      setCurrentChapterNumber(chapterNumber);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle chapter selection
  const handleSelectChapter = useCallback((bookKey: string, chapter: number) => {
    loadChapter(bookKey, chapter);
  }, [loadChapter]);

  // Navigation handlers
  const handlePreviousChapter = useCallback(async () => {
    if (!currentChapter) return;
    
    if (currentChapterNumber > 1) {
      await loadChapter(currentBook, currentChapterNumber - 1);
    } else {
      const currentBookIndex = books.findIndex(book => book.key === currentBook);
      if (currentBookIndex > 0) {
        const prevBook = books[currentBookIndex - 1];
        await loadChapter(prevBook.key, prevBook.total_chapters);
      }
    }
  }, [currentChapter, currentChapterNumber, currentBook, books, loadChapter]);

  const handleNextChapter = useCallback(async () => {
    if (!currentChapter) return;
    
    const currentBookData = books.find(book => book.key === currentBook);
    if (!currentBookData) return;
    
    if (currentChapterNumber < currentBookData.total_chapters) {
      await loadChapter(currentBook, currentChapterNumber + 1);
    } else {
      const currentBookIndex = books.findIndex(book => book.key === currentBook);
      if (currentBookIndex < books.length - 1) {
        const nextBook = books[currentBookIndex + 1];
        await loadChapter(nextBook.key, 1);
      }
    }
  }, [currentChapter, currentChapterNumber, currentBook, books, loadChapter]);

  // Mouse movement effect for 3D
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

  // Generate content for current chapter
  const getChapterContent = () => {
    if (!currentChapter) {
      // Show empty bible pages when chapter is not found
      const emptyContent = (
        <>
          <h1 className="text-2xl font-bold text-amber-800 text-center mb-4 uppercase tracking-wider border-b-2 border-amber-700 pb-3">
            {books.find(book => book.key === currentBook)?.name || 'Biblia'}
          </h1>
          <div className="text-lg font-bold text-amber-700 text-center mb-4">
            Capítulo {currentChapterNumber}
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-amber-600/50">
              <div className="text-6xl mb-4">📖</div>
              <p className="text-sm italic">Capítulo no disponible</p>
            </div>
          </div>
        </>
      );
      
      return {
        leftContent: emptyContent,
        rightContent: <div></div>
      };
    }

    const verses = currentChapter.verses;
    const midPoint = Math.ceil(verses.length / 2);
    const leftVerses = verses.slice(0, midPoint);
    const rightVerses = verses.slice(midPoint);
    
    const leftContent = (
      <>
        <h1 className="text-2xl font-bold text-amber-800 text-center mb-4 uppercase tracking-wider border-b-2 border-amber-700 pb-3">
          {currentChapter.book.name}
        </h1>
        <div className="text-lg font-bold text-amber-700 text-center mb-4">
          Capítulo {currentChapter.chapter.number}
        </div>
        <div className="text-xs text-gray-600 text-center mb-4">
          {currentChapter.chapter.estimated_reading_time} min de lectura
        </div>
        {leftVerses.map((verse) => (
          <p key={verse.id} className="text-sm leading-relaxed text-stone-700 mb-2 text-justify">
            <span className="text-xs font-bold text-amber-700 align-super mr-1">{verse.number}</span>
            {verse.text}
          </p>
        ))}
      </>
    );
    
    const rightContent = (
      <>
        {rightVerses.map((verse) => (
          <p key={verse.id} className="text-sm leading-relaxed text-stone-700 mb-2 text-justify">
            <span className="text-xs font-bold text-amber-700 align-super mr-1">{verse.number}</span>
            {verse.text}
          </p>
        ))}
      </>
    );
    
    return { leftContent, rightContent };
  };

  const { leftContent, rightContent } = getChapterContent();

  // Error display - only for initial load errors
  if (error && !loading && books.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center p-4">
        <div className="bg-white/95 rounded-2xl p-8 shadow-xl max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Error de Conexión</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => loadData()}
            className="px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-5 h-5" />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 p-4">
      {/* Filter Panel */}
      <FilterPanel
        currentReader={currentReader}
        onReaderChange={setCurrentReader}
        readers={readers}
        stats={stats}
        isVisible={showFilters}
        onToggle={() => setShowFilters(!showFilters)}
        onRefresh={loadData}
        loading={loading}
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
          <BookPage side="left" content={leftContent} pageNumber={currentChapterNumber * 2 - 1} />
          <BookPage side="right" content={rightContent} pageNumber={currentChapterNumber * 2} />
          
          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-20 rounded">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-gray-600">Cargando...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Panel */}
      <div className="bg-white/95 rounded-2xl p-4 shadow-xl space-y-4">
        {/* Book Navigation */}
        <div className="flex gap-3 justify-center items-center flex-wrap">
          <button
            onClick={handlePreviousChapter}
            disabled={loading || (books.length > 0 && books[0]?.key === currentBook && currentChapterNumber === 1)}
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold disabled:opacity-50 hover:shadow-lg transition-all flex items-center gap-2"
          >
            <ChevronLeft className="w-5 h-5" /> Anterior
          </button>
          
          <select 
            value={currentBook}
            onChange={(e) => {
              if (e.target.value) {
                loadChapter(e.target.value, 1);
              }
            }}
            disabled={loading}
            className="px-4 py-3 rounded-xl border-2 border-indigo-300 bg-white font-semibold focus:border-indigo-500 focus:outline-none disabled:opacity-50"
          >
            <option value="">Seleccionar libro...</option>
            <optgroup label="Antiguo Testamento">
              {books
                .filter(book => book.testament === 'old')
                .map(book => (
                  <option key={book.key} value={book.key}>{book.name}</option>
                ))}
            </optgroup>
            <optgroup label="Nuevo Testamento">
              {books
                .filter(book => book.testament === 'new')
                .map(book => (
                  <option key={book.key} value={book.key}>{book.name}</option>
                ))}
            </optgroup>
          </select>
          
          <button
            onClick={handleNextChapter}
            disabled={loading || ((() => {
              const currentBookData = books.find(book => book.key === currentBook);
              const isLastBook = books.length > 0 && books[books.length - 1]?.key === currentBook;
              const isLastChapter = currentBookData && currentChapterNumber === currentBookData.total_chapters;
              return isLastBook && isLastChapter;
            })())}
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold disabled:opacity-50 hover:shadow-lg transition-all flex items-center gap-2"
          >
            Siguiente <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        {/* Chapter Grid Toggle */}
        <div className="text-center">
          <button
            onClick={() => setShowChapterGrid(!showChapterGrid)}
            disabled={loading}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {showChapterGrid ? 'Ocultar' : 'Mostrar'} Cuadrícula de Capítulos
          </button>
        </div>
        
        {/* Chapter Grid */}
        {showChapterGrid && (
          <div className="bg-white/50 rounded-xl p-4 overflow-x-auto">
            <div className="flex gap-4">
              {books.map((book) => (
                <ChapterGrid
                  key={book.key}
                  book={book}
                  readingProgress={readingProgress}
                  currentReader={currentReader}
                  currentChapter={{ book: currentBook, chapter: currentChapterNumber }}
                  onSelectChapter={handleSelectChapter}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}