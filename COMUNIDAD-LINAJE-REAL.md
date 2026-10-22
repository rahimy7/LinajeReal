# Comunidad de Linaje Real

La página principal incluye un asistente de solicitudes privadas, una agenda con inscripción y una galería. El equipo administra estas funciones en `/admin/comunidad`, usando su cuenta **administradora** de la instancia omnicanal. El enlace también aparece en `/admin/redes-sociales`.

## Railway

En el servicio **LinajeReal** configurar:

```dotenv
COMMUNITY_DATABASE_URL=${{LinajeReal-Omnicanal-DB.DATABASE_URL}}
PUBLIC_SITE_URL=https://www.iasdcentrallinajereal.org
OMNICHANNEL_URL=https://linajereal-omnicanal-production.up.railway.app
META_GRAPH_API_VERSION=v25.0
```

La conexión de comunidad apunta a la misma base **exclusiva** del panel de redes. No cambiar las conexiones bíblicas anteriores para activar esta función. Al primer uso se crean solamente el esquema `linaje_web` y sus tablas; no ejecutar `drizzle-kit push` sobre una base compartida ni renombrar/eliminar tablas del servicio omnicanal.

## Atención y privacidad

- Las solicitudes de oración, estudios, actividades y contacto se guardan privadas. No se envían a modelos de IA, campañas ni redes sociales.
- El visitante recibe una referencia; un humano contacta al solicitante por el medio proporcionado. El asistente no ofrece conversación en vivo.
- El panel permite marcar pendiente/en atención/completada y eliminar definitivamente una solicitud cuando corresponda a una solicitud de privacidad o al terminar su conservación.
- Las actividades necesitan título, descripción, fecha/hora de República Dominicana y lugar. Pueden guardarse como borrador, publicarse y ocultarse.
- La galería acepta direcciones HTTPS de fotografías alojadas públicamente. Solo publica imágenes cuando el administrador confirma la autorización. No incluye carga de archivos ni almacenamiento de imágenes.
- Revisar periódicamente las solicitudes completadas y eliminar información que ya no sea necesaria. No usar las solicitudes como autorización de marketing.
- La sesión de comunidad usa una cookie HttpOnly/Secure/SameSite=Strict, con máximo ocho horas, y valida el rol con OmniAI en cada petición. Los agentes sin rol administrador no acceden. No registrar respuestas privadas de `/api/community` en los logs.

## Facebook e Instagram

Se reutilizan, en el servidor, las conexiones almacenadas en `public.integration_settings` de esa misma base. Los tokens nunca se envían al visitante. Configurar las cuentas desde Ajustes del panel de redes; la presencia de credenciales no demuestra que Meta haya concedido todos los permisos.

1. Crear un borrador para Facebook o Instagram. Instagram requiere una imagen JPEG con URL pública; esta versión publica una imagen, no reels, historias ni carruseles.
2. Revisar el texto y foto y usar **Publicar ahora**. El botón requiere confirmación y la API acepta solo administradores autenticados.
3. Para mostrar publicaciones en la web, usar **Importar publicaciones** y luego **Mostrar en la web** en cada elemento revisado. No hay sincronización automática ni importación de comentarios/mensajes privados. Una nueva importación actualiza el contenido y lo devuelve a revisión antes de mostrarlo.
4. Se conserva el estado de cada intento. Si hay un resultado incierto, comprobar directamente la red antes de crear otro borrador. No se reintenta automáticamente una publicación para evitar duplicados. Si una publicación queda «En proceso» después de un reinicio, comprobar igualmente la cuenta.

Meta puede requerir aprobación de la aplicación y permisos adicionales de publicación/lectura. Facebook utiliza Pages API; Instagram requiere una cuenta profesional. Con Facebook Login y con Instagram Login los permisos son distintos. Fuentes oficiales: [Pages API](https://developers.facebook.com/docs/pages-api/posts/), [Instagram API de Meta](https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api).

## Verificación realizada

Compilación de producción y prueba de API con base PostgreSQL en memoria: aislamiento de solicitudes privadas, acceso anónimo/administrador/agente, origen de peticiones, consentimiento, inscripción en actividad publicada, galería en borrador, publicación simulada con bloqueo de duplicados y eliminación de solicitudes. Meta se simuló: no se publicó contenido real durante las pruebas. El envío del widget se comprobó también en el navegador contra una base temporal local.

`npm run check` conserva errores anteriores en BibleReader3D, MarathonFloatingWidget, ProgressManager y MaratonConfig; los archivos nuevos no agregan errores al chequeo.

