import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Filter, X, Eye, EyeOff, RefreshCw, AlertCircle, BookOpen } from 'lucide-react';

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
  total_chapters_read: number;
  total_verses_read: number;
  reading_speed_wpm: number;
  is_active: boolean;
}

interface Stats {
  general: {
    total_books: number;
    total_readers: number;
    active_readers: number;
    total_verses_read: number;
    total_chapters: number;
    total_verses: number;
    completion_percentage: number;
  };
  readers: Reader[];
  books: any[];
}

interface ReadingProgress {
  reader_id: number;
  reader_name: string;
   book_key: string;  
  verse_id: number;
  book_name: string;
  chapter_number: number;
  verse_number: number;
  is_read: boolean;
  read_at?: string;
  notes?: string;
}

interface LastReadChapter {
  book_key: string;
  book_name: string;
  chapter_number: number;
  last_read_at: string;
}

// ==================== API CONFIGURATION ====================
const API_BASE = process.env.NODE_ENV === 'production' 
  ? '/api/bible'
  : 'http://localhost:5000/api/bible';

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

  async getLastReadChapter(): Promise<LastReadChapter | null> {
    try {
      const response = await fetch(`${API_BASE}/reports/last-read-chapter`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.warn('No se pudo obtener el último capítulo leído:', error);
      return null;
    }
  },

  async getReadingProgressByChapter(bookKey: string, chapterNumber: number): Promise<ReadingProgress[]> {
    try {
      const response = await fetch(`${API_BASE}/progress/chapter/${bookKey}/${chapterNumber}`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.warn('Error al obtener progreso del capítulo:', error);
      return [];
    }
  },

  async getAllReadingProgress(): Promise<ReadingProgress[]> {
    try {
      const response = await fetch(`${API_BASE}/progress/all`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.warn('Error al obtener todo el progreso:', error);
      return [];
    }
  },

  async markVerseAsRead(readerId: number, verseId: number, notes?: string): Promise<void> {
    const response = await fetch(`${API_BASE}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        reader_id: readerId, 
        verse_id: verseId, 
        is_read: true,
        notes
      })
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
  readingProgress: ReadingProgress[];
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
  const getChapterStatus = (chapter: number): 'read' | 'partial' | 'empty' => {
    const chapterProgress = readingProgress.filter(
      p => p.book_name === book.name && p.chapter_number === chapter
    );
    
    if (chapterProgress.length === 0) return 'empty';
    
    const readVerses = chapterProgress.filter(p => p.is_read).length;
    const totalVerses = chapterProgress.length;
    
    if (readVerses === totalVerses) return 'read';
    if (readVerses > 0) return 'partial';
    return 'empty';
  };

  const getReaderForChapter = (chapter: number): Reader | null => {
    if (!currentReader) return null;
    
    const chapterProgress = readingProgress.find(
      p => p.book_name === book.name && 
          p.chapter_number === chapter && 
          p.reader_id === currentReader &&
          p.is_read
    );
    
    return chapterProgress ? { id: currentReader } as Reader : null;
  };

  const isChapterAvailable = (chapter: number): boolean => {
    const chapterProgress = readingProgress.filter(
      p => p.book_name === book.name && p.chapter_number === chapter && p.is_read
    );
    return chapterProgress.length > 0;
  };

  const getChapterClass = (chapter: number): string => {
    const status = getChapterStatus(chapter);
    const isCurrentChapter = book.key === currentChapter.book && chapter === currentChapter.chapter;
    const isAvailable = isChapterAvailable(chapter);
    
    let baseClass = 'aspect-square flex items-center justify-center text-xs font-bold rounded cursor-pointer transition-all hover:scale-110';
    
    if (isCurrentChapter) {
      baseClass += ' bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg';
    } else if (!isAvailable) {
      baseClass += ' bg-gray-200 text-gray-400 cursor-not-allowed opacity-50';
    } else {
      switch (status) {
        case 'read':
          baseClass += ' bg-green-200 border-2 border-green-400 text-green-800 hover:bg-green-300';
          break;
        case 'partial':
          baseClass += ' bg-yellow-200 border-2 border-yellow-400 text-yellow-800 hover:bg-yellow-300';
          break;
        default:
          baseClass += ' bg-white border-2 border-stone-300 hover:border-stone-400';
      }
    }
    
    return baseClass;
  };

  

  return (
    <div className="min-w-[150px]">
      <div 
        className={`font-bold text-amber-800 mb-2 p-2 bg-gradient-to-r from-gray-100 to-gray-200 rounded text-center text-sm cursor-pointer hover:from-indigo-500 hover:to-purple-500 hover:text-white transition-all ${book.key === currentChapter.book ? 'from-indigo-500 to-purple-500 text-white' : ''}`}
        onClick={() => {
          // Encontrar el primer capítulo leído del libro
          const firstReadChapter = readingProgress.find(
            p => p.book_name === book.name && p.is_read
          )?.chapter_number || 1;
          
          if (isChapterAvailable(firstReadChapter)) {
            onSelectChapter(book.key, firstReadChapter);
          }
        }}
      >
        {book.name}
      </div>
      <div className="grid grid-cols-5 gap-1">
        {Array.from({ length: book.total_chapters }, (_, i) => i + 1).map(chapter => {
          const isAvailable = isChapterAvailable(chapter);
          
          return (
            <button
              key={chapter}
              onClick={() => isAvailable && onSelectChapter(book.key, chapter)}
              className={getChapterClass(chapter)}
              disabled={!isAvailable}
              title={
                isAvailable 
                  ? `Capítulo ${chapter} - Disponible` 
                  : `Capítulo ${chapter} - No leído aún`
              }
            >
              {chapter}
            </button>
          );
        })}
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
  lastReadChapter: LastReadChapter | null;
   chapterStats: {
    completedChapters: number;
    totalChapters: number;
    percentage: number;
  };
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  currentReader,
  onReaderChange,
  readers,
  stats,
  isVisible,
  onToggle,
  onRefresh,
  loading,
  lastReadChapter
}) => {

  
  const currentReaderData = currentReader ? readers.find(r => r.id === currentReader) : null;
  const totalChapters = stats?.general.total_chapters || 0;
  const totalRead = stats?.general.total_verses_read || 0;
  const totalVerses = stats?.general.total_verses || 1;
  const percentage = Math.round((totalRead / totalVerses) * 100);
 

  return (
    <div className="mb-4">
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="w-full bg-white/95 rounded-xl p-3 mb-2 flex items-center justify-between shadow-lg hover:shadow-xl transition-all"
      >
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-indigo-600" />
          <span className="font-semibold text-gray-800">Estado del Maratón</span>
          {stats && (
            <div className="flex gap-2">
              <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs font-medium">
                {totalRead.toLocaleString()} versículos
              </span>
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                {percentage}% completado
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div
            onClick={(e) => {
              e.stopPropagation();
              onRefresh();
            }}
            className={`p-1 hover:bg-gray-100 rounded transition-colors cursor-pointer ${loading ? 'opacity-50' : ''}`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </div>
          {isVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </div>
      </button>

      {/* Expandable Content */}
      {isVisible && (
        <div className="bg-white/95 rounded-xl p-4 shadow-xl space-y-4 animate-in slide-in-from-top duration-300">
          {/* Last Read Chapter Info */}
          {lastReadChapter && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-blue-800">Último Capítulo Leído</span>
              </div>
              <p className="text-blue-700 text-sm">
                {lastReadChapter.book_name} - Capítulo {lastReadChapter.chapter_number}
              </p>
              <p className="text-blue-600 text-xs">
                Leído el {new Date(lastReadChapter.last_read_at).toLocaleDateString('es-ES')}
              </p>
            </div>
          )}

          {/* Reader Filter */}
          <div className="flex flex-wrap items-center gap-3">
            <label className="font-semibold text-gray-700">Filtrar por lector:</label>
            <select 
              value={currentReader || ''}
              onChange={(e) => onReaderChange(e.target.value ? parseInt(e.target.value) : null)}
              className="px-4 py-2 rounded-lg border-2 border-indigo-300 text-sm bg-white cursor-pointer focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Todos los capítulos leídos</option>
              {readers.map(reader => (
                <option key={reader.id} value={reader.id}>
                  {reader.name} ({reader.total_chapters_read || 0} capítulos)
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
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg border border-green-200">
                <div className="text-green-800 text-xs font-medium">Lectores Activos</div>
                <div className="text-green-900 text-lg font-bold">{stats.general.active_readers}</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg border border-purple-200">
                <div className="text-purple-800 text-xs font-medium">Capítulos Leídos</div>
                <div className="text-purple-900 text-lg font-bold">{stats.general.total_verses_read.toLocaleString()}</div>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-3 rounded-lg border border-amber-200">
                <div className="text-amber-800 text-xs font-medium">Progreso Total</div>
                <div className="text-amber-900 text-lg font-bold">{percentage}%</div>
              </div>
            </div>
          )}

          {/* Active Readers Legend */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm font-medium text-gray-700 mb-2">Lectores activos en el maratón:</div>
            <div className="flex flex-wrap gap-2">
              {readers.map(reader => (
                <div key={reader.id} className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded border-2"
                    style={{ backgroundColor: reader.avatar_color, borderColor: reader.avatar_color }}
                  />
                  <span className="text-xs text-gray-600">
                    {reader.name} ({reader.total_verses_read || 0} versículos)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm font-medium text-gray-700 mb-2">Leyenda de capítulos:</div>
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-200 border-2 border-green-400 rounded" />
                <span>Completamente leído</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-200 border-2 border-yellow-400 rounded" />
                <span>Parcialmente leído</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-200 border-2 border-gray-300 rounded" />
                <span>No leído (no disponible)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== MAIN COMPONENT ====================
export default function BibliaInteractiva() {
  // State management
  const [books, setBooks] = useState<Book[]>([]);
  const [readers, setReaders] = useState<Reader[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [readingProgress, setReadingProgress] = useState<ReadingProgress[]>([]);
  const [lastReadChapter, setLastReadChapter] = useState<LastReadChapter | null>(null);
  const [currentChapter, setCurrentChapter] = useState<ChapterData | null>(null);
  const [currentBook, setCurrentBook] = useState('');
  const [currentChapterNumber, setCurrentChapterNumber] = useState(1);
  const [currentReader, setCurrentReader] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showFilters, setShowFilters] = useState(true);
  const [showChapterGrid, setShowChapterGrid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const calculateChapterStats = useCallback(() => {
  if (!readingProgress.length) return { completedChapters: 0, totalChapters: 1189, percentage: 0 };
  
  const uniqueChapters = new Set();
  readingProgress.forEach(p => {
    if (p.is_read) {
      uniqueChapters.add(`${p.book_key}-${p.chapter_number}`);
    }
  });
  
  const completedChapters = uniqueChapters.size;
  const totalChapters = 1189;
  const percentage = (completedChapters / totalChapters) * 100;
  
  return { completedChapters, totalChapters, percentage };
}, [readingProgress]);

// Load initial data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [booksData, readersData, statsData, progressData, lastChapterData] = await Promise.all([
        api.getBooks(),
        api.getReaders(),
        api.getStats(),
        api.getAllReadingProgress(),
        api.getLastReadChapter()
      ]);
      
      setBooks(booksData);
      setReaders(readersData);
      setStats(statsData);
      setReadingProgress(progressData);
      setLastReadChapter(lastChapterData);
      
      // Cargar el último capítulo automáticamente
      if (lastChapterData && lastChapterData.book_key) {
        console.log('🚀 Auto-loading last chapter:', lastChapterData);
        const chapterData = await api.getChapter(lastChapterData.book_key, lastChapterData.chapter_number);
        setCurrentChapter(chapterData);
        setCurrentBook(lastChapterData.book_key);
        setCurrentChapterNumber(lastChapterData.chapter_number);
      } else if (progressData.length > 0) {
        // Si no hay último capítulo, cargar el primero disponible
        const firstRead = progressData.find(p => p.is_read);
        if (firstRead) {
          console.log('🚀 Auto-loading first available:', firstRead);
          const chapterData = await api.getChapter(firstRead.book_key, firstRead.chapter_number);
          setCurrentChapter(chapterData);
          setCurrentBook(firstRead.book_key);
          setCurrentChapterNumber(firstRead.chapter_number);
        }
      }
      
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Error al cargar los datos. Verifica que el backend esté funcionando.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load specific chapter
// Reemplaza la función loadChapter en BibliaInteractiva.tsx
const loadChapter = useCallback(async (bookKey: string, chapterNumber: number) => {
  console.log('🔍 Loading chapter:', bookKey, chapterNumber);
  console.log('📊 Available progress:', readingProgress);
  
  // Verificar si el capítulo está disponible usando book_key en lugar de book_name
  const chapterProgress = readingProgress.filter(
    p => p.book_key === bookKey && 
         p.chapter_number === chapterNumber && 
         p.is_read
  );
  
  console.log('✅ Chapter progress found:', chapterProgress);
  
  if (chapterProgress.length === 0) {
    // Capítulo no está leído, mostrar en blanco
    console.log('⚠️ Chapter not available');
    setCurrentChapter(null);
    setCurrentBook(bookKey);
    setCurrentChapterNumber(chapterNumber);
    return;
  }
  
  try {
    setLoading(true);
    console.log('📖 Fetching chapter content...');
    const chapterData = await api.getChapter(bookKey, chapterNumber);
    console.log('📖 Chapter data received:', chapterData);
    setCurrentChapter(chapterData);
    setCurrentBook(bookKey);
    setCurrentChapterNumber(chapterNumber);
    setError(null);
  } catch (err) {
    console.error('❌ Error loading chapter:', err);
    setCurrentChapter(null);
    setCurrentBook(bookKey);
    setCurrentChapterNumber(chapterNumber);
  } finally {
    setLoading(false);
  }
}, [readingProgress, books]);
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
    // Buscar el capítulo anterior que esté leído
    const currentBookIndex = books.findIndex(book => book.key === currentBook);
    const currentBookData = books.find(book => book.key === currentBook);
    
    if (!currentBookData) return;
    
    // Buscar en el libro actual
    for (let chapter = currentChapterNumber - 1; chapter >= 1; chapter--) {
      const hasProgress = readingProgress.some(
        p => p.book_name === currentBookData.name && p.chapter_number === chapter && p.is_read
      );
      if (hasProgress) {
        await loadChapter(currentBook, chapter);
        return;
      }
    }
    
    // Buscar en libros anteriores
    for (let bookIndex = currentBookIndex - 1; bookIndex >= 0; bookIndex--) {
      const book = books[bookIndex];
      for (let chapter = book.total_chapters; chapter >= 1; chapter--) {
        const hasProgress = readingProgress.some(
          p => p.book_name === book.name && p.chapter_number === chapter && p.is_read
        );
        if (hasProgress) {
          await loadChapter(book.key, chapter);
          return;
        }
      }
    }
  }, [currentChapter, currentChapterNumber, currentBook, books, loadChapter, readingProgress]);

  const handleNextChapter = useCallback(async () => {
    // Buscar el siguiente capítulo que esté leído
    const currentBookIndex = books.findIndex(book => book.key === currentBook);
    const currentBookData = books.find(book => book.key === currentBook);
    
    if (!currentBookData) return;
    
    // Buscar en el libro actual
    for (let chapter = currentChapterNumber + 1; chapter <= currentBookData.total_chapters; chapter++) {
      const hasProgress = readingProgress.some(
        p => p.book_name === currentBookData.name && p.chapter_number === chapter && p.is_read
      );
      if (hasProgress) {
        await loadChapter(currentBook, chapter);
        return;
      }
    }
    
    // Buscar en libros siguientes
    for (let bookIndex = currentBookIndex + 1; bookIndex < books.length; bookIndex++) {
      const book = books[bookIndex];
      for (let chapter = 1; chapter <= book.total_chapters; chapter++) {
        const hasProgress = readingProgress.some(
          p => p.book_name === book.name && p.chapter_number === chapter && p.is_read
        );
        if (hasProgress) {
          await loadChapter(book.key, chapter);
          return;
        }
      }
    }
  }, [currentChapter, currentChapterNumber, currentBook, books, loadChapter, readingProgress]);

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
      // Show empty bible pages when no chapter is available
      const bookName = books.find(book => book.key === currentBook)?.name || 'Biblia Sagrada';
      
      const emptyContent = (
        <>
          <h1 className="text-2xl font-bold text-amber-800 text-center mb-4 uppercase tracking-wider border-b-2 border-amber-700 pb-3">
            {bookName}
          </h1>
          <div className="text-lg font-bold text-amber-700 text-center mb-4">
            Capítulo {currentChapterNumber}
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-amber-600/50">
              <div className="text-6xl mb-4">📖</div>
              <p className="text-sm italic">Capítulo aún no leído en el maratón</p>
              <p className="text-xs mt-2">
                Este capítulo estará disponible cuando sea leído por la congregación
              </p>
            </div>
          </div>
        </>
      );
      
      return {
        leftContent: emptyContent,
        rightContent: <div className="flex items-center justify-center h-full">
          <div className="text-center text-amber-600/30">
            <div className="text-4xl mb-2">✨</div>
            <p className="text-xs italic">Esperando lectura...</p>
          </div>
        </div>
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

  // Get available books for dropdown (only books with read chapters)
  const getAvailableBooks = useMemo(() => {
    return books.filter(book => {
      return readingProgress.some(p => p.book_name === book.name && p.is_read);
    });
  }, [books, readingProgress]);

  // Check if navigation buttons should be enabled
  const canNavigatePrevious = useMemo(() => {
    if (readingProgress.length === 0) return false;
    
    // Find all read chapters before current
    const currentBookIndex = books.findIndex(book => book.key === currentBook);
    const currentBookData = books.find(book => book.key === currentBook);
    
    if (!currentBookData) return false;
    
    // Check previous chapters in current book
    for (let chapter = currentChapterNumber - 1; chapter >= 1; chapter--) {
      if (readingProgress.some(p => p.book_name === currentBookData.name && p.chapter_number === chapter && p.is_read)) {
        return true;
      }
    }
    
    // Check previous books
    for (let bookIndex = currentBookIndex - 1; bookIndex >= 0; bookIndex--) {
      const book = books[bookIndex];
      if (readingProgress.some(p => p.book_name === book.name && p.is_read)) {
        return true;
      }
    }
    
    return false;
  }, [books, currentBook, currentChapterNumber, readingProgress]);

  const canNavigateNext = useMemo(() => {
    if (readingProgress.length === 0) return false;
    
    // Find all read chapters after current
    const currentBookIndex = books.findIndex(book => book.key === currentBook);
    const currentBookData = books.find(book => book.key === currentBook);
    
    if (!currentBookData) return false;
    
    // Check next chapters in current book
    for (let chapter = currentChapterNumber + 1; chapter <= currentBookData.total_chapters; chapter++) {
      if (readingProgress.some(p => p.book_name === currentBookData.name && p.chapter_number === chapter && p.is_read)) {
        return true;
      }
    }
    
    // Check next books
    for (let bookIndex = currentBookIndex + 1; bookIndex < books.length; bookIndex++) {
      const book = books[bookIndex];
      if (readingProgress.some(p => p.book_name === book.name && p.is_read)) {
        return true;
      }
    }
    
    return false;
  }, [books, currentBook, currentChapterNumber, readingProgress]);

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

  // Show welcome screen if no progress exists
  if (!loading && readingProgress.length === 0 && !lastReadChapter) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 flex items-center justify-center p-4">
        <div className="bg-white/95 rounded-2xl p-8 shadow-xl max-w-lg text-center">
          <div className="text-6xl mb-6">📖</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Maratón Bíblico</h2>
          <h3 className="text-xl font-semibold text-blue-600 mb-4">Linaje Real 2025</h3>
          <p className="text-gray-600 mb-6">
            El maratón aún no ha comenzado. Los capítulos aparecerán aquí conforme 
            vayan siendo leídos por la congregación durante el evento.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <p className="text-blue-800 text-sm">
              <strong>¿Cómo funciona?</strong><br />
              Cada capítulo que sea leído durante el maratón se desbloqueará automáticamente 
              y podrás seguir el progreso en tiempo real.
            </p>
          </div>
          <button
            onClick={() => loadData()}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-5 h-5" />
            Verificar Progreso
          </button>
        </div>
      </div>
    );
  }
const chapterStats = calculateChapterStats();
  return (
      
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 p-4">
      {/* Filter Panel */}
      const chapterStats = calculateChapterStats();
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
        lastReadChapter={lastReadChapter}
        chapterStats={chapterStats}   // 👈 ya la variable está lista
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
            disabled={loading || !canNavigatePrevious}
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all flex items-center gap-2"
            title={!canNavigatePrevious ? "No hay capítulos anteriores disponibles" : "Capítulo anterior"}
          >
            <ChevronLeft className="w-5 h-5" /> Anterior
          </button>
          
          <select 
            value={currentBook}
            onChange={(e) => {
              if (e.target.value) {
                // Encontrar el primer capítulo leído del libro seleccionado
                const selectedBook = books.find(b => b.key === e.target.value);
                if (selectedBook) {
                  const firstReadChapter = readingProgress.find(
                    p => p.book_name === selectedBook.name && p.is_read
                  )?.chapter_number || 1;
                  
                  loadChapter(e.target.value, firstReadChapter);
                }
              }
            }}
            disabled={loading}
            className="px-4 py-3 rounded-xl border-2 border-indigo-300 bg-white font-semibold focus:border-indigo-500 focus:outline-none disabled:opacity-50 min-w-[200px]"
          >
            <option value="">Seleccionar libro...</option>
            <optgroup label="Antiguo Testamento">
              {getAvailableBooks
                .filter(book => book.testament === 'old')
                .map(book => (
                  <option key={book.key} value={book.key}>
                    {book.name}
                  </option>
                ))}
            </optgroup>
            <optgroup label="Nuevo Testamento">
              {getAvailableBooks
                .filter(book => book.testament === 'new')
                .map(book => (
                  <option key={book.key} value={book.key}>
                    {book.name}
                  </option>
                ))}
            </optgroup>
          </select>
          
          <button
            onClick={handleNextChapter}
            disabled={loading || !canNavigateNext}
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all flex items-center gap-2"
            title={!canNavigateNext ? "No hay más capítulos disponibles" : "Siguiente capítulo"}
          >
            Siguiente <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        {/* Progress Info */}
        {stats && (
          <div className="text-center bg-blue-50 rounded-lg p-3">
            
           <p className="font-medium">
  Progreso del Maratón: {chapterStats.completedChapters} capítulos leídos ({chapterStats.percentage.toFixed(1)}% completado)
</p>
            <p className="text-blue-600 text-xs mt-1">
              {getAvailableBooks.length} de {stats.general.total_books} libros disponibles
            </p>
          </div>
        )}
        
        {/* Chapter Grid Toggle */}
        {getAvailableBooks.length > 0 && (
          <div className="text-center">
            <button
              onClick={() => setShowChapterGrid(!showChapterGrid)}
              disabled={loading}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {showChapterGrid ? 'Ocultar' : 'Mostrar'} Cuadrícula de Capítulos
            </button>
          </div>
        )}
        
        {/* Chapter Grid */}
        {showChapterGrid && getAvailableBooks.length > 0 && (
          <div className="bg-white/50 rounded-xl p-4 overflow-x-auto">
            <div className="flex gap-4">
              {getAvailableBooks.map((book) => (
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