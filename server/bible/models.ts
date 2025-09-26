// server/bible/models.ts - Nueva versión simplificada sin reading_progress
import sql from './db';

export class BibleModel {
  // ==================== MÉTODOS BÁSICOS ====================
  static async getAllBooks(testament?: string) {
    try {
      let query;
      
      if (testament) {
        query = sql`SELECT * FROM books WHERE testament = ${testament} ORDER BY order_index`;
      } else {
        query = sql`SELECT * FROM books ORDER BY order_index`;
      }
      
      const books = await query;
      return books;
    } catch (error) {
      console.error('Error obteniendo libros:', error);
      throw error;
    }
  }

  static async getBookByKey(bookKey: string) {
    try {
      const result = await sql`SELECT * FROM books WHERE key = ${bookKey}`;
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error obteniendo libro por key:', error);
      throw error;
    }
  }

  static async getChapterWithDetails(bookKey: string, chapterNumber: number) {
    try {
      const result = await sql`
        SELECT 
          b.id as book_id,
          b.name as book_name,
          b.key as book_key,
          b.testament,
          b.description as book_description,
          c.id as chapter_id,
          c.chapter_number,
          c.total_verses,
          c.estimated_reading_time,
          c.is_completed,
          c.completed_at,
          c.reading_notes,
          c.reading_duration_minutes,
          r.name as read_by_reader_name,
          r.avatar_color as reader_color
        FROM books b
        JOIN chapters c ON b.id = c.book_id
        LEFT JOIN readers r ON c.read_by_reader_id = r.id
        WHERE b.key = ${bookKey} AND c.chapter_number = ${chapterNumber}
      `;

      if (result.length === 0) {
        return null;
      }

      const row = result[0];
      return {
        book: {
          id: row.book_id,
          name: row.book_name,
          key: row.book_key,
          testament: row.testament,
          description: row.book_description
        },
        chapter: {
          id: row.chapter_id,
          number: row.chapter_number,
          total_verses: row.total_verses,
          estimated_reading_time: row.estimated_reading_time,
          is_completed: row.is_completed,
          completed_at: row.completed_at,
          reading_notes: row.reading_notes,
          reading_duration_minutes: row.reading_duration_minutes,
          read_by_reader: row.read_by_reader_name,
          reader_color: row.reader_color
        }
      };
    } catch (error) {
      console.error('Error obteniendo capítulo:', error);
      throw error;
    }
  }

  // ==================== GESTIÓN DE LECTURAS ====================
  static async markChapterAsRead(
    chapterId: number, 
    readerId: number, 
    notes?: string, 
    durationMinutes?: number
  ) {
    try {
      const result = await sql`
        SELECT mark_chapter_as_read(${chapterId}, ${readerId}, ${notes || null}, ${durationMinutes || null}) as success
      `;
      
      return result[0].success;
    } catch (error) {
      console.error('Error marcando capítulo como leído:', error);
      throw error;
    }
  }

  static async markChapterAsReadByBookKey(
    bookKey: string,
    chapterNumber: number,
    readerId: number,
    notes?: string,
    durationMinutes?: number
  ) {
    try {
      // Primero obtener el chapter_id
      const chapterResult = await sql`
        SELECT c.id 
        FROM chapters c
        JOIN books b ON c.book_id = b.id
        WHERE b.key = ${bookKey} AND c.chapter_number = ${chapterNumber}
      `;

      if (chapterResult.length === 0) {
        throw new Error(`Capítulo ${bookKey} ${chapterNumber} no encontrado`);
      }

      const chapterId = chapterResult[0].id;
      return await this.markChapterAsRead(chapterId, readerId, notes, durationMinutes);
    } catch (error) {
      console.error('Error marcando capítulo por book key:', error);
      throw error;
    }
  }

