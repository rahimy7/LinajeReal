// server/bible/routes.ts - Versión final corregida
import { Router, Request, Response, NextFunction } from 'express';
import { BibleModel } from './models';
import sql from './db';

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
  const chapter = await BibleModel.getChapterWithVerses(bookKey, parseInt(chapterNum));
  
  if (!chapter) {
    return sendResponse(res, null, 'Capítulo no encontrado', 404);
  }
  
  sendResponse(res, chapter, 'Capítulo obtenido exitosamente');
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
  
  sendResponse(res, reader, 'Lector actualizado exitosamente');
}));

router.delete('/readers/:readerId', asyncHandler(async (req: Request, res: Response) => {
  const { readerId } = req.params;
  
  if (!readerId || isNaN(parseInt(readerId))) {
    return sendResponse(res, null, 'ID de lector inválido', 400);
  }
  
  await BibleModel.deleteReader(parseInt(readerId));
  sendResponse(res, null, 'Lector eliminado exitosamente');
}));

router.get('/readers/search/:name', asyncHandler(async (req: Request, res: Response) => {
  const { name } = req.params;
  
  const readers = await sql`
    SELECT id, name, email, avatar_color, is_active
    FROM readers 
    WHERE name ILIKE ${'%' + name.trim() + '%'} 
    ORDER BY 
      CASE WHEN name ILIKE ${name.trim()} THEN 0 ELSE 1 END,
      name
    LIMIT 10
  `;
  
  sendResponse(res, readers, `${readers.length} lectores encontrados`);
}));

// ==================== RUTAS DE PROGRESO ====================
router.post('/progress', asyncHandler(async (req: Request, res: Response) => {
  const { reader_id, verse_id, is_read = true, notes } = req.body;
  
  if (!reader_id || !verse_id) {
    return sendResponse(res, null, 'reader_id y verse_id son requeridos', 400);
  }
  
  const progress = await BibleModel.markVerseAsRead(
    parseInt(reader_id), 
    parseInt(verse_id), 
    is_read,
    notes
  );
  
  sendResponse(res, progress, 'Progreso actualizado exitosamente');
}));

// POST /api/bible/progress/chapter - Marcar capítulo completo como leído
router.post('/progress/chapter', asyncHandler(async (req: Request, res: Response) => {
  const { reader_name, book_key, chapter_number, notes } = req.body;
  
  if (!reader_name || !book_key || !chapter_number) {
    return sendResponse(res, null, 'reader_name, book_key y chapter_number son requeridos', 400);
  }
  
  try {
    // 1. Buscar el lector por nombre
    const readerResult = await sql`
      SELECT id FROM readers WHERE name ILIKE ${reader_name.trim()} AND is_active = true LIMIT 1
    `;
    
    if (readerResult.length === 0) {
      return sendResponse(res, null, `Lector "${reader_name}" no encontrado o inactivo`, 404);
    }
    
    const readerId = readerResult[0].id;
    
    // 2. Obtener todos los versículos del capítulo
    const versesResult = await sql`
      SELECT v.id, v.verse_number, c.id as chapter_id, b.id as book_id
      FROM verses v
      JOIN chapters c ON v.chapter_id = c.id
      JOIN books b ON c.book_id = b.id
      WHERE b.key = ${book_key} AND c.chapter_number = ${parseInt(chapter_number)}
      ORDER BY v.verse_number
    `;
    
    if (versesResult.length === 0) {
      return sendResponse(res, null, `Capítulo ${book_key} ${chapter_number} no encontrado`, 404);
    }
    
    // 3. Marcar todos los versículos como leídos
    const currentTime = new Date().toISOString();
    const progressPromises = versesResult.map(verse => 
      sql`
        INSERT INTO reading_progress (reader_id, verse_id, chapter_id, book_id, is_read, read_at, notes)
        VALUES (
          ${readerId}, 
          ${verse.id}, 
          ${verse.chapter_id}, 
          ${verse.book_id}, 
          true,
          ${currentTime},
          ${notes || null}
        )
        ON CONFLICT (reader_id, verse_id) 
        DO UPDATE SET 
          is_read = true,
          read_at = ${currentTime},
          notes = COALESCE(${notes}, reading_progress.notes)
      `
    );
    
    await Promise.all(progressPromises);
    
    // 4. Actualizar contadores del lector
    await sql`
      UPDATE readers SET
        total_verses_read = (
          SELECT COUNT(*) FROM reading_progress 
          WHERE reader_id = ${readerId} AND is_read = true
        ),
        total_chapters_read = (
          SELECT COUNT(DISTINCT chapter_id) FROM reading_progress 
          WHERE reader_id = ${readerId} AND is_read = true
        )
      WHERE id = ${readerId}
    `;
    
    // 5. Respuesta con detalles
    const response = {
      reader_id: readerId,
      reader_name: reader_name,
      book_key: book_key,
      chapter_number: parseInt(chapter_number),
      verses_marked: versesResult.length,
      marked_at: currentTime,
      notes: notes || null
    };
    
    sendResponse(res, response, 
      `Capítulo ${book_key} ${chapter_number} marcado completamente para ${reader_name} (${versesResult.length} versículos)`
    );
    
  } catch (error) {
    console.error('Error marcando capítulo completo:', error);
    return sendResponse(res, null, 'Error interno del servidor', 500);
  }
}));

