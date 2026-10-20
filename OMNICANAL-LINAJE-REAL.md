# Redes sociales dentro de Linaje Real

La ruta `/admin/redes-sociales` integra el panel completo de la instancia
dedicada mediante un marco dentro de la web de Linaje Real. Las conversaciones,
credenciales, usuarios y permisos los administra OmniAI en su propio servidor y
base de datos. No se copian datos de otros clientes ni se usa la contraseña
antigua del maratón bíblico para acceder a las conversaciones.

## Railway: instancia independiente

Crear un servicio **LinajeReal-Omnicanal** desde `rahimy7/Redessociales`, usando
el Dockerfile del repositorio. Crear una base PostgreSQL nueva y exclusiva.
No duplicar la instancia publicada ni copiar sus variables o su base de datos.

Variables del servicio nuevo:

```dotenv
CLIENT_ID=linaje-real
DATABASE_URL=<referencia a la nueva base PostgreSQL>
SESSION_SECRET=<secreto aleatorio exclusivo>
ADMIN_EMAIL=<correo del administrador de la iglesia>
ADMIN_PASSWORD=<contraseña exclusiva>
APP_TIMEZONE=America/Santo_Domingo
AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1
AI_INTEGRATIONS_OPENAI_API_KEY=
```

La clave de IA puede quedar vacía hasta activar el asistente. Nunca incluir
estos secretos en GitHub, en archivos públicos ni en variables VITE_.

Configurar explícitamente en Railway (no depender de railway.json para un
servicio nuevo):

- Compilación: Dockerfile raíz del repositorio.
- Pre-despliegue: `pnpm --filter @workspace/db run push`.
- Inicio: `node --enable-source-maps artifacts/api-server/dist/index.mjs`.
- Comprobación de salud: `/api/readyz`.
- Puerto HTTP: `8080`.

El esquema se aplica solamente a la base nueva. Confirmar antes de publicar que
`DATABASE_URL` no referencia una base existente de otro servicio.

## Conectar la web

1. Publicar la instancia exclusiva y generar su dominio HTTPS.
2. Verificar que `/api/readyz` devuelve `status: ok`, `db: ok` y
   `client: linaje-real`.
3. En el servicio web **LinajeReal**, establecer `OMNICHANNEL_URL` al origen HTTPS
   de esa instancia, sin rutas ni credenciales. Ejemplo: `https://DOMINIO`.
4. Publicar los cambios de la web y abrir `/admin/redes-sociales`.
5. Entrar con el administrador de la iglesia. Crear los agentes y asignar sus
   vistas desde Administración.
6. En Configuración del panel conectar las cuentas de Meta de la iglesia y
   registrar los webhooks en esa instancia. El acceso a cada canal requiere las
   autorizaciones correspondientes de Meta.

El panel conserva su autenticación en su origen independiente. Las API de
mensajes siguen protegidas por la sesión de OmniAI. La ruta exterior de la web
solo muestra el estado y el marco de inicio de sesión; no expone conversaciones.
El acceso antiguo del maratón y sus API no se han migrado en este cambio.

## Verificación necesaria antes de darlo por activo

- Confirmar identidad de instancia, base exclusiva y acceso con contraseña.
- Abrir el panel dentro de la web en escritorio y móvil; comprobar que las
  políticas del navegador permiten el almacenamiento de sesión del marco.
- Confirmar que el servidor del panel permite ser incrustado desde el dominio
  de Linaje Real. Si se añaden cabeceras CSP, autorizar únicamente ese origen.
- Probar lectura y una respuesta autorizada en cada canal conectado; no usar
  conversaciones reales para pruebas sin autorización.
- La instalación local no publica automáticamente los cambios de la web en
  GitHub ni modifica OmniAI publicado.

## Comprobaciones locales

```text
node --import tsx --test server/omnichannel.test.ts
npm run check
npm run build
```