  static async getChapterReadings(chapterId?: number, readerId?: number) {
    try {
      let query;
      
      if (chapterId && readerId) {
        query = sql`
          SELECT cr.*, r.name as reader_name, r.avatar_color,
                 b.name as book_name, b.key as book_key, c.chapter_number
          FROM chapter_readings cr
          JOIN readers r ON cr.reader_id = r.id
          JOIN chapters c ON cr.chapter_id = c.id
          JOIN books b ON c.book_id = b.id
          WHERE cr.chapter_id = ${chapterId} AND cr.reader_id = ${readerId}
        `;
      } else if (chapterId) {
        query = sql`
          SELECT cr.*, r.name as reader_name, r.avatar_color,
                 b.name as book_name, b.key as book_key, c.chapter_number
          FROM chapter_readings cr
          JOIN readers r ON cr.reader_id = r.id
          JOIN chapters c ON cr.chapter_id = c.id
          JOIN books b ON c.book_id = b.id
          WHERE cr.chapter_id = ${chapterId}
          ORDER BY cr.completed_at DESC
        `;
      } else if (readerId) {
        query = sql`
          SELECT cr.*, r.name as reader_name, r.avatar_color,
                 b.name as book_name, b.key as book_key, c.chapter_number
          FROM chapter_readings cr
          JOIN readers r ON cr.reader_id = r.id
          JOIN chapters c ON cr.chapter_id = c.id
          JOIN books b ON c.book_id = b.id
          WHERE cr.reader_id = ${readerId}
          ORDER BY b.order_index, c.chapter_number
        `;
      } else {
        query = sql`
          SELECT cr.*, r.name as reader_name, r.avatar_color,
                 b.name as book_name, b.key as book_key, c.chapter_number
          FROM chapter_readings cr
          JOIN readers r ON cr.reader_id = r.id
          JOIN chapters c ON cr.chapter_id = c.id
          JOIN books b ON c.book_id = b.id
          ORDER BY cr.completed_at DESC
          LIMIT 100
        `;
      }

      return await query;
    } catch (error) {
      console.error('Error obteniendo lecturas de capítulos:', error);
      throw error;
    }
  }

  // ==================== GESTIÓN DE LECTORES ====================
  static async getReaders() {
    try {
      const readers = await sql`
        SELECT * FROM reader_stats ORDER BY chapters_completed DESC, name ASC
      `;
      return readers;
    } catch (error) {
      console.error('Error obteniendo lectores:', error);
      throw error;
    }
  }

  static async createReader(readerData: {
    name: string;
    email?: string;
    avatar_color?: string;
    is_active?: boolean;
    reading_speed_wpm?: number;
  }) {
    try {
      const result = await sql`
        INSERT INTO readers (name, email, avatar_color, is_active, reading_speed_wpm)
        VALUES (
          ${readerData.name},
          ${readerData.email || null},
          ${readerData.avatar_color || '#6366f1'},
          ${readerData.is_active !== undefined ? readerData.is_active : true},
          ${readerData.reading_speed_wpm || 200}
        )
        RETURNING *
      `;
      
      return result[0];
    } catch (error) {
      console.error('Error creando lector:', error);
      throw error;
    }
  }

  static async updateReader(readerId: number, readerData: {
    name?: string;
    email?: string;
    avatar_color?: string;
    is_active?: boolean;
    reading_speed_wpm?: number;
  }) {
    try {
      const result = await sql`
        UPDATE readers SET
          name = COALESCE(${readerData.name || null}, name),
          email = ${readerData.email || null},
          avatar_color = COALESCE(${readerData.avatar_color || null}, avatar_color),
          is_active = COALESCE(${readerData.is_active !== undefined ? readerData.is_active : null}, is_active),
          reading_speed_wpm = COALESCE(${readerData.reading_speed_wpm || null}, reading_speed_wpm)
        WHERE id = ${readerId}
        RETURNING *
      `;
      
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error actualizando lector:', error);
      throw error;
    }
  }

  // ==================== ESTADÍSTICAS COMPLETAS ====================
  static async getCompleteStats() {
    console.log('📊 [BibleModel] Obteniendo estadísticas completas...');
    
    try {
      // 1. Estadísticas generales usando la función SQL
      const generalStatsResult = await sql`SELECT * FROM get_bible_stats()`;
      const generalStats = generalStatsResult[0];

      // 2. Estadísticas por libro
      const booksStats = await sql`SELECT * FROM chapter_stats`;

      // 3. Estadísticas por lector
      const readersStats = await sql`SELECT * FROM reader_stats WHERE chapters_completed > 0`;

      // 4. Últimos capítulos leídos
      const recentReadings = await sql`
        SELECT 
          b.name as book_name,
          b.key as book_key,
          c.chapter_number,
          r.name as reader_name,
          r.avatar_color,
          cr.completed_at,
          cr.reading_duration_minutes
        FROM chapter_readings cr
        JOIN chapters c ON cr.chapter_id = c.id
        JOIN books b ON c.book_id = b.id
        JOIN readers r ON cr.reader_id = r.id
        WHERE cr.is_completed = true
        ORDER BY cr.completed_at DESC
        LIMIT 10
      `;

      // 5. Configuración del maratón
      const marathonConfig = await this.getMarathonConfig();

      // 6. Estadísticas adicionales
      const additionalStats = await sql`
        SELECT 
          COUNT(DISTINCT b.testament) as testaments,
          COUNT(DISTINCT CASE WHEN c.is_completed THEN b.id END) as books_with_progress,
          AVG(CASE WHEN cr.reading_duration_minutes > 0 THEN cr.reading_duration_minutes END) as avg_reading_time,
          MIN(cr.completed_at) as first_reading,
          MAX(cr.completed_at) as last_reading
        FROM books b
        LEFT JOIN chapters c ON b.id = c.book_id
        LEFT JOIN chapter_readings cr ON c.id = cr.chapter_id AND cr.is_completed = true
      `;

      const additional = additionalStats[0];

      const stats = {
        general: {
          total_books: parseInt(generalStats.total_books) || 0,
          total_chapters: parseInt(generalStats.total_chapters) || 0,
          chapters_completed: parseInt(generalStats.chapters_completed) || 0,
          completion_percentage: parseFloat(generalStats.completion_percentage) || 0,
          active_readers: parseInt(generalStats.active_readers) || 0,
          readers_with_progress: parseInt(generalStats.total_readers_with_progress) || 0,
          books_with_progress: parseInt(additional.books_with_progress) || 0,
          avg_reading_time_minutes: parseFloat(additional.avg_reading_time) || 0,
          first_reading: additional.first_reading,
          last_reading: additional.last_reading
        },
        books: booksStats,
        readers: readersStats,
        recent_readings: recentReadings,
        marathon: marathonConfig
      };

      console.log('✅ [BibleModel] Estadísticas calculadas:', {
        total_chapters: stats.general.total_chapters,
        chapters_completed: stats.general.chapters_completed,
        completion_percentage: `${stats.general.completion_percentage}%`,
        active_readers: stats.general.active_readers
      });

      return stats;

    } catch (error) {
      console.error('❌ [BibleModel] Error obteniendo estadísticas:', error);
      throw error;
    }
  }

