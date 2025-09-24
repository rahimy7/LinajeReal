import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Book, Users, BarChart3, Search, User, Settings, Heart, Bookmark, Clock, CheckCircle2 } from 'lucide-react';

// API Configuration
const API_BASE = 'http://localhost:5000/api/bible';

// Types
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

interface Chapter {
  id: number;
  number: number;
  total_verses: number;
  estimated_reading_time: number;
}

interface Verse {
  id: number;
  number: number;
  text: string;
  word_count: number;
}

interface ChapterData {
  book: {
    id: number;
    name: string;
    key: string;
    testament: string;
    description?: string;
  };
  chapter: Chapter;
  verses: Verse[];
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

// API Functions
const api = {
  async getBooks(): Promise<Book[]> {
    const response = await fetch(`${API_BASE}/books`);
    const data = await response.json();
    return data.data;
  },

  async getChapter(bookKey: string, chapterNumber: number): Promise<ChapterData> {
    const response = await fetch(`${API_BASE}/books/${bookKey}/chapters/${chapterNumber}`);
    const data = await response.json();
    return data.data;
  },

  async getReaders(): Promise<Reader[]> {
    const response = await fetch(`${API_BASE}/readers`);
    const data = await response.json();
    return data.data;
  },

  async getStats(): Promise<Stats> {
    const response = await fetch(`${API_BASE}/stats`);
    const data = await response.json();
    return data.data;
  },

  async markVerseAsRead(readerId: number, verseId: number): Promise<void> {
    await fetch(`${API_BASE}/readers/${readerId}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verse_id: verseId, is_read: true })
    });
  },

  async searchVerses(query: string, testament?: string): Promise<any[]> {
    const params = new URLSearchParams({ q: query });
    if (testament) params.append('testament', testament);
    
    const response = await fetch(`${API_BASE}/search?${params}`);
    const data = await response.json();
    return data.data;
  }
};

// Main Component
export default function BibliaInteractiva() {
  const [currentView, setCurrentView] = useState('home');
  const [books, setBooks] = useState<Book[]>([]);
  const [readers, setReaders] = useState<Reader[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [currentChapter, setCurrentChapter] = useState<ChapterData | null>(null);
  const [currentChapterNumber, setCurrentChapterNumber] = useState(1);
  const [currentReader, setCurrentReader] = useState<Reader | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [booksData, readersData, statsData] = await Promise.all([
        api.getBooks(),
        api.getReaders(),
        api.getStats()
      ]);
      
      setBooks(booksData);
      setReaders(readersData);
      setStats(statsData);
      
      if (readersData.length > 0) {
        setCurrentReader(readersData[0]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadChapter = async (book: Book, chapterNumber: number) => {
    setLoading(true);
    try {
      const chapterData = await api.getChapter(book.key, chapterNumber);
      setCurrentChapter(chapterData);
      setSelectedBook(book);
      setCurrentChapterNumber(chapterNumber);
      setCurrentView('reading');
    } catch (error) {
      console.error('Error loading chapter:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const results = await api.searchVerses(searchQuery);
      setSearchResults(results);
      setCurrentView('search');
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const markVerseAsRead = async (verseId: number) => {
    if (!currentReader) return;
    
    try {
      await api.markVerseAsRead(currentReader.id, verseId);
      // Refresh stats
      const newStats = await api.getStats();
      setStats(newStats);
    } catch (error) {
      console.error('Error marking verse:', error);
    }
  };

  const navigateChapter = (direction: 'prev' | 'next') => {
    if (!selectedBook) return;
    
    let newChapter = currentChapterNumber;
    if (direction === 'prev' && currentChapterNumber > 1) {
      newChapter = currentChapterNumber - 1;
    } else if (direction === 'next' && currentChapterNumber < selectedBook.total_chapters) {
      newChapter = currentChapterNumber + 1;
    }
    
    if (newChapter !== currentChapterNumber) {
      loadChapter(selectedBook, newChapter);
    }
  };

  // Home View
  const HomeView = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-lg">
        <h1 className="text-4xl font-bold mb-2">Biblia Interactiva</h1>
        <p className="text-xl opacity-90">Linaje Real - Maratón Bíblico 2025</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Libros</p>
                <p className="text-2xl font-bold">{stats.general.total_books}</p>
              </div>
              <Book className="text-blue-500 w-8 h-8" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Lectores</p>
                <p className="text-2xl font-bold">{stats.general.total_readers}</p>
              </div>
              <Users className="text-green-500 w-8 h-8" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Versículos Leídos</p>
                <p className="text-2xl font-bold">{stats.general.total_verses_read}</p>
              </div>
              <CheckCircle2 className="text-purple-500 w-8 h-8" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Progreso</p>
                <p className="text-2xl font-bold">
                  {Math.round((stats.general.total_verses_read / stats.general.total_verses) * 100)}%
                </p>
              </div>
              <BarChart3 className="text-orange-500 w-8 h-8" />
            </div>
          </div>
        </div>
      )}

      {/* Books Grid */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Libros de la Biblia</h2>
        
        {/* Antiguo Testamento */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 text-blue-600">Antiguo Testamento</h3>
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-3">
            {books.filter(book => book.testament === 'old').map(book => (
              <button
                key={book.id}
                onClick={() => loadChapter(book, 1)}
                className="text-left p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                <h4 className="font-semibold">{book.name}</h4>
                <p className="text-sm text-gray-600">{book.total_chapters} capítulos</p>
                {book.author && <p className="text-xs text-gray-500">{book.author}</p>}
              </button>
            ))}
          </div>
        </div>

        {/* Nuevo Testamento */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-purple-600">Nuevo Testamento</h3>
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-3">
            {books.filter(book => book.testament === 'new').map(book => (
              <button
                key={book.id}
                onClick={() => loadChapter(book, 1)}
                className="text-left p-4 border rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors"
              >
                <h4 className="font-semibold">{book.name}</h4>
                <p className="text-sm text-gray-600">{book.total_chapters} capítulos</p>
                {book.author && <p className="text-xs text-gray-500">{book.author}</p>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active Readers */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Lectores Activos</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {readers.map(reader => (
            <div key={reader.id} className="flex items-center p-4 border rounded-lg">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold mr-3"
                style={{ backgroundColor: reader.avatar_color }}
              >
                {reader.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold">{reader.name}</h3>
                <p className="text-sm text-gray-600">
                  {reader.chapters_read || 0} capítulos • {reader.verses_read || 0} versículos
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Reading View
  const ReadingView = () => {
    if (!currentChapter || !selectedBook) return null;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-white p-6 rounded-lg shadow-md">
          <div>
            <h1 className="text-2xl font-bold">{currentChapter.book.name} {currentChapter.chapter.number}</h1>
            <p className="text-gray-600">{currentChapter.book.description}</p>
            <div className="flex items-center mt-2 text-sm text-gray-500">
              <Clock className="w-4 h-4 mr-1" />
              {currentChapter.chapter.estimated_reading_time} min lectura
            </div>
          </div>
          <button
            onClick={() => setCurrentView('home')}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Volver
          </button>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-md">
          <button
            onClick={() => navigateChapter('prev')}
            disabled={currentChapterNumber === 1}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Anterior
          </button>
          
          <div className="text-center">
            <span className="text-lg font-semibold">
              Capítulo {currentChapterNumber} de {selectedBook.total_chapters}
            </span>
          </div>
          
          <button
            onClick={() => navigateChapter('next')}
            disabled={currentChapterNumber === selectedBook.total_chapters}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
          >
            Siguiente
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>

        {/* Verses */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="space-y-4">
            {currentChapter.verses.map(verse => (
              <div key={verse.id} className="flex group">
                <button
                  onClick={() => markVerseAsRead(verse.id)}
                  className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-blue-300 text-blue-600 font-semibold text-sm mr-4 mt-1 hover:bg-blue-50 transition-colors"
                >
                  {verse.number}
                </button>
                <p className="text-lg leading-relaxed group-hover:bg-yellow-50 transition-colors p-2 rounded">
                  {verse.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Search View
  const SearchView = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Resultados de Búsqueda</h2>
        <p className="text-gray-600 mb-4">"{searchQuery}" - {searchResults.length} resultados</p>
        
        <div className="space-y-4">
          {searchResults.map((result, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-blue-600">
                  {result.book_name} {result.chapter_number}:{result.verse_number}
                </h3>
                <button
                  onClick={() => {
                    const book = books.find(b => b.name === result.book_name);
                    if (book) loadChapter(book, result.chapter_number);
                  }}
                  className="text-sm text-blue-500 hover:text-blue-700"
                >
                  Ir al capítulo
                </button>
              </div>
              <p className="text-gray-800">{result.text}</p>
            </div>
          ))}
        </div>
        
        <button
          onClick={() => setCurrentView('home')}
          className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-md p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCurrentView('home')}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                currentView === 'home' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
              }`}
            >
              <Book className="w-5 h-5 mr-2" />
              Inicio
            </button>
            
            <button
              onClick={() => setCurrentView('readers')}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                currentView === 'readers' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
              }`}
            >
              <Users className="w-5 h-5 mr-2" />
              Lectores
            </button>
          </div>

          {/* Search */}
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar versículos..."
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              disabled={loading || !searchQuery.trim()}
              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* Current Reader */}
          {currentReader && (
            <div className="flex items-center">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-2"
                style={{ backgroundColor: currentReader.avatar_color }}
              >
                {currentReader.name.charAt(0)}
              </div>
              <select
                value={currentReader.id}
                onChange={(e) => {
                  const reader = readers.find(r => r.id === parseInt(e.target.value));
                  if (reader) setCurrentReader(reader);
                }}
                className="border rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {readers.map(reader => (
                  <option key={reader.id} value={reader.id}>{reader.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6">
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Cargando...</p>
          </div>
        )}

        {!loading && (
          <>
            {currentView === 'home' && <HomeView />}
            {currentView === 'reading' && <ReadingView />}
            {currentView === 'search' && <SearchView />}
            {currentView === 'readers' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold mb-6">Estadísticas de Lectores</h2>
                {stats && (
                  <div className="space-y-4">
                    {stats.readers.map(reader => (
                      <div key={reader.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center">
                          <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold mr-4"
                            style={{ backgroundColor: reader.avatar_color }}
                          >
                            {reader.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-semibold">{reader.name}</h3>
                            <p className="text-sm text-gray-600">
                              Velocidad: {reader.reading_speed_wpm} palabras/min
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{reader.chapters_read || 0} capítulos</p>
                          <p className="text-sm text-gray-600">{reader.verses_read || 0} versículos</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}