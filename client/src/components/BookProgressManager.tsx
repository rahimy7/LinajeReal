// BookProgressManager.tsx - Componente mejorado para marcar capítulos
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, CheckCircle2, AlertCircle, RefreshCw, BookOpen, Calendar,
  Search, X, Plus, Minus, Send, ChevronDown, ChevronUp
} from 'lucide-react';

const API_BASE = process.env.NODE_ENV === 'production' 
  ? '/api/bible' 
  : 'http://localhost:5000/api/bible';

interface Reader {
  id: number;
  name: string;
  is_active: boolean;
  avatar_color?: string;
}

interface Chapter {
  chapter_number: number;
  has_progress: boolean;
  readers: string[];
  is_completed: boolean;
}

interface BookProgressManagerProps {
  book: {
    book_id: number;
    book_key: string;
    book_name: string;
    total_chapters: number;
    testament: string;
  };
  onProgressUpdate: () => void;
}

const BookProgressManager: React.FC<BookProgressManagerProps> = ({ book, onProgressUpdate }) => {
  const [readers, setReaders] = useState<Reader[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapters, setSelectedChapters] = useState<Set<number>>(new Set());
  const [selectedReader, setSelectedReader] = useState<Reader | null>(null);
  const [readProgress, setReadProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showUnmarkModal, setShowUnmarkModal] = useState(false);
const [unmarkingChapter, setUnmarkingChapter] = useState<{chapter: number, readers: string[]} | null>(null);
const [selectedReaderToUnmark, setSelectedReaderToUnmark] = useState<string>('');
  
  // Search states
  const [readerSearch, setReaderSearch] = useState('');
  const [chapterFilter, setChapterFilter] = useState('');
  const [showReaderDropdown, setShowReaderDropdown] = useState(false);
  const [isBatchMode, setIsBatchMode] = useState(true);

  useEffect(() => {
    loadData();
  }, [book]);

// Reemplazar la función loadData en BookProgressManager.tsx

const loadData = async () => {
  try {
    setLoading(true);
    setError(null);
    
    const [readersResponse, progressResponse] = await Promise.all([
      fetch(`${API_BASE}/readers`),
      fetch(`${API_BASE}/progress/all`)
    ]);

    if (readersResponse.ok) {
      const readersData = await readersResponse.json();
      setReaders(readersData.data.filter((r: Reader) => r.is_active));
    }

    if (progressResponse.ok) {
      const progressData = await progressResponse.json();
      console.log('Progress data received:', progressData); // Para debug
      
      // CORRECCIÓN: Los datos vienen directamente en data, no en data.recent_readings
      const allProgress = progressData.data || [];
      
      // Filtrar solo el progreso del libro actual
      const bookProgress = allProgress.filter((p: any) => 
        p.book_key === book.book_key || p.book === book.book_key
      );
      
      console.log('Book progress filtered:', bookProgress); // Para debug
      
      setReadProgress(allProgress); // Guardamos todo el progreso
      processChapters(bookProgress); // Procesamos solo el del libro actual
    }
  } catch (err) {
    setError('Error al cargar datos');
    console.error('Error loading data:', err);
  } finally {
    setLoading(false);
  }
};

// También actualizar la función processChapters para manejar mejor los datos
const processChapters = (progress: any[]) => {
  const chaptersData: Chapter[] = [];
  console.log('Processing chapters with progress:', progress); // Para debug

  for (let i = 1; i <= book.total_chapters; i++) {
    // Buscar si este capítulo tiene progreso
    const chapterProgress = progress.filter(p => {
      // Manejar diferentes formatos posibles de los datos
      return (p.chapter_number === i || p.chapter === i) && 
             (p.is_completed || p.is_read || p.completed_at);
    });
    
    // Obtener lista de lectores que han leído este capítulo
    const readers = chapterProgress
      .map(p => p.reader_name || p.reader)
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index); // Eliminar duplicados

    // Determinar si el capítulo está completado
    const isCompleted = chapterProgress.length > 0 && 
                       chapterProgress.some(p => 
                         p.is_completed === true || 
                         p.is_read === true || 
                         p.completed_at !== null
                       );

    chaptersData.push({
      chapter_number: i,
      has_progress: isCompleted,
      readers: readers,
      is_completed: isCompleted,
    });
  }

  console.log('Chapters processed:', chaptersData); // Para debug
  setChapters(chaptersData);
};

