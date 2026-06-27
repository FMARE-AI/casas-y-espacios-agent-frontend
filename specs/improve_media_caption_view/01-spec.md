# Spec: Mejorar visualización de documentos y media con caption

## 1. Problema y Contexto

Actualmente en el chat del panel web interno:
1. **MIME type crudo en documentos:** Los mensajes de tipo `document` muestran el MIME type completo devuelto por Meta/Supabase (por ejemplo, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` o `application/pdf`) en lugar de etiquetas claras y legibles como "Documento Word" o "Documento PDF".
2. **Íconos genéricos:** Se utiliza un único ícono de documento genérico para todos los tipos de archivos adjuntos.
3. **Pérdida de captions de asesor/cliente en documentos y media:** Cuando se envía un documento o imagen con un texto acompañante (caption), este no se muestra correctamente o no se visualiza al lado del archivo de forma integrada en el feed de chat del asesor, afectando la experiencia de lectura. En documentos, el campo `content` (que contiene el caption o texto del mensaje) se usaba incorrectamente como nombre del archivo en lugar de extraerlo de la URL y mostrar el caption abajo.

## 2. Requerimientos de la Feature

### 2.1 MIME Type Legible
Mapear los MIME types más comunes de WhatsApp a etiquetas amigables en español:
* `image/jpeg`, `image/png`, `image/webp` -> Imagen
* `video/mp4`, `video/3gpp` -> Video
* `application/pdf` -> Documento PDF
* `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `application/msword` -> Documento Word
* `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `application/vnd.ms-excel` -> Hoja de cálculo Excel
* `audio/ogg`, `audio/amr` -> Nota de voz
* `audio/mpeg`, `audio/mp4`, `audio/aac` -> Audio / Nota de voz
* Cualquier otro MIME type no soportado explícitamente se mostrará como "Archivo".

### 2.2 Íconos Personalizados por Tipo de Archivo
Asignar un emoji/ícono y un color de fondo para la previsualización según el tipo de archivo:
* **PDF:** Ícono 📕, color rojo (`#FF5B5B`)
* **Word:** Ícono 📘, color azul (`#01A4E3`)
* **Excel:** Ícono 📗, color verde (`#00D4AA`)
* **Video:** Ícono 🎥, color naranja/amarillo (`#FFB84D`)
* **Audio:** Ícono 🎤, color azul (`#01A4E3`)
* **Genérico:** Ícono 📄, color gris (`#8B8FA8`)

### 2.3 Rediseño de Burbuja de Documento
La burbuja de documento debe verse compacta y elegante. Consistirá en:
1. Una caja/tarjeta clickeable que actúa como enlace de descarga (`<a>`).
2. Un contenedor para el ícono con color de fondo semi-transparente personalizado (`color + "20"` para opacidad al 12%).
3. Nombre de archivo extraído dinámicamente de la URL de manera limpia.
4. Tipo de archivo formateado legiblemente + tamaño en KB/MB (si está disponible).
5. Un botón o indicador visual de descarga (`↓`).
6. El caption o texto del mensaje abajo de la tarjeta si existe `msg.content`.

### 2.4 Rediseño de Burbuja de Imagen
Para imágenes que contengan un caption (`msg.content`), este debe mostrarse con una separación tipográfica limpia debajo de la imagen, con alineación izquierda y en un tamaño de fuente de `text-sm`, asegurando una lectura natural del mensaje sin bordes ni padding extra innecesario.

## 3. Criterios de Aceptación

- [ ] Los tipos MIME de PDF, Word y Excel se traducen a etiquetas legibles.
- [ ] Los íconos y colores cambian dinámicamente de acuerdo al tipo de archivo.
- [ ] El nombre de archivo se parsea desde la URL decodificando caracteres especiales y sin query params.
- [ ] El tamaño de los archivos se formatea correctamente en B, KB o MB.
- [ ] Al hacer clic en un documento, este se abre/descarga en una pestaña nueva.
- [ ] Si existe un caption (`content`), se muestra debajo del documento o imagen con fuente `text-sm` y color `#F0F0F5`.
- [ ] La compilación de TypeScript no produce ningún error (`npx tsc --noEmit` exitoso).
