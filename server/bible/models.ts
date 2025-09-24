// server/bible/models.ts
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Pool de conexiones PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER || 'biblia_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'linaje_real_biblia',
  password: process.env.DB_PASSWORD || 'biblia2025',
  port: parseInt(process.env.DB_PORT || '5432'),
});

// Tipos TypeScript
export interface Book {
  id: number;
  key: string;
  name: string;
  testament: 'old' | 'new';
  order_index: number;
  total_chapters: number;
  author?: string;
}

export interface Chapter {
  id: number;
  book_id: number;
  chapter_number: number;
  total_verses: number;
  estimated_reading_time: number;
}

export interface Verse {
  id: number;
  chapter_id: number;
  book_id: number;
  verse_number: number;
  text: string;
  word_count: number;
}

export interface Reader {
  id: number;
  uuid: string;
  name: string;
  email?: string;
  avatar_color: string;
  is_active: boolean;
  total_chapters_read: number;
  total_verses_read: number;
  reading_speed_wpm: number;
}

export interface ReadingProgress {
  id: number;
  reader_id: number;
  verse_id: number;
  chapter_id: number;
  book_id: number;
  is_read: boolean;
  read_at?: Date;
  notes?: string;
}

// Funciones de consulta
export class BibleModel {
  // Obtener todos los libros
  static async getAllBooks(testament?: string): Promise<Book[]> {
    let query = 'SELECT * FROM books';
    const params: any[] = [];
    
    if (testament && ['old', 'new'].includes(testament)) {
      query += ' WHERE testament = $1';
      params.push(testament);
    }
    
    query += ' ORDER BY order_index';
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  // Obtener un libro específico
  static async getBookByKey(key: string): Promise<Book | null> {
    const query = 'SELECT * FROM books WHERE key = $1';
    const result = await pool.query(query, [key]);
    return result.rows[0] || null;
  }

  // Obtener capítulo con versículos
  static async getChapterWithVerses(bookKey: string, chapterNum: number) {
    const query = `
      SELECT 
        b.id as book_id, b.name as book_name, b.key as book_key, b.testament,
        c.id as chapter_id, c.chapter_number, c.total_verses,
        v.id as verse_id, v.verse_number, v.text, v.word_count
      FROM books b
      JOIN chapters c ON b.id = c.book_id
      LEFT JOIN verses v ON c.id = v.chapter_id
      WHERE b.key = $1 AND c.chapter_number = $2
      ORDER BY v.verse_number
    `;
    
    const result = await pool.query(query, [bookKey, chapterNum]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    // Estructurar respuesta
    const firstRow = result.rows[0];
    return {
      book: {
        id: firstRow.book_id,
        name: firstRow.book_name,
        key: firstRow.book_key,
        testament: firstRow.testament
      },
      chapter: {
        id: firstRow.chapter_id,
        number: firstRow.chapter_number,
        total_verses: firstRow.total_verses
      },
      verses: result.rows
        .filter(row => row.verse_id)
        .map(row => ({
          id: row.verse_id,
          number: row.verse_number,
          text: row.text,
          word_count: row.word_count
        }))
    };
  }

  // Obtener lectores
  static async getReaders(): Promise<Reader[]> {
    const query = 'SELECT * FROM readers WHERE is_active = true ORDER BY name';
    const result = await pool.query(query);
    return result.rows;
  }

  // Marcar versículo como leído
  static async markVerseAsRead(readerId: number, verseId: number, isRead: boolean = true) {
    const query = `
      INSERT INTO reading_progress (reader_id, verse_id, chapter_id, book_id, is_read, read_at)
      SELECT $1, $2, v.chapter_id, v.book_id, $3, $4
      FROM verses v WHERE v.id = $2
      ON CONFLICT (reader_id, verse_id) 
      DO UPDATE SET is_read = EXCLUDED.is_read, read_at = EXCLUDED.read_at
      RETURNING *
    `;
    
    const readAt = isRead ? new Date() : null;
    const result = await pool.query(query, [readerId, verseId, isRead, readAt]);
    return result.rows[0];
  }

  // Obtener progreso de un lector
  static async getReaderProgress(readerId: number, chapterId?: number) {
    let query = `
      SELECT rp.*, v.verse_number, v.text
      FROM reading_progress rp
      JOIN verses v ON rp.verse_id = v.id
      WHERE rp.reader_id = $1
    `;
    
    const params = [readerId];
    
    if (chapterId) {
      query += ' AND rp.chapter_id = $2';
      params.push(chapterId);
    }
    
    query += ' ORDER BY v.verse_number';
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  // Obtener estadísticas generales
  static async getStats() {
    const queries = await Promise.all([
      pool.query('SELECT COUNT(*) as total_books FROM books'),
      pool.query('SELECT COUNT(*) as total_readers FROM readers WHERE is_active = true'),
      pool.query('SELECT COUNT(*) as total_verses_read FROM reading_progress WHERE is_read = true'),
      pool.query('SELECT * FROM book_stats ORDER BY order_index')
    ]);
    
    return {
      general: {
        total_books: parseInt(queries[0].rows[0].total_books),
        total_readers: parseInt(queries[1].rows[0].total_readers),
        total_verses_read: parseInt(queries[2].rows[0].total_verses_read)
      },
      book_progress: queries[3].rows
    };
  }
}

export default pool;