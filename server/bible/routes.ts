// server/bible/routes.ts - Rutas actualizadas para nueva estructura
import { Router, Request, Response, NextFunction } from 'express';
import { BibleModel } from './models';

const router = Router();

// Middleware para manejo de errores async
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Helper para respuestas consistentes
const sendResponse = (res: Response, data: any, message: string = 'Éxito', statusCode: number = 200) => {
  res.status(statusCode).json({
    success: statusCode < 400,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

// ==================== RUTAS DE LIBROS ====================
router.get('/books', asyncHandler(async (req: Request, res: Response) => {
  const { testament } = req.query;
  const books = await BibleModel.getAllBooks(testament as string);
  sendResponse(res, books, 'Libros bíblicos obtenidos exitosamente');
}));

router.get('/books/:bookKey', asyncHandler(async (req: Request, res: Response) => {
  const { bookKey } = req.params;
  const book = await BibleModel.getBookByKey(bookKey);
  
  if (!book) {
    return sendResponse(res, null, 'Libro no encontrado', 404);
  }
  
  sendResponse(res, book, 'Libro obtenido exitosamente');
}));

router.get('/books/:bookKey/chapters/:chapterNum', asyncHandler(async (req: Request, res: Response) => {
  const { bookKey, chapterNum } = req.params;
  const chapter = await BibleModel.getChapterWithDetails(bookKey, parseInt(chapterNum));
  
  if (!chapter) {
    return sendResponse(res, null, 'Capítulo no encontrado', 404);
  }
  
  sendResponse(res, chapter, 'Capítulo obtenido exitosamente');
}));

router.get('/books/:bookKey/readings', asyncHandler(async (req: Request, res: Response) => {
  const { bookKey } = req.params;
  const readings = await BibleModel.getChapterReadingsByBook(bookKey);
  sendResponse(res, readings, `Lecturas del libro ${bookKey} obtenidas exitosamente`);
}));

// ==================== RUTAS DE LECTORES ====================
router.get('/readers', asyncHandler(async (req: Request, res: Response) => {
  const readers = await BibleModel.getReaders();
  sendResponse(res, readers, 'Lectores obtenidos exitosamente');
}));

router.post('/readers', asyncHandler(async (req: Request, res: Response) => {
  const { name, email, avatar_color, is_active, reading_speed_wpm } = req.body;
  
  if (!name || name.trim().length === 0) {
    return sendResponse(res, null, 'El nombre del lector es requerido', 400);
  }
  
  const reader = await BibleModel.createReader({
    name: name.trim(),
    email: email ? email.trim() : undefined,
    avatar_color,
    is_active,
    reading_speed_wpm
  });
  
  sendResponse(res, reader, 'Lector creado exitosamente', 201);
}));

router.put('/readers/:readerId', asyncHandler(async (req: Request, res: Response) => {
  const { readerId } = req.params;
  const { name, email, avatar_color, is_active, reading_speed_wpm } = req.body;
  
  if (!readerId || isNaN(parseInt(readerId))) {
    return sendResponse(res, null, 'ID de lector inválido', 400);
  }
  
  const reader = await BibleModel.updateReader(parseInt(readerId), {
    name: name ? name.trim() : undefined,
    email: email ? email.trim() : undefined,
    avatar_color,
    is_active,
    reading_speed_wpm
  });
  
  if (!reader) {
    return sendResponse(res, null, 'Lector no encontrado', 404);
  }
  
  sendResponse(res, reader, 'Lector actualizado exitosamente');
}));

router.get('/readers/:readerId/progress', asyncHandler(async (req: Request, res: Response) => {
  const { readerId } = req.params;
  
  if (!readerId || isNaN(parseInt(readerId))) {
    return sendResponse(res, null, 'ID de lector inválido', 400);
  }
  
  const progress = await BibleModel.getChapterReadings(undefined, parseInt(readerId));
  sendResponse(res, progress, `Progreso del lector obtenido exitosamente`);
}));

// ==================== RUTAS DE CAPÍTULOS Y LECTURAS ====================
router.post('/chapters/:chapterId/mark-read', asyncHandler(async (req: Request, res: Response) => {
  const { chapterId } = req.params;
  const { reader_id, notes, duration_minutes } = req.body;
  
  if (!chapterId || isNaN(parseInt(chapterId))) {
    return sendResponse(res, null, 'ID de capítulo inválido', 400);
  }
  
  if (!reader_id || isNaN(parseInt(reader_id))) {
    return sendResponse(res, null, 'ID de lector es requerido', 400);
  }
  
  const success = await BibleModel.markChapterAsRead(
    parseInt(chapterId),
    parseInt(reader_id),
    notes,
    duration_minutes ? parseInt(duration_minutes) : undefined
  );
  
  if (success) {
    sendResponse(res, { success: true }, 'Capítulo marcado como leído exitosamente');
  } else {
    sendResponse(res, { success: false }, 'Error al marcar capítulo como leído', 400);
  }
}));

router.post('/chapters/mark-read-by-reference', asyncHandler(async (req: Request, res: Response) => {
  const { book_key, chapter_number, reader_id, reader_name, notes, duration_minutes } = req.body;
  
  if (!book_key || !chapter_number) {
    return sendResponse(res, null, 'book_key y chapter_number son requeridos', 400);
  }
  
  let finalReaderId = reader_id;
  
  // Si se proporciona reader_name en lugar de reader_id, buscar el lector
  if (!finalReaderId && reader_name) {
    const reader = await BibleModel.getReaderByName(reader_name);
    if (!reader) {
      return sendResponse(res, null, `Lector "${reader_name}" no encontrado`, 404);
    }
    finalReaderId = reader.id;
  }
  
  if (!finalReaderId) {
    return sendResponse(res, null, 'reader_id o reader_name es requerido', 400);
  }
  
  // Validar que el capítulo existe
  const exists = await BibleModel.validateChapterExists(book_key, parseInt(chapter_number));
  if (!exists) {
    return sendResponse(res, null, `Capítulo ${book_key} ${chapter_number} no encontrado`, 404);
  }
  
  const success = await BibleModel.markChapterAsReadByBookKey(
    book_key,
    parseInt(chapter_number),
    parseInt(finalReaderId),
    notes,
    duration_minutes ? parseInt(duration_minutes) : undefined
  );
  
  if (success) {
    sendResponse(res, { success: true }, `Capítulo ${book_key} ${chapter_number} marcado como leído exitosamente`);
  } else {
    sendResponse(res, { success: false }, 'Error al marcar capítulo como leído', 400);
  }
}));

router.post('/chapters/bulk-mark', asyncHandler(async (req: Request, res: Response) => {
  const { reader_name, book_key, from_chapter, to_chapter } = req.body;
  
  if (!reader_name || !book_key || !from_chapter || !to_chapter) {
    return sendResponse(res, null, 'reader_name, book_key, from_chapter y to_chapter son requeridos', 400);
  }
  
  if (from_chapter > to_chapter) {
    return sendResponse(res, null, 'from_chapter debe ser menor o igual a to_chapter', 400);
  }
  
  const result = await BibleModel.bulkMarkChapters(
    reader_name,
    book_key,
    parseInt(from_chapter),
    parseInt(to_chapter)
  );
  
  sendResponse(res, result, `Marcado masivo completado: ${result.marked}/${result.requested} capítulos`);
}));

router.get('/chapters/:chapterId/readings', asyncHandler(async (req: Request, res: Response) => {
  const { chapterId } = req.params;
  
  if (!chapterId || isNaN(parseInt(chapterId))) {
    return sendResponse(res, null, 'ID de capítulo inválido', 400);
  }
  
  const readings = await BibleModel.getChapterReadings(parseInt(chapterId));
  sendResponse(res, readings, 'Lecturas del capítulo obtenidas exitosamente');
}));

router.delete('/chapters/:chapterId/reset', asyncHandler(async (req: Request, res: Response) => {
  const { chapterId } = req.params;
  
  if (!chapterId || isNaN(parseInt(chapterId))) {
    return sendResponse(res, null, 'ID de capítulo inválido', 400);
  }
  
  const success = await BibleModel.resetChapterProgress(parseInt(chapterId));
  
  if (success) {
    sendResponse(res, { success: true }, 'Progreso del capítulo reseteado exitosamente');
  } else {
    sendResponse(res, { success: false }, 'Error al resetear progreso del capítulo', 400);
  }
}));

// ==================== RUTAS DE ESTADÍSTICAS ====================
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  const stats = await BibleModel.getCompleteStats();
  sendResponse(res, stats, 'Estadísticas obtenidas exitosamente');
}));

