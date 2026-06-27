# Clarification: Preguntas y Aclaraciones Resueltas

## 1. Preguntas y Decisiones

### P1: ¿Qué pasa con los videos que tienen caption? ¿Deberían recibir el mismo diseño de caption que las imágenes?
* **Decisión:** Sí. Para mantener la consistencia en el chat, cualquier archivo de media (imagen, video) o documento que contenga un caption (`msg.content`) debe mostrar el texto con el mismo estilo debajo del reproductor/visualizador: una fuente de tamaño `text-sm`, color `#F0F0F5`, padding horizontal `px-1` y espaciado de margen superior adecuado (`mt-1.5` o `gap-1.5` en el contenedor `flex-col`), con `whitespace-pre-wrap` para conservar saltos de línea.

### P2: En la burbuja de documento original, se mostraba `msg.content ?? 'Documento'` como el título del archivo. Si `msg.content` ahora es el caption, ¿cuál es el nombre del archivo?
* **Decisión:** El nombre del archivo se extraerá de forma dinámica a partir de la URL del archivo (`msg.media_url`) utilizando la función helper `getFileName(url)`. Si no hay URL o el proceso de extracción falla, se mostrará el nombre por defecto "Archivo". De esta forma, liberamos el campo `msg.content` para que represente de forma exclusiva el caption que el usuario escribió junto al documento.

### P3: ¿Cómo manejamos archivos que no tienen tamaño asignado en la base de datos o que es nulo?
* **Decisión:** Si `msg.media_size_bytes` es nulo o no está definido, no se mostrará el separador ni el tamaño del archivo (solo se mostrará el tipo legible, por ejemplo, "Documento PDF" en lugar de "Documento PDF • 0 B").

### P4: ¿El componente original utiliza librerías de estilos adicionales?
* **Decisión:** El componente utiliza únicamente clases de TailwindCSS ya configuradas en el proyecto y estilos inline en React para propiedades dinámicas como el color de fondo con opacidad del ícono. No es necesario añadir dependencias ni configuraciones externas.
