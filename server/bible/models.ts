// server/bible/models.ts - VERSIÓN CORREGIDA SIN ERRORES TYPESCRIPT
import sql from './db';

// Tipos TypeScript exactos para las respuestas de la base de datos
export interface Book {
  id: number;
  key: string;
  name: string;
  testament: 'old' | 'new';
  order_index: number;
  total_chapters: number;
  author?: string;
  description?: string;
  created_at?: string;
}

export interface Chapter {
  id: number;
  book_id: number;
  chapter_number: number;
  total_verses: number;
  estimated_reading_time: number;
  created_at?: string;
}

export interface Verse {
  id: number;
  chapter_id: number;
  book_id: number;
  verse_number: number;
  text: string;
  word_count: number;
  created_at?: string;
}

export interface Reader {
  id: number;
  uuid: string;
  name: string;
  email?: string;
  avatar_color: string;
  is_active: boolean;
  chapters_read?: number;
  verses_read?: number;
  reading_speed_wpm: number;
  created_at?: string;
}

export interface ReadingProgress {
  id: number;
  reader_id: number;
  verse_id: number;
  chapter_id: number;
  book_id: number;
  is_read: boolean;
  read_at?: string;
  notes?: string;
  created_at?: string;
}

// Tipos para las respuestas estructuradas
export interface ChapterWithVerses {
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

export interface BookStats {
  id: number;
  key: string;
  name: string;
  testament: string;
  order_index: number;
  total_chapters: number;
  total_verses: number;
  verses_read: number;
  completion_percentage: number;
}

export interface ReaderStats {
  id: number;
  name: string;
  avatar_color: string;
  reading_speed_wpm: number;
  chapters_read: number;
  verses_read: number;
}

export interface GeneralStats {
  total_books: number;
  total_readers: number;
  total_verses_read: number;
  total_chapters: number;
  total_verses: number;
}

export interface MarathonConfig {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  total_participants: number;
  description?: string;
  created_at: string;
}

// Modelos de consulta usando Neon con tipos explícitos
export class BibleModel {
  // Obtener todos los libros
  static async getAllBooks(testament?: string): Promise<Book[]> {
    try {
      if (testament && ['old', 'new'].includes(testament)) {
        const result = await sql`
          SELECT * FROM books 
          WHERE testament = ${testament} 
          ORDER BY order_index
        `;
        return result as Book[];
      } else {
        const result = await sql`
          SELECT * FROM books 
          ORDER BY order_index
        `;
        return result as Book[];
      }
    } catch (error) {
      console.error('Error obteniendo libros:', error);
      throw error;
    }
  }

  // Obtener un libro específico
  static async getBookByKey(key: string): Promise<Book | null> {
    try {
      const result = await sql`
        SELECT * FROM books WHERE key = ${key}
      `;
      const books = result as Book[];
      return books[0] || null;
    } catch (error) {
      console.error('Error obteniendo libro:', error);
      throw error;
    }
  }

  // Obtener capítulo con versículos
  static async getChapterWithVerses(bookKey: string, chapterNum: number): Promise<ChapterWithVerses | null> {
    try {
      const result = await sql`
        SELECT 
          b.id as book_id, b.name as book_name, b.key as book_key, 
          b.testament, b.description,
          c.id as chapter_id, c.chapter_number, c.total_verses,
          c.estimated_reading_time,
          v.id as verse_id, v.verse_number, v.text, v.word_count
        FROM books b
        JOIN chapters c ON b.id = c.book_id
        LEFT JOIN verses v ON c.id = v.chapter_id
        WHERE b.key = ${bookKey} AND c.chapter_number = ${chapterNum}
        ORDER BY v.verse_number
      `;
      
      // Convertir a tipo conocido
      const rows = result as any[];
      
      if (rows.length === 0) {
        return null;
      }
      
      const firstRow = rows[0];
      return {
        book: {
          id: firstRow.book_id,
          name: firstRow.book_name,
          key: firstRow.book_key,
          testament: firstRow.testament,
          description: firstRow.description
        },
        chapter: {
          id: firstRow.chapter_id,
          number: firstRow.chapter_number,
          total_verses: firstRow.total_verses,
          estimated_reading_time: firstRow.estimated_reading_time
        },
        verses: rows
          .filter(row => row.verse_id)
          .map(row => ({
            id: row.verse_id,
            number: row.verse_number,
            text: row.text,
            word_count: row.word_count
          }))
      };
    } catch (error) {
      console.error('Error obteniendo capítulo:', error);
      throw error;
    }
  }