router.get('/stats/marathon', asyncHandler(async (req: Request, res: Response) => {
  const progress = await BibleModel.getMarathonProgress();
  sendResponse(res, progress, 'Progreso del maratón obtenido exitosamente');
}));

// ==================== RUTAS DE CONFIGURACIÓN DEL MARATÓN ====================
router.get('/marathon/config', asyncHandler(async (req: Request, res: Response) => {
  const config = await BibleModel.getMarathonConfig();
  sendResponse(res, config, 'Configuración del maratón obtenida exitosamente');
}));

router.put('/marathon/config', asyncHandler(async (req: Request, res: Response) => {
  const { name, start_time, end_time, is_active, description } = req.body;
  
  const config = await BibleModel.updateMarathonConfig({
    name,
    start_time: start_time ? new Date(start_time) : undefined,
    end_time: end_time ? new Date(end_time) : undefined,
    is_active,
    description
  });
  
  sendResponse(res, config, 'Configuración del maratón actualizada exitosamente');
}));

// ==================== RUTAS PARA BIBLIA INTERACTIVA ====================
router.get('/reports/last-read-chapter', asyncHandler(async (req: Request, res: Response) => {
  const lastChapter = await BibleModel.getLastReadChapter();
  sendResponse(res, lastChapter, 'Último capítulo leído obtenido');
}));

