// server/bible/routes.ts
import { Router } from 'express';
import { BibleModel } from './models';

const router = Router();

// GET /api/bible/books - Obtener libros
router.get('/books', async (req, res) => {
  try {
    const { testament } = req.query;
    const books = await BibleModel.getAllBooks(testament as string);
    
    res.json({
      success: true,
      data: books,
      message: 'Libros obtenidos exitosamente'
    });
  } catch (error) {
    console.error('Error obteniendo libros:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/bible/books/:bookKey/chapters/:chapterNum
router.get('/books/:bookKey/chapters/:chapterNum', async (req, res) => {
  try {
    const { bookKey, chapterNum } = req.params;
    const chapter = await BibleModel.getChapterWithVerses(bookKey, parseInt(chapterNum));
    
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Capítulo no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: chapter,
      message: 'Capítulo obtenido exitosamente'
    });
  } catch (error) {
    console.error('Error obteniendo capítulo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/bible/readers - Obtener lectores
router.get('/readers', async (req, res) => {
  try {
    const readers = await BibleModel.getReaders();
    
    res.json({
      success: true,
      data: readers,
      message: 'Lectores obtenidos exitosamente'
    });
  } catch (error) {
    console.error('Error obteniendo lectores:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/bible/progress - Marcar verso como leído
router.post('/progress', async (req, res) => {
  try {
    const { reader_id, verse_id, is_read = true } = req.body;
    
    if (!reader_id || !verse_id) {
      return res.status(400).json({
        success: false,
        message: 'reader_id y verse_id son requeridos'
      });
    }
    
    const progress = await BibleModel.markVerseAsRead(reader_id, verse_id, is_read);
    
    res.json({
      success: true,
      data: progress,
      message: 'Progreso actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error actualizando progreso:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/bible/progress/:readerId - Obtener progreso
router.get('/progress/:readerId', async (req, res) => {
  try {
    const { readerId } = req.params;
    const { chapter_id } = req.query;
    
    const progress = await BibleModel.getReaderProgress(
      parseInt(readerId), 
      chapter_id ? parseInt(chapter_id as string) : undefined
    );
    
    res.json({
      success: true,
      data: progress,
      message: 'Progreso obtenido exitosamente'
    });
  } catch (error) {
    console.error('Error obteniendo progreso:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/bible/stats - Obtener estadísticas
router.get('/stats', async (req, res) => {
  try {
    const stats = await BibleModel.getStats();
    
    res.json({
      success: true,
      data: stats,
      message: 'Estadísticas obtenidas exitosamente'
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

export default router;