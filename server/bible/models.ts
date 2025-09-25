// server/bible/model.ts - Versión corregida
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

  static async getChapterWithVerses(bookKey: string, chapterNumber: number) {
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
          json_agg(
            json_build_object(
              'id', v.id,
              'number', v.verse_number,
              'text', v.text,
              'word_count', v.word_count
            ) ORDER BY v.verse_number
          ) as verses
        FROM books b
        JOIN chapters c ON b.id = c.book_id
        JOIN verses v ON c.id = v.chapter_id
        WHERE b.key = ${bookKey} AND c.chapter_number = ${chapterNumber}
        GROUP BY b.id, b.name, b.key, b.testament, b.description, 
                 c.id, c.chapter_number, c.total_verses, c.estimated_reading_time
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
          estimated_reading_time: row.estimated_reading_time
        },
        verses: row.verses
      };
    } catch (error) {
      console.error('Error obteniendo capítulo con versículos:', error);
      throw error;
    }
  }

  static async getReaders() {
    try {
      const readers = await sql`
        SELECT 
          r.*,
          COUNT(DISTINCT CASE WHEN rp.is_read THEN rp.chapter_id END) as chapters_read,
          COUNT(DISTINCT CASE WHEN rp.is_read THEN rp.verse_id END) as verses_read
        FROM readers r
        LEFT JOIN reading_progress rp ON r.id = rp.reader_id
        GROUP BY r.id, r.uuid, r.name, r.email, r.avatar_color, r.is_active, 
                 r.total_chapters_read, r.total_verses_read, r.reading_speed_wpm, r.created_at
        ORDER BY r.name
      `;

      return readers.map(reader => ({
        ...reader,
        total_chapters_read: reader.chapters_read || 0,
        total_verses_read: reader.verses_read || 0
      }));
    } catch (error) {
      console.error('Error obteniendo lectores:', error);
      throw error;
    }
  }

  // ==================== ESTADÍSTICAS COMPLETAS ====================
  static async getCompleteStats() {
    console.log('📊 [BibleModel] Obteniendo estadísticas completas...');
    
    try {
      // Estadísticas generales
      const generalStatsResult = await sql`
        SELECT 
          COUNT(DISTINCT b.id) as total_books,
          COUNT(DISTINCT c.id) as total_chapters,
          COUNT(DISTINCT v.id) as total_verses,
          COUNT(DISTINCT r.id) as total_readers,
          COUNT(DISTINCT CASE WHEN r.is_active THEN r.id END) as active_readers
        FROM books b
        JOIN chapters c ON c.book_id = b.id
        JOIN verses v ON v.chapter_id = c.id
        CROSS JOIN readers r
      `;

      // Estadísticas de progreso de lectura (versículos)
      const progressStatsResult = await sql`
        SELECT 
          COUNT(DISTINCT rp.verse_id) as total_verses_read,
          COUNT(DISTINCT rp.reader_id) as readers_with_progress
        FROM reading_progress rp
        WHERE rp.is_read = true
      `;

      // Estadísticas de capítulos completados
      const chapterStatsResult = await sql`
        SELECT 
          COUNT(DISTINCT CONCAT(b.key, '-', c.chapter_number)) as total_chapters_read,
          COUNT(DISTINCT b.id) as books_with_progress
        FROM reading_progress rp
        JOIN verses v ON rp.verse_id = v.id
        JOIN chapters c ON v.chapter_id = c.id
        JOIN books b ON c.book_id = b.id
        WHERE rp.is_read = true
      `;

      // Lectores activos
      const readersResult = await sql`
        SELECT 
          r.id,
          r.uuid,
          r.name,
          r.email,
          r.avatar_color,
          r.is_active,
          COUNT(DISTINCT rp.verse_id) as total_verses_read,
          COUNT(DISTINCT CONCAT(b.key, '-', c.chapter_number)) as total_chapters_read,
          r.reading_speed_wpm
        FROM readers r
        LEFT JOIN reading_progress rp ON r.id = rp.reader_id AND rp.is_read = true
        LEFT JOIN verses v ON rp.verse_id = v.id
        LEFT JOIN chapters c ON v.chapter_id = c.id
        LEFT JOIN books b ON c.book_id = b.id
        WHERE r.is_active = true
        GROUP BY r.id, r.uuid, r.name, r.email, r.avatar_color, r.is_active, r.reading_speed_wpm
        ORDER BY total_chapters_read DESC, total_verses_read DESC
      `;

      // Libros con progreso
      const booksResult = await sql`
        SELECT 
          b.id,
          b.key,
          b.name,
          b.testament,
          b.order_index,
          b.total_chapters,
          b.author,
          b.description,
          COUNT(DISTINCT CASE WHEN rp.is_read THEN c.id END) as chapters_completed,
          COUNT(DISTINCT CASE WHEN rp.is_read THEN rp.verse_id END) as verses_completed
        FROM books b
        LEFT JOIN chapters c ON b.id = c.book_id
        LEFT JOIN verses v ON c.id = v.chapter_id
        LEFT JOIN reading_progress rp ON v.id = rp.verse_id
        GROUP BY b.id, b.key, b.name, b.testament, b.order_index, b.total_chapters, b.author, b.description
        ORDER BY b.order_index
      `;

      // Configuración del maratón
      const marathonConfig = await this.getMarathonConfig();

      // Extraer datos
      const generalStats = generalStatsResult[0];
      const progressStats = progressStatsResult[0];
      const chapterStats = chapterStatsResult[0];

      // Cálculos corregidos basados en capítulos
      const totalChapters = parseInt(generalStats.total_chapters);
      const chaptersRead = parseInt(chapterStats.total_chapters_read);
      const chaptersCompletionPercentage = totalChapters > 0 ? (chaptersRead / totalChapters) * 100 : 0;

      // Cálculos basados en versículos
      const totalVerses = parseInt(generalStats.total_verses);
      const versesRead = parseInt(progressStats.total_verses_read);
      const versesCompletionPercentage = totalVerses > 0 ? (versesRead / totalVerses) * 100 : 0;

      const stats = {
        general: {
          // Datos básicos
          total_books: parseInt(generalStats.total_books),
          total_chapters: totalChapters,
          total_verses: totalVerses,
          total_readers: parseInt(generalStats.total_readers),
          active_readers: parseInt(generalStats.active_readers),
          
          // Estadísticas de capítulos
          total_chapters_read: chaptersRead,
          chapters_completion_percentage: chaptersCompletionPercentage,
          books_with_progress: parseInt(chapterStats.books_with_progress),
          
          // Estadísticas de versículos
          total_verses_read: versesRead,
          verses_completion_percentage: versesCompletionPercentage,
          readers_with_progress: parseInt(progressStats.readers_with_progress),
          
          // Porcentaje principal basado en capítulos
          completion_percentage: chaptersCompletionPercentage
        },
        readers: readersResult.map(reader => ({
          ...reader,
          total_verses_read: parseInt(reader.total_verses_read) || 0,
          total_chapters_read: parseInt(reader.total_chapters_read) || 0
        })),
        books: booksResult.map(book => ({
          ...book,
          chapters_completed: parseInt(book.chapters_completed) || 0,
          verses_completed: parseInt(book.verses_completed) || 0,
          completion_percentage: book.total_chapters > 0 
            ? ((parseInt(book.chapters_completed) || 0) / book.total_chapters) * 100 
            : 0
        })),
        marathon: marathonConfig
      };

      console.log('✅ [BibleModel] Estadísticas calculadas:', {
        total_chapters: stats.general.total_chapters,
        chapters_read: stats.general.total_chapters_read,
        completion_percentage: `${stats.general.completion_percentage.toFixed(2)}%`
      });

      return stats;

    } catch (error) {
      console.error('❌ [BibleModel] Error obteniendo estadísticas:', error);
      throw error;
    }
  }

  // ==================== GESTIÓN DE LECTORES ====================
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
          ${readerData.is_active !== false},
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
          name = COALESCE(${readerData.name}, name),
          email = COALESCE(${readerData.email}, email),
          avatar_color = COALESCE(${readerData.avatar_color}, avatar_color),
          is_active = COALESCE(${readerData.is_active}, is_active),
          reading_speed_wpm = COALESCE(${readerData.reading_speed_wpm}, reading_speed_wpm)
        WHERE id = ${readerId}
        RETURNING *
      `;

      if (result.length === 0) {
        throw new Error('Lector no encontrado');
      }

      return result[0];
    } catch (error) {
      console.error('Error actualizando lector:', error);
      throw error;
    }
  }

  static async deleteReader(readerId: number) {
    try {
      // Primero eliminamos el progreso de lectura
      await sql`DELETE FROM reading_progress WHERE reader_id = ${readerId}`;
      
      // Luego eliminamos el lector
      const result = await sql`
        DELETE FROM readers WHERE id = ${readerId} RETURNING *
      `;

      if (result.length === 0) {
        throw new Error('Lector no encontrado');
      }

      return result[0];
    } catch (error) {
      console.error('Error eliminando lector:', error);
      throw error;
    }
  }

  // ==================== PROGRESO DE LECTURA ====================
  static async markVerseAsRead(readerId: number, verseId: number, isRead: boolean = true, notes?: string) {
    try {
      // Obtener información del versículo
      const verseResult = await sql`
        SELECT v.id, v.chapter_id, c.book_id 
        FROM verses v
        JOIN chapters c ON v.chapter_id = c.id
        WHERE v.id = ${verseId}
      `;

      if (verseResult.length === 0) {
        throw new Error('Versículo no encontrado');
      }

      const verseInfo = verseResult[0];

      // Insertar o actualizar el progreso
      const result = await sql`
        INSERT INTO reading_progress (reader_id, verse_id, chapter_id, book_id, is_read, read_at, notes)
        VALUES (
          ${readerId}, 
          ${verseId}, 
          ${verseInfo.chapter_id}, 
          ${verseInfo.book_id}, 
          ${isRead},
          ${isRead ? new Date().toISOString() : null},
          ${notes || null}
        )
        ON CONFLICT (reader_id, verse_id) 
        DO UPDATE SET 
          is_read = EXCLUDED.is_read,
          read_at = CASE WHEN EXCLUDED.is_read THEN NOW() ELSE NULL END,
          notes = COALESCE(EXCLUDED.notes, reading_progress.notes)
        RETURNING *
      `;

      // Actualizar contadores en la tabla readers
      await this.updateReaderCounters(readerId);

      return result[0];
    } catch (error) {
      console.error('Error marcando verso como leído:', error);
      throw error;
    }
  }

  static async updateReaderCounters(readerId: number) {
    try {
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
    } catch (error) {
      console.error('Error actualizando contadores del lector:', error);
      throw error;
    }
  }

  static async getReaderProgress(readerId: number, chapterId?: number) {
    try {
      let query;
      
      if (chapterId) {
        query = sql`
          SELECT 
            rp.*,
            v.verse_number,
            v.text,
            c.chapter_number,
            b.name as book_name
          FROM reading_progress rp
          JOIN verses v ON rp.verse_id = v.id
          JOIN chapters c ON v.chapter_id = c.id
          JOIN books b ON c.book_id = b.id
          WHERE rp.reader_id = ${readerId} AND rp.chapter_id = ${chapterId}
          ORDER BY b.order_index, c.chapter_number, v.verse_number
        `;
      } else {
        query = sql`
          SELECT 
            rp.*,
            v.verse_number,
            v.text,
            c.chapter_number,
            b.name as book_name
          FROM reading_progress rp
          JOIN verses v ON rp.verse_id = v.id
          JOIN chapters c ON v.chapter_id = c.id
          JOIN books b ON c.book_id = b.id
          WHERE rp.reader_id = ${readerId}
          ORDER BY b.order_index, c.chapter_number, v.verse_number
        `;
      }

      return await query;
    } catch (error) {
      console.error('Error obteniendo progreso del lector:', error);
      throw error;
    }
  }

  // ==================== CONFIGURACIÓN DEL MARATÓN ====================
  static async getMarathonConfig() {
    try {
      const result = await sql`
        SELECT * FROM marathon_config WHERE is_active = true LIMIT 1
      `;
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error obteniendo configuración del maratón:', error);
      // Devolver config por defecto si hay error
      return {
        id: 1,
        name: 'Maratón Bíblico',
        is_active: true,
        description: 'Maratón de lectura bíblica'
      };
    }
  }

  static async updateMarathonConfig(configData: {
    name?: string;
    start_time?: string;
    end_time?: string;
    is_active?: boolean;
    description?: string;
  }) {
    try {
      const currentConfig = await this.getMarathonConfig();
      
      if (!currentConfig) {
        const result = await sql`
          INSERT INTO marathon_config (name, start_time, end_time, is_active, description)
          VALUES (
            ${configData.name || 'Maratón Bíblico'},
            ${configData.start_time || new Date().toISOString()},
            ${configData.end_time || new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()},
            ${configData.is_active !== false},
            ${configData.description || 'Descripción del maratón bíblico'}
          )
          RETURNING *
        `;
        return result[0];
      } else {
        const result = await sql`
          UPDATE marathon_config SET
            name = COALESCE(${configData.name}, name),
            start_time = COALESCE(${configData.start_time}, start_time),
            end_time = COALESCE(${configData.end_time}, end_time),
            is_active = COALESCE(${configData.is_active}, is_active),
            description = COALESCE(${configData.description}, description),
            total_participants = (SELECT COUNT(*) FROM readers WHERE is_active = true)
          WHERE id = ${currentConfig.id}
          RETURNING *
        `;
        return result[0];
      }
    } catch (error) {
      console.error('Error actualizando configuración del maratón:', error);
      throw error;
    }
  }

  // ==================== BÚSQUEDA ====================
  static async searchVerses(query: string, testament?: string, limit: number = 50) {
    try {
      const searchTerms = query.split(' ').filter(term => term.length > 2);
      
      if (searchTerms.length === 0) {
        return [];
      }

      let sqlQuery;
      
      if (testament) {
        sqlQuery = sql`
          SELECT 
            v.id,
            v.verse_number,
            v.text,
            c.chapter_number,
            b.name as book_name,
            b.key as book_key,
            b.testament
          FROM verses v
          JOIN chapters c ON v.chapter_id = c.id
          JOIN books b ON c.book_id = b.id
          WHERE b.testament = ${testament}
            AND v.text ILIKE ${'%' + query + '%'}
          ORDER BY b.order_index, c.chapter_number, v.verse_number
          LIMIT ${limit}
        `;
      } else {
        sqlQuery = sql`
          SELECT 
            v.id,
            v.verse_number,
            v.text,
            c.chapter_number,
            b.name as book_name,
            b.key as book_key,
            b.testament
          FROM verses v
          JOIN chapters c ON v.chapter_id = c.id
          JOIN books b ON c.book_id = b.id
          WHERE v.text ILIKE ${'%' + query + '%'}
          ORDER BY b.order_index, c.chapter_number, v.verse_number
          LIMIT ${limit}
        `;
      }

      return await sqlQuery;
    } catch (error) {
      console.error('Error buscando versículos:', error);
      throw error;
    }
  }

  // ==================== MÉTODOS PARA TIEMPO REAL ====================
  static async getMarathonProgress() {
    try {
      const result = await sql`
        SELECT 
          COALESCE(
            ROUND((COUNT(DISTINCT CASE WHEN rp.is_read THEN rp.verse_id END)::numeric / 
                  NULLIF(COUNT(DISTINCT v.id), 0)) * 100, 2), 0
          ) as overall_completion_percentage,
          COUNT(DISTINCT v.id) as total_verses,
          COUNT(DISTINCT CASE WHEN rp.is_read THEN rp.verse_id END) as verses_read,
          COUNT(DISTINCT c.id) as total_chapters,
          COUNT(DISTINCT CASE WHEN rp.is_read THEN rp.chapter_id END) as chapters_with_progress,
          COUNT(DISTINCT b.id) as total_books,
          COUNT(DISTINCT CASE WHEN rp.is_read THEN b.id END) as books_with_progress
        FROM verses v
        JOIN chapters c ON v.chapter_id = c.id
        JOIN books b ON c.book_id = b.id
        LEFT JOIN reading_progress rp ON v.id = rp.verse_id
      `;

      return result[0];
    } catch (error) {
      console.error('Error obteniendo progreso del maratón:', error);
      throw error;
    }
  }

  static async getActiveReadersRealTime() {
    try {
      const activeReaders = await sql`
        SELECT 
          r.id,
          r.name,
          r.avatar_color,
          COUNT(*) as recent_verses_read,
          MAX(rp.read_at) as last_activity
        FROM readers r
        JOIN reading_progress rp ON r.id = rp.reader_id
        WHERE rp.read_at >= NOW() - INTERVAL '1 hour'
          AND rp.is_read = true
          AND r.is_active = true
        GROUP BY r.id, r.name, r.avatar_color
        ORDER BY last_activity DESC
      `;

      return activeReaders;
    } catch (error) {
      console.error('Error obteniendo lectores activos en tiempo real:', error);
      throw error;
    }
  }
}