  // Obtener lectores
  static async getReaders(): Promise<ReaderStats[]> {
    try {
      const result = await sql`
        SELECT r.id, r.name, r.avatar_color, r.reading_speed_wpm, r.is_active,
               COALESCE(stats.chapters_read, 0)::integer as chapters_read,
               COALESCE(stats.verses_read, 0)::integer as verses_read
        FROM readers r
        LEFT JOIN (
          SELECT reader_id, 
                 COUNT(DISTINCT chapter_id) as chapters_read,
                 COUNT(DISTINCT verse_id) as verses_read
          FROM reading_progress 
          WHERE is_read = true 
          GROUP BY reader_id
        ) stats ON r.id = stats.reader_id
        WHERE r.is_active = true 
        ORDER BY r.name
      `;
      
      return result as ReaderStats[];
    } catch (error) {
      console.error('Error obteniendo lectores:', error);
      throw error;
    }
  }

  // Marcar versículo como leído
  static async markVerseAsRead(readerId: number, verseId: number, isRead: boolean = true): Promise<ReadingProgress> {
    try {
      const readAt = isRead ? new Date().toISOString() : null;
      
      const result = await sql`
        INSERT INTO reading_progress (reader_id, verse_id, chapter_id, book_id, is_read, read_at)
        SELECT ${readerId}, ${verseId}, v.chapter_id, v.book_id, ${isRead}, ${readAt}
        FROM verses v WHERE v.id = ${verseId}
        ON CONFLICT (reader_id, verse_id) 
        DO UPDATE SET 
          is_read = EXCLUDED.is_read, 
          read_at = EXCLUDED.read_at
        RETURNING *
      `;
      
      const progress = result as ReadingProgress[];
      return progress[0];
    } catch (error) {
      console.error('Error marcando verso como leído:', error);
      throw error;
    }
  }

  // Obtener progreso de un lector
  static async getReaderProgress(readerId: number, chapterId?: number): Promise<any[]> {
    try {
      if (chapterId) {
        const result = await sql`
          SELECT rp.*, v.verse_number, v.text
          FROM reading_progress rp
          JOIN verses v ON rp.verse_id = v.id
          WHERE rp.reader_id = ${readerId} AND rp.chapter_id = ${chapterId}
          ORDER BY v.verse_number
        `;
        return result as any[];
      } else {
        const result = await sql`
          SELECT rp.*, v.verse_number, v.text, c.chapter_number, b.name as book_name
          FROM reading_progress rp
          JOIN verses v ON rp.verse_id = v.id
          JOIN chapters c ON rp.chapter_id = c.id
          JOIN books b ON rp.book_id = b.id
          WHERE rp.reader_id = ${readerId}
          ORDER BY b.order_index, c.chapter_number, v.verse_number
        `;
        return result as any[];
      }
    } catch (error) {
      console.error('Error obteniendo progreso:', error);
      throw error;
    }
  }

