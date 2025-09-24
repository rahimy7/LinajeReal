// server/bible/db.ts
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.NEON_DATABASE_URL) {
  throw new Error('NEON_DATABASE_URL no está definida en las variables de entorno');
}

// Crear conexión a Neon
const sql = neon(process.env.NEON_DATABASE_URL);

// Función de prueba de conexión
export async function testConnection() {
  try {
    const result = await sql`SELECT NOW() as current_time, version() as version`;
    console.log('✅ [Neon] Conexión exitosa:', result[0].current_time);
    return true;
  } catch (error) {
    console.error('❌ [Neon] Error de conexión:', error);
    return false;
  }
}

// Función para inicializar la base de datos
export async function initializeDatabase() {
  try {
    // Verificar si las tablas existen
    const tablesResult = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'books'
    `;
    
    if (tablesResult.length === 0) {
      console.log('📊 [Neon] Base de datos vacía. Necesitas aplicar el schema.');
      return false;
    }
    
    console.log('✅ [Neon] Base de datos inicializada correctamente');
    return true;
  } catch (error) {
    console.error('❌ [Neon] Error verificando base de datos:', error);
    return false;
  }
}

export default sql;