  // ==================== CONFIGURACIÓN DEL MARATÓN ====================
  static async getMarathonConfig() {
    try {
      const result = await sql`
        SELECT * FROM marathon_config WHERE is_active = true LIMIT 1
      `;
      return result.length > 0 ? result[0] : {
        name: 'Maratón Bíblico 2025',
        start_time: new Date(),
        end_time: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        is_active: true,
        description: 'Maratón de lectura de la Biblia completa'
      };
    } catch (error) {
      console.error('Error obteniendo configuración del maratón:', error);
      return null;
    }
  }

  static async updateMarathonConfig(configData: {
    name?: string;
    start_time?: Date;
    end_time?: Date;
    is_active?: boolean;
    description?: string;
  }) {
    try {
      const result = await sql`
        UPDATE marathon_config SET
          name = COALESCE(${configData.name || null}, name),
          start_time = COALESCE(${configData.start_time || null}, start_time),
          end_time = COALESCE(${configData.end_time || null}, end_time),
          is_active = COALESCE(${configData.is_active !== undefined ? configData.is_active : null}, is_active),
          description = COALESCE(${configData.description || null}, description)
        WHERE is_active = true
        RETURNING *
      `;
      
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error actualizando configuración del maratón:', error);
      throw error;
    }
  }

  // ==================== REPORTES Y CONSULTAS ====================
  static async getLastReadChapter() {
    try {
      const result = await sql`
        SELECT 
          b.key as book_key,
          b.name as book_name,
          c.chapter_number,
          cr.completed_at as last_read_at,
          r.name as reader_name
        FROM chapter_readings cr
        JOIN chapters c ON cr.chapter_id = c.id
        JOIN books b ON c.book_id = b.id
        JOIN readers r ON cr.reader_id = r.id
        WHERE cr.is_completed = true
        ORDER BY cr.completed_at DESC
        LIMIT 1
      `;
      
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error obteniendo último capítulo leído:', error);
      return null;
    }
  }

  static async getAvailableBooks() {
    try {
      const books = await sql`
        SELECT DISTINCT
          b.id,
          b.key,
          b.name,
          b.testament,
          b.order_index,
          b.total_chapters,
          b.author,
          b.description,
          COUNT(CASE WHEN c.is_completed THEN 1 END) as chapters_available
        FROM books b
        JOIN chapters c ON b.id = c.book_id
        WHERE c.is_completed = true
        GROUP BY b.id, b.key, b.name, b.testament, b.order_index, b.total_chapters, b.author, b.description
        HAVING COUNT(CASE WHEN c.is_completed THEN 1 END) > 0
        ORDER BY b.order_index
      `;
      
      return books;
    } catch (error) {
      console.error('Error obteniendo libros disponibles:', error);
      throw error;
    }
  }