const handleUnmarkChapter = async (chapterNumber: number, readerName: string) => {
  try {
    const response = await fetch(`${API_BASE}/progress/chapter`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reader_name: readerName,
        book_key: book.book_key,
        chapter_number: chapterNumber
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al desmarcar capítulo');
    }

    // Actualizar datos
    setSuccess(`✅ Capítulo ${chapterNumber} desmarcado para ${readerName}`);
    await loadData();
    onProgressUpdate();
    
    // Cerrar modal
    setShowUnmarkModal(false);
    setUnmarkingChapter(null);
    setSelectedReaderToUnmark('');
    
    setTimeout(() => setSuccess(null), 3000);
  } catch (error) {
    setError(error instanceof Error ? error.message : 'Error al desmarcar capítulo');
  }
};

  // Filtered readers for search
  const filteredReaders = useMemo(() => {
    if (!readerSearch.trim()) return readers.slice(0, 10); // Show first 10 if no search
    
    return readers.filter(reader =>
      reader.name.toLowerCase().includes(readerSearch.toLowerCase())
    ).slice(0, 20); // Max 20 results
  }, [readers, readerSearch]);

  // Filtered chapters
  const filteredChapters = useMemo(() => {
    if (!chapterFilter) return chapters;
    
    const filterNum = parseInt(chapterFilter);
    if (isNaN(filterNum)) return chapters;
    
    return chapters.filter(chapter => 
      chapter.chapter_number === filterNum
    );
  }, [chapters, chapterFilter]);

  const handleChapterToggle = (chapterNumber: number) => {
    const newSelected = new Set(selectedChapters);
    if (newSelected.has(chapterNumber)) {
      newSelected.delete(chapterNumber);
    } else {
      newSelected.add(chapterNumber);
    }
    setSelectedChapters(newSelected);
  };

  const handleSelectRange = (start: number, end: number) => {
    const newSelected = new Set(selectedChapters);
    for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
      if (i <= book.total_chapters) {
        newSelected.add(i);
      }
    }
    setSelectedChapters(newSelected);
  };

  const handleClearSelection = () => {
    setSelectedChapters(new Set());
  };

  const handleSelectAll = () => {
    const allChapters = new Set<number>();
    for (let i = 1; i <= book.total_chapters; i++) {
      allChapters.add(i);
    }
    setSelectedChapters(allChapters);
  };

  const handleReaderSelect = (reader: Reader) => {
    setSelectedReader(reader);
    setShowReaderDropdown(false);
    setReaderSearch('');
  };

  const submitSingleChapter = async (chapterNumber: number, readerName: string) => {
    const response = await fetch(`${API_BASE}/progress/chapter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reader_name: readerName,
        book_key: book.book_key,
        chapter_number: chapterNumber,
        notes: `Marcado desde dashboard - ${book.book_name} ${chapterNumber} - ${new Date().toLocaleDateString()}`
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Error en capítulo ${chapterNumber}`);
    }

    return response.json();
  };

  const handleSubmit = async () => {
    if (selectedChapters.size === 0 || !selectedReader) {
      setError('Por favor selecciona al menos un capítulo y un lector');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const chaptersArray = Array.from(selectedChapters).sort((a, b) => a - b);
    const totalChapters = chaptersArray.length;
    let successCount = 0;
    const errors: string[] = [];

    try {
      if (isBatchMode && totalChapters > 1) {
        // Batch mode - submit all at once with delay between requests
        for (let i = 0; i < chaptersArray.length; i++) {
          try {
            await submitSingleChapter(chaptersArray[i], selectedReader.name);
            successCount++;
            
            // Small delay between requests to avoid overwhelming server
            if (i < chaptersArray.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          } catch (err) {
            errors.push(`Capítulo ${chaptersArray[i]}: ${err instanceof Error ? err.message : 'Error desconocido'}`);
          }
        }
      } else {
        // Single mode - submit one by one with user feedback
        for (const chapterNumber of chaptersArray) {
          try {
            await submitSingleChapter(chapterNumber, selectedReader.name);
            successCount++;
          } catch (err) {
            errors.push(`Capítulo ${chapterNumber}: ${err instanceof Error ? err.message : 'Error desconocido'}`);
          }
        }
      }

      // Show results
      if (successCount > 0) {
        setSuccess(
          `✅ ${successCount} capítulo${successCount !== 1 ? 's' : ''} marcado${successCount !== 1 ? 's' : ''} para ${selectedReader.name}` +
          (successCount < totalChapters ? ` (${totalChapters - successCount} fallaron)` : '')
        );
        
        // Clear selection and refresh data
        setSelectedChapters(new Set());
        onProgressUpdate();
        await loadData();
        
        setTimeout(() => setSuccess(null), 5000);
      }

      if (errors.length > 0) {
        setError(`Errores: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}`);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido durante el envío');
    } finally {
      setSubmitting(false);
    }
  };

  const completedChapters = chapters.filter(c => c.has_progress).length;
  const completionPercentage = (completedChapters / book.total_chapters) * 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2">Cargando datos del libro...</span>
      </div>
    );
  }
  const UnmarkModal = () => {
  if (!showUnmarkModal || !unmarkingChapter) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Desmarcar Capítulo {unmarkingChapter.chapter}
          </h3>
          <button
            onClick={() => {
              setShowUnmarkModal(false);
              setUnmarkingChapter(null);
              setSelectedReaderToUnmark('');
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-3">
            Este capítulo fue marcado como leído por:
          </p>
          <div className="space-y-2">
            {unmarkingChapter.readers.map((reader) => (
              <label key={reader} className="flex items-center p-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="reader"
                  value={reader}
                  checked={selectedReaderToUnmark === reader}
                  onChange={(e) => setSelectedReaderToUnmark(e.target.value)}
                  className="mr-3"
                />
                <span className="text-gray-900">{reader}</span>
              </label>
            ))}
          </div>
        </div>
        
        {unmarkingChapter.readers.length > 1 && (
          <p className="text-xs text-amber-600 mb-4">
            ⚠️ Solo se desmarcará para el lector seleccionado. Los demás mantendrán su progreso.
          </p>
        )}
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => {
              setShowUnmarkModal(false);
              setUnmarkingChapter(null);
              setSelectedReaderToUnmark('');
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              if (selectedReaderToUnmark) {
                handleUnmarkChapter(unmarkingChapter.chapter, selectedReaderToUnmark);
              }
            }}
            disabled={!selectedReaderToUnmark}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Desmarcar
          </button>
        </div>
      </div>
    </div>
  );
};


  return (
    <div className="space-y-6">
      {/* Book Info Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">{book.book_name}</h2>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              {book.testament === 'old' ? 'Antiguo Testamento' : 'Nuevo Testamento'} • 
              {book.total_chapters} capítulos
            </p>
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="font-medium text-gray-700">Progreso: </span>
                <span className="font-bold text-blue-600">{completedChapters}/{book.total_chapters}</span>
                <span className="text-gray-500 ml-1">({completionPercentage.toFixed(1)}%)</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="w-16 h-16 rounded-full border-4 border-blue-200 flex items-center justify-center">
              <span className="text-lg font-bold text-blue-600">{completionPercentage.toFixed(0)}%</span>
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(completionPercentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chapters Selection */}
        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold">Seleccionar Capítulos</h3>
            <div className="ml-auto text-sm text-gray-500">
              {selectedChapters.size} seleccionados
            </div>
          </div>

          {/* Chapter Controls */}
          <div className="mb-4 space-y-3">
            <input
              type="number"
              placeholder="Filtrar por número de capítulo..."
              value={chapterFilter}
              onChange={(e) => setChapterFilter(e.target.value)}
              min="1"
              max={book.total_chapters}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleSelectAll}
                className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200"
              >
                Seleccionar Todos
              </button>
              <button
                onClick={handleClearSelection}
                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
              >
                Limpiar Selección
              </button>
              <button
                onClick={() => handleSelectRange(1, 10)}
                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200"
              >
                1-10
              </button>
            </div>
          </div>
          
          {/* Chapters Grid */}
          <div className="grid grid-cols-6 gap-2">
          {filteredChapters.map((chapter) => (
  <button
    key={chapter.chapter_number}
    onClick={() => {
      if (chapter.has_progress && !selectedChapters.has(chapter.chapter_number)) {
        // Si está marcado como leído y no está seleccionado, mostrar modal para desmarcar
        setUnmarkingChapter({ 
          chapter: chapter.chapter_number, 
          readers: chapter.readers 
        });
        setShowUnmarkModal(true);
      } else {
        // Comportamiento normal de selección
        handleChapterToggle(chapter.chapter_number);
      }
    }}
    onContextMenu={(e) => {
      e.preventDefault();
      // Click derecho para desmarcar directamente
      if (chapter.has_progress) {
        setUnmarkingChapter({ 
          chapter: chapter.chapter_number, 
          readers: chapter.readers 
        });
        setShowUnmarkModal(true);
      }
    }}
    className={`p-2 rounded-lg text-sm font-medium transition-colors relative ${
      selectedChapters.has(chapter.chapter_number)
        ? 'bg-green-600 text-white ring-2 ring-green-300'
        : chapter.has_progress
          ? 'bg-green-100 text-green-800 hover:bg-green-200'
          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
    }`}
    title={
      chapter.has_progress 
        ? `Leído por: ${chapter.readers.join(', ')}\n(Click para desmarcar)` 
        : 'Sin leer\n(Click para seleccionar)'
    }
  >
    {chapter.chapter_number}
    {chapter.has_progress && (
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white"></div>
    )}
    {chapter.readers.length > 1 && (
      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center border border-white">
        {chapter.readers.length}
      </div>
    )}
  </button>
))}
          </div>
          
          {filteredChapters.length === 0 && chapterFilter && (
            <p className="text-gray-500 text-center py-4">
              No existe el capítulo {chapterFilter} en {book.book_name}
            </p>
          )}

          {selectedChapters.size > 0 && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-800">
                <strong>Capítulos seleccionados:</strong> {Array.from(selectedChapters).sort((a, b) => a - b).join(', ')}
              </p>
            </div>
          )}
        </div>

        {/* Reader Selection */}
        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold">Asignar Lector</h3>
          </div>

          {/* Reader Search */}
          <div className="relative mb-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar lector por nombre..."
                value={selectedReader ? selectedReader.name : readerSearch}
                onChange={(e) => {
                  if (selectedReader) {
                    setSelectedReader(null);
                  }
                  setReaderSearch(e.target.value);
                  setShowReaderDropdown(true);
                }}
                onFocus={() => setShowReaderDropdown(true)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              {selectedReader && (
                <button
                  onClick={() => {
                    setSelectedReader(null);
                    setReaderSearch('');
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Dropdown */}
            {showReaderDropdown && !selectedReader && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredReaders.length > 0 ? (
                  filteredReaders.map((reader) => (
                    <button
                      key={reader.id}
                      onClick={() => handleReaderSelect(reader)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white"
                        style={{ backgroundColor: reader.avatar_color || '#6366f1' }}
                      >
                        {reader.name.charAt(0).toUpperCase()}
                      </div>
                      <span>{reader.name}</span>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-2 text-gray-500">
                    {readerSearch ? 'No se encontraron lectores' : 'Escribe para buscar...'}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Click outside to close dropdown */}
          {showReaderDropdown && (
            <div
              className="fixed inset-0 z-5"
              onClick={() => setShowReaderDropdown(false)}
            />
          )}

          {/* Selected Reader & Submit */}
          {selectedReader && (
            <div className="space-y-4">
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium"
                    style={{ backgroundColor: selectedReader.avatar_color || '#6366f1' }}
                  >
                    {selectedReader.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-purple-900">{selectedReader.name}</span>
                </div>
                
                {selectedChapters.size > 0 && (
                  <div className="text-sm text-purple-800">
                    <div><strong>Libro:</strong> {book.book_name}</div>
                    <div><strong>Capítulos:</strong> {selectedChapters.size} seleccionados</div>
                  </div>
                )}
              </div>

              {/* Batch Mode Toggle */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isBatchMode}
                    onChange={(e) => setIsBatchMode(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Modo lote (más rápido)</span>
                </label>
                <div className="text-xs text-gray-500">
                  {selectedChapters.size} capítulo{selectedChapters.size !== 1 ? 's' : ''}
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || selectedChapters.size === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Marcar {selectedChapters.size} Capítulo{selectedChapters.size !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          )}

          {selectedChapters.size > 0 && !selectedReader && (
            <p className="text-gray-500 text-center py-8">
              Selecciona un lector para continuar
            </p>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white border rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Leyenda</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 rounded"></div>
            <span>Sin leer</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 rounded relative">
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
            <span>Ya leído</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-600 rounded"></div>
            <span>Seleccionado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 rounded relative">
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">2</div>
            </div>
            <span>Múltiples lectores</span>
          </div>
        </div>
      </div>
      {UnmarkModal()}
    </div>
  );
};

export default BookProgressManager;