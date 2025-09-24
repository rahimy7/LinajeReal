// server/bible/routes.ts
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

// GET /api/bible/books - Obtener libros bíblicos
router.get('/books', asyncHandler(async (req: Request, res: Response) => {
  const { testament } = req.query;
  const books = await BibleModel.getAllBooks(testament as string);
  sendResponse(res, books, 'Libros bíblicos obtenidos exitosamente');
}));

// GET /api/bible/books/:bookKey - Obtener un libro específico
router.get('/books/:bookKey', asyncHandler(async (req: Request, res: Response) => {
  const { bookKey } = req.params;
  const book = await BibleModel.getBookByKey(bookKey);
  
  if (!book) {
    return sendResponse(res, null, 'Libro no encontrado', 404);
  }
  
  sendResponse(res, book, 'Libro obtenido exitosamente');
}));

// GET /api/bible/books/:bookKey/chapters/:chapterNum - Obtener capítulo con versículos
router.get('/books/:bookKey/chapters/:chapterNum', asyncHandler(async (req: Request, res: Response) => {
  const { bookKey, chapterNum } = req.params;
  const chapter = await BibleModel.getChapterWithVerses(bookKey, parseInt(chapterNum));
  
  if (!chapter) {
    return sendResponse(res, null, 'Capítulo no encontrado', 404);
  }
  
  sendResponse(res, chapter, 'Capítulo obtenido exitosamente');
}));

// GET /api/bible/readers - Obtener lectores del maratón
router.get('/readers', asyncHandler(async (req: Request, res: Response) => {
  const readers = await BibleModel.getReaders();
  sendResponse(res, readers, 'Lectores obtenidos exitosamente');
}));

// POST /api/bible/progress - Marcar versículo como leído
router.post('/progress', asyncHandler(async (req: Request, res: Response) => {
  const { reader_id, verse_id, is_read = true } = req.body;
  
  if (!reader_id || !verse_id) {
    return sendResponse(res, null, 'reader_id y verse_id son requeridos', 400);
  }
  
  const progress = await BibleModel.markVerseAsRead(
    parseInt(reader_id), 
    parseInt(verse_id), 
    is_read
  );
  
  sendResponse(res, progress, 'Progreso actualizado exitosamente');
}));

// GET /api/bible/progress/:readerId - Obtener progreso de un lector
router.get('/progress/:readerId', asyncHandler(async (req: Request, res: Response) => {
  const { readerId } = req.params;
  const { chapter_id } = req.query;
  
  const progress = await BibleModel.getReaderProgress(
    parseInt(readerId), 
    chapter_id ? parseInt(chapter_id as string) : undefined
  );
  
  sendResponse(res, progress, 'Progreso obtenido exitosamente');
}));

// GET /api/bible/stats - Obtener estadísticas del maratón
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  const stats = await BibleModel.getStats();
  sendResponse(res, stats, 'Estadísticas obtenidas exitosamente');
}));

// GET /api/bible/search - Buscar versículos
router.get('/search', asyncHandler(async (req: Request, res: Response) => {
  const { q, testament, limit = 20 } = req.query;
  
  if (!q || (q as string).trim().length < 2) {
    return sendResponse(res, [], 'La consulta debe tener al menos 2 caracteres', 400);
  }
  
  const results = await BibleModel.searchVerses(
    (q as string).trim(), 
    testament as string, 
    parseInt(limit as string)
  );
  
  sendResponse(res, results, `${results.length} versículos encontrados`);
}));

// GET /api/bible/health - Estado de la API
router.get('/health', asyncHandler(async (req: Request, res: Response) => {
  const stats = await BibleModel.getStats();
  
  sendResponse(res, {
    status: 'healthy',
    database: 'neon-connected',
    project: 'linaje-real',
    books_count: stats.general.total_books,
    readers_count: stats.general.total_readers,
    timestamp: new Date().toISOString()
  }, 'API Biblia Linaje Real funcionando correctamente');
}));

export default router;