import React, { useState, useEffect } from 'react';
import { BookOpen, Users, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface Book {
  id: number;
  key: string;
  name: string;
  total_chapters: number;
  testament: string;
}

interface Reader {
  id: number;
  name: string;
  is_active: boolean;
}

interface Chapter {
  chapter_number: number;
  has_progress: boolean;
}

interface ProgressManagerProps {
  onProgressUpdate: () => void;
}

const API_BASE = process.env.NODE_ENV === 'production' 
  ? '/api/bible' 
  : 'http://localhost:5000/api/bible';

const ProgressManager: React.FC<ProgressManagerProps> = ({ onProgressUpdate }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [readers, setReaders] = useState<Reader[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [selectedReader, setSelectedReader] = useState<Reader | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [readProgress, setReadProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Search/filter states
  const [bookSearch, setBookSearch] = useState('');
  const [readerSearch, setReaderSearch] = useState('');
  const [chapterFilter, setChapterFilter] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedBook) {
      loadChapters();
    }
  }, [selectedBook]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [booksResponse, readersResponse, progressResponse] = await Promise.all([
        fetch(`${API_BASE}/books`),
        fetch(`${API_BASE}/readers`),
        fetch(`${API_BASE}/progress/all`)
      ]);

      if (booksResponse.ok && readersResponse.ok) {
        const booksData = await booksResponse.json();
        const readersData = await readersResponse.json();
        
        setBooks(booksData.data.sort((a: Book, b: Book) => a.testament.localeCompare(b.testament)));
        setReaders(readersData.data.filter((r: Reader) => r.is_active));
        
        if (progressResponse.ok) {
          const progressData = await progressResponse.json();
          setReadProgress(progressData.data);
        }
      }
    } catch (err) {
      setError('Error al cargar datos iniciales');
    } finally {
      setLoading(false);
    }
  };

  const loadChapters = async () => {
    if (!selectedBook) return;

    try {
      const chapters: Chapter[] = [];
      for (let i = 1; i <= selectedBook.total_chapters; i++) {
        // Check if this chapter has been read by any reader
        const hasProgress = readProgress.some(p => 
          p.book_key === selectedBook.key && 
          p.chapter_number === i &&
          p.is_read
        );
        
        chapters.push({
          chapter_number: i,
          has_progress: hasProgress
        });
      }
      setChapters(chapters);
    } catch (err) {
      setError('Error al cargar capítulos');
    }
  };

  const handleSubmit = async () => {
    if (!selectedBook || !selectedChapter || !selectedReader) {
      setError('Por favor selecciona libro, capítulo y lector');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_BASE}/progress/chapter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reader_name: selectedReader.name,
          book_key: selectedBook.key,
          chapter_number: selectedChapter,
          notes: `Marcado desde dashboard admin - ${new Date().toLocaleDateString()}`
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(`✅ ${selectedBook.name} ${selectedChapter} marcado completamente para ${selectedReader.name}`);
        
        // Reset selections
        setSelectedChapter(null);
        
        // Notify parent to refresh
        onProgressUpdate();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
        
        // Reload progress data to update visual indicators
        await loadInitialData();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al marcar progreso');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter functions
  const filteredBooks = books.filter(book =>
    book.name.toLowerCase().includes(bookSearch.toLowerCase())
  );

  const filteredReaders = readers.filter(reader =>
    reader.name.toLowerCase().includes(readerSearch.toLowerCase())
  );

  const filteredChapters = chapters.filter(chapter => {
    if (chapterFilter === '') return true;
    const chapterNum = parseInt(chapterFilter);
    return !isNaN(chapterNum) ? chapter.chapter_number === chapterNum : true;
  });

  // Check if a specific chapter has been read by a specific reader
  const isChapterReadByReader = (bookKey: string, chapterNum: number, readerName: string): boolean => {
    return readProgress.some(p => 
      p.book_key === bookKey && 
      p.chapter_number === chapterNum &&
      p.reader_name === readerName &&
      p.is_read
    );
  };

  const groupedBooks = filteredBooks.reduce((acc, book) => {
    if (!acc[book.testament]) {
      acc[book.testament] = [];
    }
    acc[book.testament].push(book);
    return acc;
  }, {} as Record<string, Book[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2">Cargando datos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700">{error}</span>
          <button 
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          <span className="text-green-700">{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step 1: Select Book */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">1. Seleccionar Libro</h3>
          </div>

          {/* Book Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Buscar libro..."
              value={bookSearch}
              onChange={(e) => setBookSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {Object.entries(groupedBooks).map(([testament, testamentBooks]) => (
              testamentBooks.length > 0 && (
                <div key={testament}>
                  <h4 className="font-medium text-sm text-gray-600 mb-2 sticky top-0 bg-white">
                    {testament === 'old' ? 'Antiguo Testamento' : 'Nuevo Testamento'}
                  </h4>
                  <div className="space-y-1">
                    {testamentBooks.map((book) => (
                      <button
                        key={book.id}
                        onClick={() => {
                          setSelectedBook(book);
                          setSelectedChapter(null);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedBook?.id === book.id
                            ? 'bg-blue-600 text-white'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        {book.name}
                        <span className="text-xs opacity-75 ml-1">
                          ({book.total_chapters} cap.)
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )
            ))}
            
            {Object.keys(groupedBooks).length === 0 && (
              <p className="text-gray-500 text-center py-4">No se encontraron libros</p>
            )}
          </div>
        </div>

        {/* Step 2: Select Chapter */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold">2. Seleccionar Capítulo</h3>
          </div>

          {selectedBook ? (
            <div>
              <p className="text-sm text-gray-600 mb-3">
                Libro seleccionado: <strong>{selectedBook.name}</strong>
              </p>
              
              {/* Chapter Filter */}
              <div className="mb-4">
                <input
                  type="number"
                  placeholder="Filtrar por número de capítulo..."
                  value={chapterFilter}
                  onChange={(e) => setChapterFilter(e.target.value)}
                  min="1"
                  max={selectedBook.total_chapters}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div className="grid grid-cols-5 gap-2 max-h-80 overflow-y-auto">
                {filteredChapters.map((chapter) => (
                  <button
                    key={chapter.chapter_number}
                    onClick={() => setSelectedChapter(chapter.chapter_number)}
                    className={`p-2 rounded-lg text-sm font-medium transition-colors relative ${
                      selectedChapter === chapter.chapter_number
                        ? 'bg-green-600 text-white'
                        : chapter.has_progress
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                    title={chapter.has_progress ? 'Ya leído por alguien' : 'Sin leer'}
                  >
                    {chapter.chapter_number}
                    {chapter.has_progress && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>
              
              {filteredChapters.length === 0 && chapterFilter && (
                <p className="text-gray-500 text-center py-4">
                  No existe el capítulo {chapterFilter} en {selectedBook.name}
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              Primero selecciona un libro
            </p>
          )}
        </div>

        {/* Step 3: Select Reader and Submit */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold">3. Asignar Lector</h3>
          </div>

          {selectedBook && selectedChapter ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Capítulo: <strong>{selectedBook.name} {selectedChapter}</strong>
              </p>

              {/* Reader Search */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Buscar lector..."
                  value={readerSearch}
                  onChange={(e) => setReaderSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {filteredReaders.map((reader) => {
                  const hasReadChapter = isChapterReadByReader(selectedBook.key, selectedChapter, reader.name);
                  
                  return (
                    <button
                      key={reader.id}
                      onClick={() => setSelectedReader(reader)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                        selectedReader?.id === reader.id
                          ? 'bg-purple-600 text-white'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <span>{reader.name}</span>
                      {hasReadChapter && (
                        <CheckCircle2 className={`w-4 h-4 ${
                          selectedReader?.id === reader.id ? 'text-white' : 'text-green-600'
                        }`} title="Ya leyó este capítulo" />
                      )}
                    </button>
                  );
                })}
              </div>
              
              {filteredReaders.length === 0 && (
                <p className="text-gray-500 text-center py-4">No se encontraron lectores</p>
              )}

              {selectedReader && (
                <div className="pt-4 border-t">
                  <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-blue-900 mb-2">Resumen</h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      <div><strong>Libro:</strong> {selectedBook.name}</div>
                      <div><strong>Capítulo:</strong> {selectedChapter}</div>
                      <div><strong>Lector:</strong> {selectedReader.name}</div>
                      {isChapterReadByReader(selectedBook.key, selectedChapter, selectedReader.name) && (
                        <div className="flex items-center gap-2 text-orange-700 bg-orange-100 px-2 py-1 rounded">
                          <AlertCircle className="w-4 h-4" />
                          <span>Este lector ya leyó este capítulo</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Marcando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Marcar como Completado
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              Selecciona libro y capítulo primero
            </p>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Instrucciones:</h4>
        <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
          <li>Selecciona el libro bíblico de la lista</li>
          <li>Elige el número de capítulo</li>
          <li>Asigna el lector que completó la lectura</li>
          <li>Confirma para marcar todos los versículos como completados</li>
        </ol>
      </div>
    </div>
  );
};

export default ProgressManager;