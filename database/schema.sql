-- Crear extensiones (si están disponibles)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Tabla de libros bíblicos
CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    key VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    testament VARCHAR(10) CHECK (testament IN ('old', 'new')) NOT NULL,
    order_index INTEGER NOT NULL,
    total_chapters INTEGER NOT NULL,
    description TEXT,
    author VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de capítulos
CREATE TABLE chapters (
    id SERIAL PRIMARY KEY,
    book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    chapter_number INTEGER NOT NULL,
    total_verses INTEGER NOT NULL,
    estimated_reading_time INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(book_id, chapter_number)
);

-- Tabla de versículos
CREATE TABLE verses (
    id SERIAL PRIMARY KEY,
    chapter_id INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    verse_number INTEGER NOT NULL,
    text TEXT NOT NULL,
    word_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(chapter_id, verse_number)
);

-- Tabla de lectores
CREATE TABLE readers (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE,
    avatar_color VARCHAR(7) DEFAULT '#6366f1',
    is_active BOOLEAN DEFAULT true,
    total_chapters_read INTEGER DEFAULT 0,
    total_verses_read INTEGER DEFAULT 0,
    reading_speed_wpm INTEGER DEFAULT 200,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de progreso de lectura
CREATE TABLE reading_progress (
    id SERIAL PRIMARY KEY,
    reader_id INTEGER NOT NULL REFERENCES readers(id) ON DELETE CASCADE,
    verse_id INTEGER NOT NULL REFERENCES verses(id) ON DELETE CASCADE,
    chapter_id INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(reader_id, verse_id)
);

-- Configuración del maratón
CREATE TABLE marathon_config (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT false,
    current_book_id INTEGER REFERENCES books(id),
    total_participants INTEGER DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_books_testament ON books(testament);
CREATE INDEX idx_books_order ON books(order_index);
CREATE INDEX idx_chapters_book_id ON chapters(book_id);
CREATE INDEX idx_verses_chapter_id ON verses(chapter_id);
CREATE INDEX idx_verses_book_id ON verses(book_id);
CREATE INDEX idx_reading_progress_reader ON reading_progress(reader_id);
CREATE INDEX idx_reading_progress_verse ON reading_progress(verse_id);

-- Vista de estadísticas por libro
CREATE VIEW book_stats AS
SELECT 
    b.id,
    b.key,
    b.name,
    b.testament,
    b.order_index,
    b.total_chapters,
    COUNT(DISTINCT v.id) as total_verses,
    COUNT(DISTINCT CASE WHEN rp.is_read THEN rp.verse_id END) as verses_read,
    COALESCE(ROUND((COUNT(DISTINCT CASE WHEN rp.is_read THEN rp.verse_id END)::numeric / 
           NULLIF(COUNT(DISTINCT v.id), 0)) * 100, 2), 0) as completion_percentage
FROM books b
LEFT JOIN chapters c ON b.id = c.book_id
LEFT JOIN verses v ON c.id = v.chapter_id
LEFT JOIN reading_progress rp ON v.id = rp.verse_id AND rp.is_read = true
GROUP BY b.id, b.key, b.name, b.testament, b.order_index, b.total_chapters
ORDER BY b.order_index;

-- Vista de estadísticas de lectores
CREATE VIEW reader_stats AS
SELECT 
    r.id,
    r.uuid,
    r.name,
    r.email,
    r.avatar_color,
    r.is_active,
    r.reading_speed_wpm,
    COUNT(DISTINCT CASE WHEN rp.is_read THEN rp.chapter_id END) as chapters_read,
    COUNT(DISTINCT CASE WHEN rp.is_read THEN rp.verse_id END) as verses_read,
    r.created_at
FROM readers r
LEFT JOIN reading_progress rp ON r.id = rp.reader_id
GROUP BY r.id, r.uuid, r.name, r.email, r.avatar_color, r.is_active, 
         r.reading_speed_wpm, r.created_at
ORDER BY chapters_read DESC, verses_read DESC;

-- ============================================
-- DATOS INICIALES - LIBROS BÍBLICOS
-- ============================================

-- Antiguo Testamento (principales)
INSERT INTO books (key, name, testament, order_index, total_chapters, author, description) VALUES
('genesis', 'Génesis', 'old', 1, 50, 'Moisés', 'El libro de los comienzos - creación, patriarcas, y los orígenes del pueblo de Israel'),
('exodus', 'Éxodo', 'old', 2, 40, 'Moisés', 'La liberación de Egipto y la entrega de la ley en el monte Sinaí'),
('leviticus', 'Levítico', 'old', 3, 27, 'Moisés', 'Leyes ceremoniales y de santidad para el pueblo de Israel'),
('numbers', 'Números', 'old', 4, 36, 'Moisés', 'Los años de peregrinación en el desierto'),
('deuteronomy', 'Deuteronomio', 'old', 5, 34, 'Moisés', 'Repetición de la ley y últimos discursos de Moisés'),
('joshua', 'Josué', 'old', 6, 24, 'Josué', 'La conquista de la Tierra Prometida'),
('judges', 'Jueces', 'old', 7, 21, 'Samuel', 'El período de los jueces de Israel'),
('ruth', 'Rut', 'old', 8, 4, 'Samuel', 'Historia de lealtad y redención'),
('1samuel', '1 Samuel', 'old', 9, 31, 'Samuel', 'El establecimiento de la monarquía en Israel'),
('2samuel', '2 Samuel', 'old', 10, 24, 'Samuel', 'El reinado del rey David'),
('1kings', '1 Reyes', 'old', 11, 22, 'Jeremías', 'El reino unido y la división de Israel'),
('2kings', '2 Reyes', 'old', 12, 25, 'Jeremías', 'Los reinos divididos hasta el exilio'),
('psalms', 'Salmos', 'old', 19, 150, 'David y otros', 'Himnos y oraciones del pueblo de Dios'),
('proverbs', 'Proverbios', 'old', 20, 31, 'Salomón', 'Sabiduría práctica para la vida diaria'),
('ecclesiastes', 'Eclesiastés', 'old', 21, 12, 'Salomón', 'Reflexiones sobre el significado de la vida'),
('isaiah', 'Isaías', 'old', 23, 66, 'Isaías', 'Profecías sobre el Mesías y la restauración'),
('jeremiah', 'Jeremías', 'old', 24, 52, 'Jeremías', 'Advertencias sobre el juicio y promesas de restauración'),
('ezekiel', 'Ezequiel', 'old', 26, 48, 'Ezequiel', 'Visiones proféticas desde el exilio'),
('daniel', 'Daniel', 'old', 27, 12, 'Daniel', 'Profecías apocalípticas y historias de fidelidad');

-- Nuevo Testamento (completo)
INSERT INTO books (key, name, testament, order_index, total_chapters, author, description) VALUES
('matthew', 'Mateo', 'new', 40, 28, 'Mateo', 'Evangelio que presenta a Jesús como el Mesías prometido'),
('mark', 'Marcos', 'new', 41, 16, 'Marcos', 'Evangelio dinámico que muestra a Jesús en acción'),
('luke', 'Lucas', 'new', 42, 24, 'Lucas', 'Evangelio universal que presenta a Jesús como Salvador del mundo'),
('john', 'Juan', 'new', 43, 21, 'Juan', 'Evangelio espiritual que revela la divinidad de Cristo'),
('acts', 'Hechos', 'new', 44, 28, 'Lucas', 'La historia de la iglesia primitiva y la expansión del evangelio'),
('romans', 'Romanos', 'new', 45, 16, 'Pablo', 'Exposición sistemática del evangelio de la gracia'),
('1corinthians', '1 Corintios', 'new', 46, 16, 'Pablo', 'Instrucciones prácticas para la vida cristiana'),
('2corinthians', '2 Corintios', 'new', 47, 13, 'Pablo', 'Defensa del apostolado y el ministerio cristiano'),
('galatians', 'Gálatas', 'new', 48, 6, 'Pablo', 'La libertad en Cristo y la justificación por fe'),
('ephesians', 'Efesios', 'new', 49, 6, 'Pablo', 'La unidad y riquezas espirituales en Cristo'),
('philippians', 'Filipenses', 'new', 50, 4, 'Pablo', 'Gozo y contentamiento en Cristo'),
('colossians', 'Colosenses', 'new', 51, 4, 'Pablo', 'La supremacía de Cristo sobre toda creación'),
('1thessalonians', '1 Tesalonicenses', 'new', 52, 5, 'Pablo', 'Esperanza y santidad mientras esperamos a Cristo'),
('2thessalonians', '2 Tesalonicenses', 'new', 53, 3, 'Pablo', 'Perseverancia en la tribulación'),
('1timothy', '1 Timoteo', 'new', 54, 6, 'Pablo', 'Instrucciones para el liderazgo de la iglesia'),
('2timothy', '2 Timoteo', 'new', 55, 4, 'Pablo', 'Último mensaje apostólico de fidelidad'),
('titus', 'Tito', 'new', 56, 3, 'Pablo', 'Organización y liderazgo en la iglesia'),
('hebrews', 'Hebreos', 'new', 58, 13, 'Desconocido', 'La superioridad de Cristo sobre el sistema del Antiguo Testamento'),
('james', 'Santiago', 'new', 59, 5, 'Santiago', 'Fe práctica que se demuestra en obras'),
('1peter', '1 Pedro', 'new', 60, 5, 'Pedro', 'Esperanza y perseverancia en el sufrimiento'),
('2peter', '2 Pedro', 'new', 61, 3, 'Pedro', 'Advertencias contra los falsos maestros'),
('1john', '1 Juan', 'new', 62, 5, 'Juan', 'Certeza de la vida eterna y el amor cristiano'),
('2john', '2 Juan', 'new', 63, 1, 'Juan', 'Advertencia contra la falsa doctrina'),
('3john', '3 Juan', 'new', 64, 1, 'Juan', 'Hospitalidad cristiana y liderazgo'),
('jude', 'Judas', 'new', 65, 1, 'Judas', 'Contender por la fe una vez dada'),
('revelation', 'Apocalipsis', 'new', 66, 22, 'Juan', 'Revelación profética del triunfo final de Cristo');

-- ============================================
-- CREAR CAPÍTULOS INICIALES
-- ============================================

-- Génesis (primeros capítulos)
INSERT INTO chapters (book_id, chapter_number, total_verses, estimated_reading_time) VALUES
(1, 1, 31, 8), (1, 2, 25, 6), (1, 3, 24, 6), (1, 4, 26, 7), (1, 5, 32, 6);

-- Salmos (capítulos famosos)
INSERT INTO chapters (book_id, chapter_number, total_verses, estimated_reading_time) VALUES
(13, 1, 6, 2), (13, 23, 6, 3), (13, 91, 16, 4), (13, 119, 176, 25), (13, 150, 6, 2);

-- Evangelios (primeros capítulos)
INSERT INTO chapters (book_id, chapter_number, total_verses, estimated_reading_time) VALUES
(20, 1, 25, 6), (20, 2, 23, 6), (20, 3, 17, 5), -- Mateo 1-3
(21, 1, 45, 8), (21, 2, 28, 6), -- Marcos 1-2
(22, 1, 80, 12), (22, 2, 52, 8), -- Lucas 1-2
(23, 1, 51, 10), (23, 2, 25, 6), (23, 3, 36, 8); -- Juan 1-3

-- ============================================
-- VERSÍCULOS FAMOSOS DE EJEMPLO
-- ============================================

-- Génesis 1:1-5 (Creación)
INSERT INTO verses (chapter_id, book_id, verse_number, text, word_count) VALUES
(1, 1, 1, 'En el principio creó Dios los cielos y la tierra.', 10),
(1, 1, 2, 'Y la tierra estaba desordenada y vacía, y las tinieblas estaban sobre la faz del abismo, y el Espíritu de Dios se movía sobre la faz de las aguas.', 28),
(1, 1, 3, 'Y dijo Dios: Sea la luz; y fue la luz.', 10),
(1, 1, 4, 'Y vio Dios que la luz era buena; y separó Dios la luz de las tinieblas.', 16),
(1, 1, 5, 'Y llamó Dios a la luz Día, y a las tinieblas llamó Noche. Y fue la tarde y la mañana un día.', 20);

-- Salmo 23 (completo)
INSERT INTO verses (chapter_id, book_id, verse_number, text, word_count) VALUES
(6, 13, 1, 'Jehová es mi pastor; nada me faltará.', 7),
(6, 13, 2, 'En lugares de delicados pastos me hará descansar; junto a aguas de reposo me pastoreará.', 16),
(6, 13, 3, 'Confortará mi alma; me guiará por sendas de justicia por amor de su nombre.', 14),
(6, 13, 4, 'Aunque ande en valle de sombra de muerte, no temeré mal alguno, porque tú estarás conmigo; tu vara y tu cayado me infundirán aliento.', 25),
(6, 13, 5, 'Aderezas mesa delante de mí en presencia de mis angustiadores; unges mi cabeza con aceite; mi copa está rebosando.', 19),
(6, 13, 6, 'Ciertamente el bien y la misericordia me seguirán todos los días de mi vida, y en la casa de Jehová moraré por largos días.', 23);

-- Juan 1:1-5 (El Verbo)
INSERT INTO verses (chapter_id, book_id, verse_number, text, word_count) VALUES
(12, 23, 1, 'En el principio era el Verbo, y el Verbo era con Dios, y el Verbo era Dios.', 17),
(12, 23, 2, 'Este era en el principio con Dios.', 8),
(12, 23, 3, 'Todas las cosas por él fueron hechas, y sin él nada de lo que ha sido hecho, fue hecho.', 20),
(12, 23, 4, 'En él estaba la vida, y la vida era la luz de los hombres.', 14),
(12, 23, 5, 'La luz en las tinieblas resplandece, y las tinieblas no prevalecieron contra ella.', 14);

-- Juan 3:16 (versículo más famoso)
INSERT INTO verses (chapter_id, book_id, verse_number, text, word_count) VALUES
(14, 23, 16, 'Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.', 30);

-- ============================================
-- LECTORES DE EJEMPLO PARA EL MARATÓN
-- ============================================

INSERT INTO readers (name, email, avatar_color, reading_speed_wpm) VALUES
('Pastor Fernando', 'pastor@linajereal.org', '#6366f1', 220),
('Hermana Gloria', 'gloria@linajereal.org', '#ef4444', 180),
('Diácono Miguel', 'miguel@linajereal.org', '#10b981', 200),
('Anciana Carmen', 'carmen@linajereal.org', '#f59e0b', 190),
('Joven David', 'david@linajereal.org', '#8b5cf6', 210),
('Hermana Rosa', 'rosa@linajereal.org', '#ec4899', 185),
('Diácono Juan', 'juan@linajereal.org', '#06b6d4', 195),
('Anciano Pedro', 'pedro@linajereal.org', '#84cc16', 175);

-- ============================================
-- CONFIGURACIÓN DEL MARATÓN BÍBLICO
-- ============================================

INSERT INTO marathon_config (name, start_time, end_time, is_active, total_participants, description) VALUES
('Maratón Bíblico Linaje Real 2025', 
 '2025-09-24 00:00:00+00', 
 '2025-09-27 23:59:59+00', 
 true, 
 8,
 'Maratón de lectura bíblica continua de 72 horas donde la congregación de Linaje Real lee toda la Biblia de forma ininterrumpida, fortaleciendo la fe y unidad comunitaria.');

