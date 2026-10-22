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

El panel lee las publicaciones existentes de las cuentas de la iglesia mediante sus conexiones de Meta. Permite importarlas, revisarlas y mostrarlas u ocultarlas en la página principal con enlace al original. Esta función no crea publicaciones ni envía contenido a las redes sociales.

La importación es manual, de las últimas doce publicaciones por cuenta. Cada importación devuelve los elementos recibidos a revisión antes de mostrarlos. Meta debe conceder acceso de lectura a las cuentas conectadas. Los tokens se utilizan exclusivamente en el servidor.

## Verificación realizada

Compilación de producción y prueba de API con base PostgreSQL en memoria: aislamiento de solicitudes privadas, acceso anónimo/administrador/agente, origen de peticiones, consentimiento, inscripción en actividad publicada, galería en borrador, publicación simulada con bloqueo de duplicados y eliminación de solicitudes. Meta se simuló: no se publicó contenido real durante las pruebas. El envío del widget se comprobó también en el navegador contra una base temporal local.

`npm run check` conserva errores anteriores en BibleReader3D, MarathonFloatingWidget, ProgressManager y MaratonConfig; los archivos nuevos no agregan errores al chequeo.