  static async getChapterReadingsByBook(bookKey: string) {
    try {
      const readings = await sql`
        SELECT 
          c.chapter_number,
          c.is_completed,
          c.completed_at,
          r.name as reader_name,
          r.avatar_color,
          cr.reading_duration_minutes,
          cr.reading_notes
        FROM chapters c
        JOIN books b ON c.book_id = b.id
        LEFT JOIN readers r ON c.read_by_reader_id = r.id
        LEFT JOIN chapter_readings cr ON c.id = cr.chapter_id AND c.read_by_reader_id = cr.reader_id
        WHERE b.key = ${bookKey}
        ORDER BY c.chapter_number
      `;
      
      return readings;
    } catch (error) {
      console.error('Error obteniendo lecturas por libro:', error);
      throw error;
    }
  }

  // ==================== BÚSQUEDA Y FILTROS ====================
  static async searchVerses(query: string, testament?: string, limit: number = 50) {
    try {
      // Nota: Esta funcionalidad se mantendrá si decides conservar la tabla verses
      // Por ahora devuelve un array vacío ya que eliminamos verses
      console.warn('Búsqueda de versículos no disponible sin tabla verses');
      return [];
    } catch (error) {
      console.error('Error en búsqueda:', error);
      throw error;
    }
  }

  static async getMarathonProgress() {
    try {
      const progress = await sql`
        SELECT 
          COUNT(DISTINCT b.id) as total_books,
          COUNT(DISTINCT c.id) as total_chapters,
          COUNT(CASE WHEN c.is_completed THEN 1 END) as chapters_completed,
          COUNT(DISTINCT c.read_by_reader_id) as active_readers,
          ROUND(
            (COUNT(CASE WHEN c.is_completed THEN 1 END)::numeric / 
             NULLIF(COUNT(DISTINCT c.id), 0)) * 100, 2
          ) as completion_percentage,
          MIN(c.completed_at) as first_reading,
          MAX(c.completed_at) as last_reading
        FROM books b
        LEFT JOIN chapters c ON b.id = c.book_id
      `;
      
      return progress[0];
    } catch (error) {
      console.error('Error obteniendo progreso del maratón:', error);
      throw error;
    }
  }

  // ==================== UTILIDADES ====================
  static async resetChapterProgress(chapterId: number) {
    try {
      await sql`
        UPDATE chapters 
        SET 
          read_by_reader_id = NULL,
          is_completed = false,
          completed_at = NULL,
          reading_notes = NULL,
          reading_duration_minutes = NULL,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${chapterId}
      `;

      await sql`
        DELETE FROM chapter_readings WHERE chapter_id = ${chapterId}
      `;

      return true;
    } catch (error) {
      console.error('Error reseteando progreso del capítulo:', error);
      throw error;
    }
  }

  static async bulkMarkChapters(readerName: string, bookKey: string, fromChapter: number, toChapter: number) {
    try {
      // Obtener el reader_id
      const readerResult = await sql`
        SELECT id FROM readers WHERE name = ${readerName} AND is_active = true
      `;

      if (readerResult.length === 0) {
        throw new Error(`Lector "${readerName}" no encontrado o inactivo`);
      }

      const readerId = readerResult[0].id;

      // Obtener los capítulos en el rango
      const chaptersResult = await sql`
        SELECT c.id
        FROM chapters c
        JOIN books b ON c.book_id = b.id
        WHERE b.key = ${bookKey} 
          AND c.chapter_number >= ${fromChapter} 
          AND c.chapter_number <= ${toChapter}
        ORDER BY c.chapter_number
      `;

      if (chaptersResult.length === 0) {
        throw new Error(`No se encontraron capítulos en el rango ${fromChapter}-${toChapter} para ${bookKey}`);
      }

      // Marcar cada capítulo usando la función SQL
      let successCount = 0;
      for (const chapter of chaptersResult) {
        const result = await sql`
          SELECT mark_chapter_as_read(${chapter.id}, ${readerId}, 
            ${'Marcado masivamente desde ' + bookKey + ' ' + fromChapter + '-' + toChapter}, 
            NULL
          ) as success
        `;
        
        if (result[0].success) {
          successCount++;
        }
      }

      return {
        requested: chaptersResult.length,
        marked: successCount,
        success: successCount === chaptersResult.length
      };

    } catch (error) {
      console.error('Error en marcado masivo:', error);
      throw error;
    }
  }

  static async getReaderByName(name: string) {
    try {
      const result = await sql`
        SELECT * FROM readers WHERE name ILIKE ${name} AND is_active = true LIMIT 1
      `;
      
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error obteniendo lector por nombre:', error);
      throw error;
    }
  }

  static async validateChapterExists(bookKey: string, chapterNumber: number) {
    try {
      const result = await sql`
        SELECT c.id
        FROM chapters c
        JOIN books b ON c.book_id = b.id
        WHERE b.key = ${bookKey} AND c.chapter_number = ${chapterNumber}
      `;
      
      return result.length > 0;
    } catch (error) {
      console.error('Error validando existencia del capítulo:', error);
      return false;
    }
  }
}