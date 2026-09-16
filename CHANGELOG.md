# Changelog

Todas las versiones notables de este proyecto se documentan en este archivo.

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