  // Obtener estadísticas generales
  static async getStats(): Promise<{
    general: GeneralStats;
    book_progress: BookStats[];
    top_readers: ReaderStats[];
    marathon: MarathonConfig | null;
  }> {
    try {
      const [generalResult, bookProgressResult, readerStatsResult, marathonResult] = await Promise.all([
        sql`
          SELECT 
            (SELECT COUNT(*)::integer FROM books) as total_books,
            (SELECT COUNT(*)::integer FROM readers WHERE is_active = true) as total_readers,
            (SELECT COUNT(*)::integer FROM reading_progress WHERE is_read = true) as total_verses_read,
            (SELECT COUNT(*)::integer FROM chapters) as total_chapters,
            (SELECT COUNT(*)::integer FROM verses) as total_verses
        `,
        sql`
          SELECT 
            b.id, b.key, b.name, b.testament, b.order_index, b.total_chapters,
            COUNT(DISTINCT v.id)::integer as total_verses,
            COUNT(DISTINCT CASE WHEN rp.is_read THEN rp.verse_id END)::integer as verses_read,
            COALESCE(ROUND((COUNT(DISTINCT CASE WHEN rp.is_read THEN rp.verse_id END)::numeric / 
                   NULLIF(COUNT(DISTINCT v.id), 0)) * 100, 2), 0) as completion_percentage
          FROM books b
          LEFT JOIN chapters c ON b.id = c.book_id
          LEFT JOIN verses v ON c.id = v.chapter_id
          LEFT JOIN reading_progress rp ON v.id = rp.verse_id AND rp.is_read = true
          GROUP BY b.id, b.key, b.name, b.testament, b.order_index, b.total_chapters
          ORDER BY b.order_index
        `,
        sql`
          SELECT r.id, r.name, r.avatar_color, r.reading_speed_wpm,
                 COUNT(DISTINCT CASE WHEN rp.is_read THEN rp.chapter_id END)::integer as chapters_read,
                 COUNT(DISTINCT CASE WHEN rp.is_read THEN rp.verse_id END)::integer as verses_read
          FROM readers r
          LEFT JOIN reading_progress rp ON r.id = rp.reader_id
          WHERE r.is_active = true
          GROUP BY r.id, r.name, r.avatar_color, r.reading_speed_wpm
          ORDER BY chapters_read DESC, verses_read DESC
          LIMIT 10
        `,
        sql`
          SELECT * FROM marathon_config 
          WHERE is_active = true 
          ORDER BY created_at DESC 
          LIMIT 1
        `
      ]);
      
      const general = (generalResult as GeneralStats[])[0];
      const bookProgress = bookProgressResult as BookStats[];
      const topReaders = readerStatsResult as ReaderStats[];
      const marathonArray = marathonResult as MarathonConfig[];
      
      return {
        general,
        book_progress: bookProgress,
        top_readers: topReaders,
        marathon: marathonArray[0] || null
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  }

  // Buscar versículos
  static async searchVerses(query: string, testament?: string, limit: number = 20): Promise<any[]> {
    try {
      const searchTerm = `%${query}%`;
      
      if (testament && ['old', 'new'].includes(testament)) {
        const result = await sql`
          SELECT 
            v.id, v.verse_number, v.text, v.word_count,
            c.chapter_number, 
            b.name as book_name, b.key as book_key, b.testament
          FROM verses v
          JOIN chapters c ON v.chapter_id = c.id
          JOIN books b ON c.book_id = b.id
          WHERE v.text ILIKE ${searchTerm} AND b.testament = ${testament}
          ORDER BY b.order_index, c.chapter_number, v.verse_number
          LIMIT ${limit}
        `;
        return result as any[];
      } else {
        const result = await sql`
          SELECT 
            v.id, v.verse_number, v.text, v.word_count,
            c.chapter_number, 
            b.name as book_name, b.key as book_key, b.testament
          FROM verses v
          JOIN chapters c ON v.chapter_id = c.id
          JOIN books b ON c.book_id = b.id
          WHERE v.text ILIKE ${searchTerm}
          ORDER BY b.order_index, c.chapter_number, v.verse_number
          LIMIT ${limit}
        `;
        return result as any[];
      }
    } catch (error) {
      console.error('Error buscando versículos:', error);
      throw error;
    }
  }
}

export default sql;