router.get('/available-books', asyncHandler(async (req: Request, res: Response) => {
  const availableBooks = await BibleModel.getAvailableBooks();
  sendResponse(res, availableBooks, 'Libros disponibles obtenidos');
}));

router.get('/progress/all', asyncHandler(async (req: Request, res: Response) => {
  const allProgress = await BibleModel.getChapterReadings();
  sendResponse(res, allProgress, 'Todo el progreso de lectura obtenido');
}));

router.get('/progress/chapter/:bookKey/:chapterNum', asyncHandler(async (req: Request, res: Response) => {
  const { bookKey, chapterNum } = req.params;
  
  // Para mantener compatibilidad, devolvemos el detalle del capítulo
  const chapterDetails = await BibleModel.getChapterWithDetails(bookKey, parseInt(chapterNum));
  
  if (!chapterDetails) {
    return sendResponse(res, [], `Capítulo ${bookKey} ${chapterNum} no encontrado`);
  }
  
  // Formato compatible con el frontend existente
  const progress = [{
    book_key: bookKey,
    book_name: chapterDetails.book.name,
    chapter_number: parseInt(chapterNum),
    is_read: chapterDetails.chapter.is_completed,
    reader_name: chapterDetails.chapter.read_by_reader,
    read_at: chapterDetails.chapter.completed_at,
    notes: chapterDetails.chapter.reading_notes
  }];
  
  sendResponse(res, progress, `Progreso del capítulo ${bookKey} ${chapterNum} obtenido`);
}));

// ==================== RUTAS DE BÚSQUEDA (MANTENIDAS PARA COMPATIBILIDAD) ====================
router.get('/search', asyncHandler(async (req: Request, res: Response) => {
  const { q, testament, limit = 50 } = req.query;
  
  if (!q || (q as string).trim().length < 3) {
    return sendResponse(res, [], 'La consulta debe tener al menos 3 caracteres', 400);
  }
  
  // Por ahora devuelve array vacío ya que eliminamos la tabla verses
  sendResponse(res, [], 'Búsqueda no disponible sin tabla verses');
}));

// ==================== RUTAS DE REPORTES TIEMPO REAL ====================
router.get('/reports/realtime/stats', asyncHandler(async (req: Request, res: Response) => {
  const realtimeStats = await BibleModel.getMarathonProgress();
  sendResponse(res, realtimeStats, 'Estadísticas en tiempo real obtenidas');
}));

router.get('/reports/recent-readings', asyncHandler(async (req: Request, res: Response) => {
  const { limit = 10 } = req.query;
  
  const recentReadings = await BibleModel.getChapterReadings();
  const limitedReadings = recentReadings.slice(0, parseInt(limit as string));
  
  sendResponse(res, limitedReadings, 'Lecturas recientes obtenidas');
}));

// ==================== MIDDLEWARE DE MANEJO DE ERRORES ====================
router.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ [Bible API] Error:', error);
  
  const status = error.status || error.statusCode || 500;
  const message = error.message || 'Error interno del servidor';
  
  res.status(status).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    timestamp: new Date().toISOString()
  });
});

export default router;