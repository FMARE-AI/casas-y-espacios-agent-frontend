# Changelog

Todas las versiones notables de este proyecto se documentan en este archivo.

## [2.5.0] - 2026-09-21

### Added
- Ventana de 24 h de WhatsApp visible en el panel: estado, contador vivo y bloqueo del composer cuando está vencida.

### Fixed
- El historial ordena las conversaciones cerradas de la más reciente a la más antigua, siguiendo la columna "Fecha de Cierre".
- El historial ya no rompe la vista completa cuando una fila trae una fecha de cierre ilegible: muestra un guion en su lugar.
- La ventana de 24 h se refresca cuando el cliente escribe, en vez de descontar hasta cero sobre una ventana ya reabierta.
- Se cierra la vía de envío de audio que quedaba abierta cuando responder estaba bloqueado.
- Recuperación de WebSocket muerto y de suscripciones de chat sordas.
- Se espera a que pasen las reconexiones rápidas antes de mostrar el banner de "reconectando".
- Al volver a la pestaña se sondea el socket en vez de descartar una conexión sana.
- Las imágenes entrantes se muestran una vez que su URL de Storage queda parcheada.
- Se desbloquea el `AudioContext` en el primer gesto y se reintenta la suscripción WS de la conversación.

## [2.4.0] - 2026-09-15

### Added
- Manejo del evento WS `conversation.new` para actualizar la lista de bandeja en vivo.
- Nuevo canvas para editar imágenes.
- Toggle de control manual del bot (take-control) en el header del chat.
- Mensaje de escalamiento actualizado en el chat cuando el asesor toma control manual.
- Documentación actualizada con nuevo endpoint en la referencia de la API del panel.

### Fixed
- Se elimina el prefijo `wam_id` para mostrar correctamente los nombres reales de archivos de documentos.
- Recarga de la lista de bandeja cuando `message.new` apunta a una conversación desconocida.
- Vista previa del primer frame en lugar de recuadro negro para videos no reproducidos.
- Error de build: `null` no asignable a `src`/`href` de video/anchor.
- Actualización en vivo (live-patch) de `media_url` ante el evento WS `message.media_updated`.
- Se eliminan banners duplicados de "toma de control" y el mensaje de despedida en cierres manuales.
- Corrección en el componente de video.

## [2.3.0] - anterior

Ver historial de tags anterior a este changelog.