// GET /api/bible/progress/all - Para Biblia Interactiva (sin requerir readerId)
// GET /api/bible/progress/all - Para Biblia Interactiva (sin requerir readerId)
router.get('/progress/all', asyncHandler(async (req: Request, res: Response) => {
  try {
    const allProgress = await sql`
      SELECT DISTINCT
        b.key as book_key,
        b.name as book_name,
        c.chapter_number,
        r.id as reader_id,
        r.name as reader_name,
        rp.is_read,
        MAX(rp.read_at) as last_read_at,
        b.order_index
      FROM reading_progress rp
      JOIN verses v ON rp.verse_id = v.id  
      JOIN chapters c ON v.chapter_id = c.id
      JOIN books b ON c.book_id = b.id
      JOIN readers r ON rp.reader_id = r.id
      WHERE rp.is_read = true
      GROUP BY b.key, b.name, c.chapter_number, r.id, r.name, rp.is_read, b.order_index
      ORDER BY b.order_index, c.chapter_number
    `;
    
    sendResponse(res, allProgress, 'Progreso completo obtenido');
  } catch (error) {
    console.error('Error:', error);
    return sendResponse(res, null, 'Error interno del servidor', 500);
  }
}));

router.get('/progress/:readerId', asyncHandler(async (req: Request, res: Response) => {
  const { readerId } = req.params;
  const { chapter_id } = req.query;
  
  if (!readerId || isNaN(parseInt(readerId))) {
    return sendResponse(res, null, 'ID de lector inválido', 400);
  }
  
  const progress = await BibleModel.getReaderProgress(
    parseInt(readerId), 
    chapter_id ? parseInt(chapter_id as string) : undefined
  );
  
  sendResponse(res, progress, 'Progreso del lector obtenido exitosamente');
}));



router.get('/progress/chapter/:bookKey/:chapterNum', asyncHandler(async (req: Request, res: Response) => {
  const { bookKey, chapterNum } = req.params;
  
  const progress = await sql`
    SELECT 
      rp.reader_id,
      r.name as reader_name,
      rp.verse_id,
      b.name as book_name,
      c.chapter_number,
      v.verse_number,
      rp.is_read,
      rp.read_at,
      rp.notes
    FROM reading_progress rp
    JOIN readers r ON rp.reader_id = r.id
    JOIN verses v ON rp.verse_id = v.id
    JOIN chapters c ON v.chapter_id = c.id
    JOIN books b ON c.book_id = b.id
    WHERE b.key = ${bookKey} 
      AND c.chapter_number = ${parseInt(chapterNum)}
    ORDER BY v.verse_number
  `;
  
  sendResponse(res, progress, `Progreso del capítulo ${bookKey} ${chapterNum} obtenido`);
}));

// ==================== RUTAS DE ESTADÍSTICAS ====================
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  const stats = await BibleModel.getCompleteStats();
  sendResponse(res, stats, 'Estadísticas obtenidas exitosamente');
}));

// ==================== RUTAS DE CONFIGURACIÓN ====================
router.get('/marathon/config', asyncHandler(async (req: Request, res: Response) => {
  const config = await BibleModel.getMarathonConfig();
  sendResponse(res, config, 'Configuración del maratón obtenida exitosamente');
}));

router.put('/marathon/config', asyncHandler(async (req: Request, res: Response) => {
  const { name, start_time, end_time, is_active, description } = req.body;
  
  const config = await BibleModel.updateMarathonConfig({
    name,
    start_time,
    end_time,
    is_active,
    description
  });
  
  sendResponse(res, config, 'Configuración del maratón actualizada exitosamente');
}));

// ==================== RUTAS DE BÚSQUEDA ====================
router.get('/search', asyncHandler(async (req: Request, res: Response) => {
  const { q, testament, limit = 50 } = req.query;
  
  if (!q || (q as string).trim().length < 3) {
    return sendResponse(res, [], 'La consulta debe tener al menos 3 caracteres', 400);
  }
  
  const results = await BibleModel.searchVerses(
    (q as string).trim(),
    testament as string,
    parseInt(limit as string)
  );
  
  sendResponse(res, results, 'Búsqueda completada exitosamente');
}));

// ==================== RUTAS PARA BIBLIA INTERACTIVA ====================
router.get('/reports/last-read-chapter', asyncHandler(async (req: Request, res: Response) => {
  const lastChapterResult = await sql`
    SELECT 
      b.key as book_key,
      b.name as book_name,
      c.chapter_number,
      MAX(rp.read_at) as last_read_at
    FROM reading_progress rp
    JOIN verses v ON rp.verse_id = v.id
    JOIN chapters c ON v.chapter_id = c.id
    JOIN books b ON c.book_id = b.id
    WHERE rp.is_read = true
      AND rp.read_at IS NOT NULL
    GROUP BY b.key, b.name, c.chapter_number, b.order_index, c.id
    ORDER BY last_read_at DESC
    LIMIT 1
  `;
  
  const lastChapter = lastChapterResult.length > 0 ? lastChapterResult[0] : null;
  sendResponse(res, lastChapter, 'Último capítulo leído obtenido');
}));

router.get('/available-books', asyncHandler(async (req: Request, res: Response) => {
  const availableBooks = await sql`
    SELECT DISTINCT
      b.id,
      b.key,
      b.name,
      b.testament,
      b.order_index,
      b.total_chapters,
      b.author,
      b.description,
      COUNT(DISTINCT CASE WHEN rp.is_read THEN c.id END) as chapters_available
    FROM books b
    JOIN chapters c ON b.id = c.book_id
    JOIN verses v ON c.id = v.chapter_id
    JOIN reading_progress rp ON v.id = rp.verse_id
    WHERE rp.is_read = true
    GROUP BY b.id, b.key, b.name, b.testament, b.order_index, b.total_chapters, b.author, b.description
    HAVING COUNT(DISTINCT CASE WHEN rp.is_read THEN c.id END) > 0
    ORDER BY b.order_index
  `;
  
  sendResponse(res, availableBooks, 'Libros disponibles obtenidos');
}));

// ==================== RUTAS DE TIEMPO REAL ====================
router.get('/reports/realtime/stats', asyncHandler(async (req: Request, res: Response) => {
  const realtimeStats = await BibleModel.getMarathonProgress();
  
  const currentHour = new Date();
  currentHour.setMinutes(0, 0, 0);
  
  const paceDataResult = await sql`
    SELECT COUNT(*) as verses_this_hour
    FROM reading_progress 
    WHERE read_at >= ${currentHour.toISOString()}
      AND is_read = true
  `;
  
  const paceData = paceDataResult[0];
  const remainingVerses = realtimeStats.total_verses - realtimeStats.verses_read;
  const currentPace = parseInt(paceData.verses_this_hour) || 1;
  const hoursRemaining = remainingVerses / currentPace;
  const estimatedCompletion = new Date(Date.now() + (hoursRemaining * 60 * 60 * 1000));
  
  const enrichedStats = {
    ...realtimeStats,
    current_pace: currentPace,
    estimated_completion_time: estimatedCompletion.toISOString(),
    verses_remaining: remainingVerses,
    hours_remaining: Math.ceil(hoursRemaining)
  };
  
  sendResponse(res, enrichedStats, 'Estadísticas en tiempo real obtenidas');
}));

router.get('/reports/realtime/active-readers', asyncHandler(async (req: Request, res: Response) => {
  const activeReaders = await BibleModel.getActiveReadersRealTime();
  sendResponse(res, activeReaders, 'Lectores activos obtenidos');
}));

// Helper function para formatear duración
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
}

// ==================== MIDDLEWARE DE ERROR ====================
router.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error en rutas de Bible API:', err);
  
  if (err.code === '23505') {
    return sendResponse(res, null, 'Ya existe un registro con esos datos', 409);
  }
  
  if (err.code === '23503') {
    return sendResponse(res, null, 'Referencia inválida a datos relacionados', 400);
  }
  
  if (err.code === '23502') {
    return sendResponse(res, null, 'Faltan datos requeridos', 400);
  }
  
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';
  
  sendResponse(res, null, message, status);
});




export default router;