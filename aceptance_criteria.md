Checklist de validación del Frontend — Casas y Espacios Agent
FE-2 — Layout base (Sidebar + ProtectedRoute)

SIDEBAR

- [ ] Fondo rgba(37,37,34,0.8) con backdrop-blur-lg
- [ ] Ancho 256px fijo en desktop
- [ ] En móvil es un drawer que se desliza desde la izquierda
- [ ] Backdrop oscuro al abrir el drawer en móvil
- [ ] Al hacer clic en el backdrop el drawer se cierra
- [ ] Al navegar a otra ruta el drawer se cierra automáticamente
      CARD DEL USUARIO:
- [ ] Avatar circular con borde #01A4E3
- [ ] Si no tiene foto muestra iniciales en fondo #01A4E3/25
- [ ] Dot de WebSocket en esquina inferior derecha del avatar
- [ ] Dot cambia de color: connected=#01A4E3 / reconnecting=#FFB84D / disconnected=#FF5B5B
- [ ] Dot connected tiene animación ws-pulse-dot
- [ ] Nombre del asesor truncado correctamente
- [ ] Badge de rol: asesor=#01A4E3 / admin=#FF5B5B
      NAVEGACIÓN:
- [ ] Bandeja de Entrada visible para todos
- [ ] Historial Cerrados visible para todos
- [ ] Gestión Asesores visible SOLO para admin
- [ ] Mi Perfil visible para todos
- [ ] Item activo tiene fondo #01A4E3 y borde izquierdo #00D4AA
- [ ] Item inactivo tiene texto #8B8FA8
- [ ] Hover en item inactivo cambia a texto blanco
      BADGE DE ALERTAS:
- [ ] Badge rojo aparece en "Gestión Asesores" para admin
- [ ] Badge muestra el número correcto de alertas sin revisar
- [ ] Badge desaparece cuando no hay alertas
- [ ] Badge muestra "99+" si hay más de 99
      WIDGET WEBSOCKET:
- [ ] Fondo #1D1D1B con borde #3A3A37
- [ ] Texto "En línea" cuando connected
- [ ] Texto "Reconectando..." cuando reconnecting
- [ ] Texto "Sin conexión" cuando disconnected
- [ ] Dot de color correcto según estado
      BOTÓN CERRAR SESIÓN:
- [ ] Borde #FF5B5B/30
- [ ] Hover: borde #FF5B5B + bg #FF5B5B/10
- [ ] Texto e ícono en #FF5B5B
      HEADER MÓVIL:
- [ ] Solo visible en mobile (md:hidden)
- [ ] Botón hamburguesa abre el drawer
- [ ] Título correcto según la ruta activa
- [ ] Dot WebSocket + rol del asesor a la derecha
      BANNER WEBSOCKET DESCONECTADO:
- [ ] Aparece cuando WS está desconectado
- [ ] Fondo rojo con borde inferior
- [ ] Botón "Reconectar Canal" visible
- [ ] Desaparece al reconectar
      FE-3 — Login + Primer Login

LOGIN PAGE:

- [ ] Fondo radial-gradient(circle at 50% 0%, #292926 0%, #151514 100%)
- [ ] Card centrado max-w-md con fondo #252522 y borde #3A3A37
- [ ] Logo SVG de casa en color #01A4E3
- [ ] Título "Casas y Espacios " + span azul "Agent"
- [ ] Subtítulo visible
- [ ] Floating label en email sube al hacer focus
- [ ] Floating label sube cuando el campo tiene valor
- [ ] Ícono de sobre en el campo email
- [ ] Toggle de visibilidad en el campo password funciona
- [ ] Checkbox "Recordar sesión" funciona
- [ ] Link "¿Olvidó su contraseña?" alineado a la derecha
- [ ] Botón "Ingresar al sistema" h-12 con gradiente azul
- [ ] Botón muestra spinner durante el loading
- [ ] Error banner aparece con credenciales incorrectas
- [ ] Error banner NO especifica cuál campo falló
- [ ] No hay botón ni link de registro
- [ ] Panel de controles del mockup NO aparece
- [ ] Footer con copyright visible
      FIRST LOGIN PAGE:
- [ ] Mismo fondo radial-gradient que Login
- [ ] Ícono de candado en #FFB84D
- [ ] Título "Establecer nueva contraseña"
- [ ] Subtítulo explicativo visible
- [ ] Campo nueva contraseña
- [ ] Campo confirmar contraseña
- [ ] Indicador de fortaleza con 3 barras:
      Débil → barra 1 en #FF5B5B
      Media → barras 1-2 en #FFB84D
      Fuerte → barras 1-3 en #00D4AA
- [ ] Indicador responde en tiempo real al escribir
- [ ] Contraseñas que no coinciden muestran error inline
- [ ] Mínimo 8 caracteres validado
- [ ] Botón "Establecer contraseña y continuar" h-12 azul
- [ ] Botón tiene ícono de flecha derecha
      FE-4 — Bandeja de conversaciones

HEADER:

- [ ] Título "Bandeja de Entrada" con badge de total
- [ ] Indicador de asesores conectados visible
- [ ] Cada asesor muestra dot verde/gris + nombre + X/Y
- [ ] X/Y en rojo cuando el asesor está al límite
- [ ] Panel de métricas visible SOLO para admin
- [ ] Asesor NO ve las métricas
      MÉTRICAS (solo admin):
- [ ] 6 métricas en grid con colores correctos
- [ ] Activas, Escaladas, Atención, T.Promedio,
      Bot OK, Capacidad visibles
      FILTROS:
- [ ] Fondo glassmorphism rgba(37,37,34,0.6)
- [ ] Tabs de estado: Todas / Escaladas / Activas / Cerradas
- [ ] Badge rojo en tab "Escaladas"
- [ ] Select de canal a la derecha
- [ ] Botón refresh recarga desde el servidor
- [ ] Filtros funcionan correctamente
      GRID DE CARDS:
- [ ] 1 columna en mobile
- [ ] 2 columnas en sm
- [ ] 3 columnas en lg
- [ ] 4 columnas en xl
- [ ] 5 columnas en 2xl
- [ ] Gap de 16px entre cards
      VARIANTE A (escalada <10min):
- [ ] Borde izquierdo #FF5B5B
- [ ] Badge "Escalada" rojo
- [ ] "Sin asignar" en rojo con ícono warning
- [ ] Botón "Atender ya" azul habilitado
      VARIANTE A2 (escalada >15min):
- [ ] Animación criticalPulse en el borde
- [ ] Badge "CRÍTICO" fondo rojo sólido
- [ ] Timer con ícono girando en #FFB84D
- [ ] Botón "Atender ya" deshabilitado si asesor
      está al límite de conversaciones
- [ ] Tooltip "Límite alcanzado" en botón deshabilitado
      VARIANTE B (en atención):
- [ ] Borde izquierdo #FFB84D
- [ ] Badge "En Atención"
- [ ] Avatar + nombre del asesor asignado
- [ ] Botón "Ver" outline
      VARIANTE C (bot activo):
- [ ] Borde izquierdo #00D4AA
- [ ] Badge "Activa (Bot)"
- [ ] Dot verde pulsante
- [ ] Botón "Ver"
      GLASSMORPHISM DE CARDS:
- [ ] Fondo rgba(37,37,34,0.65) con backdrop-blur(12px)
- [ ] Borde rgba(58,58,55,0.5)
- [ ] Hover: translateY(-3px) + borde azul + sombra
      MODAL TOMAR CONVERSACIÓN:
- [ ] Muestra nombre del cliente
- [ ] Muestra motivo del escalado en font-mono
- [ ] Muestra tiempo de espera en #FFB84D
- [ ] Muestra "Tus conversaciones activas: X de Y"
      en verde si X < Y, rojo si X >= Y
- [ ] Botón Cancelar funciona
- [ ] Botón Confirmar llama al endpoint
- [ ] Error MAX_CONVERSATIONS_REACHED visible en modal
      ESTADO VACÍO:
- [ ] Ícono check en círculo azul
- [ ] Texto "No hay conversaciones"
- [ ] Skeleton de 2 cards mientras carga
      FE-5 — Vista de Chat

LAYOUT:

- [ ] Desktop: sidebar + feed central + panel derecho 320px
- [ ] Móvil: solo el feed, panel derecho como drawer
- [ ] Botón "Detalles" abre el drawer en móvil
      HEADER DEL CHAT:
- [ ] Botón "← Volver" navega a la bandeja
- [ ] Nombre del cliente visible
- [ ] Dot de estado correcto (rojo/amarillo/verde)
- [ ] Tiempo de espera en rojo visible
- [ ] Pill "Monitoreo" en amarillo pulsante SOLO para admin
- [ ] Botón "Detalles" visible solo en móvil
      FEED DE MENSAJES:
- [ ] Fondo #1D1D1B
- [ ] Altura h-[55vh] en móvil
- [ ] Altura calc(100vh-280px) en desktop
- [ ] Scroll ancla al último mensaje al abrir
- [ ] Scroll hacia arriba carga mensajes anteriores
- [ ] Separador de fecha centrado con pill gris
      BURBUJA INBOUND (cliente):
- [ ] Fondo #2E2E2B
- [ ] rounded-lg rounded-tl-none
- [ ] Alineada a la izquierda
- [ ] Timestamp + "Cliente" debajo
      BURBUJA OUTBOUND_BOT:
- [ ] Fondo #1F2937 con borde #3A3A37
- [ ] rounded-lg rounded-tr-none
- [ ] Label "Bot Asistente" en #00D4AA con ícono robot
- [ ] Alineada a la derecha
      BURBUJA OUTBOUND_ADVISOR:
- [ ] Fondo #01A4E3
- [ ] rounded-lg rounded-tr-none
- [ ] Nombre del asesor debajo
- [ ] Alineada a la derecha
      EVENTOS:
- [ ] Pill rojo centrado "Conversación escalada por IA"
- [ ] Pill verde pulsante "Bot retomó la conversación"
- [ ] Indicador "escribiendo..." con dots bouncing
      BARRA DE CONTEXTO:
- [ ] Fondo rgba(46,46,43,0.6)
- [ ] "Respondiendo a: [nombre] • Línea [canal]"
- [ ] "⚠️ Esperando respuesta hace X m" en #FFB84D pulsante
      INPUT DE RESPUESTA:
- [ ] Fondo #2E2E2B con borde que cambia a #01A4E3 al focus
- [ ] Botón adjuntar con dropdown de 3 opciones
- [ ] Dropdown se cierra al hacer clic fuera
- [ ] Textarea con placeholder visible
- [ ] Contador 0/2000 actualiza en tiempo real
- [ ] Enter envía el mensaje
- [ ] Shift+Enter hace salto de línea
- [ ] Botón enviar azul con ícono avión rotado 45°
      PREVIEW DE ARCHIVO:
- [ ] Aparece al seleccionar un archivo
- [ ] Ícono dinámico: imagen=azul / doc=amarillo / video=verde
- [ ] Nombre y tamaño del archivo visible
- [ ] Botón X elimina la selección
- [ ] Textarea se deshabilita con archivo seleccionado
      BANNER DE ERROR DE ENVÍO:
- [ ] Fondo #FF5B5B/10 con borde
- [ ] Botón "Reintentar" visible
- [ ] Desaparece al reintentar exitosamente
      PANEL DERECHO:
- [ ] Card de escalado IA con borde #FF5B5B
- [ ] Dot pulsante + "ANÁLISIS DE ESCALADO IA"
- [ ] Chip de diagnóstico en rojo
- [ ] Tiempo de espera y ID del escalado visibles
- [ ] Card de datos del cliente visible
- [ ] Avatar cuadrado con iniciales en #01A4E3/25
- [ ] Chip de tipo de cliente visible
- [ ] Datos: celular, cédula visibles
      VARIANTE ASSIGNED:
- [ ] Input activo
- [ ] Botón "Devolver al Bot" visible
      VARIANTE UNASSIGNED:
- [ ] Banner readonly visible en #FFB84D
- [ ] Botón "Tomar Conversación" azul h-12
      VARIANTE BOT:
- [ ] Banner "Bot retomó" verde visible
- [ ] Input oculto
      VARIANTE MONITORING (admin):
- [ ] Pill "Monitoreo" amarillo pulsante
- [ ] Sin input
      MODAL DEVOLVER AL BOT:
- [ ] Ícono verde visible
- [ ] Texto de confirmación visible
- [ ] Botón Cancelar funciona
- [ ] Botón "Confirmar devolución" outline verde
- [ ] No se puede cerrar con Escape ni click fuera
      FE-6 — Historial de cerrados

- [ ] Título y subtítulo visibles
- [ ] Botón "Exportar CSV" con ícono en #00D4AA
- [ ] Panel de filtros con glassmorphism
- [ ] Campo búsqueda col-span-2
- [ ] Select línea funciona
- [ ] Select fecha funciona
- [ ] Tabla con overflow-x-auto para scroll en móvil
- [ ] Chip canal: comercial=azul / administrativa=verde
- [ ] Nombre truncado con max-w
- [ ] Fechas: "Hoy HH:MM" / "Ayer HH:MM" / "DD/MM/YYYY"
- [ ] Resolutor muestra nombre del asesor o "Bot"
- [ ] Botón "Auditar" navega a /chat/{id}
- [ ] Búsqueda filtra por nombre y cédula en tiempo real
- [ ] Exportar CSV descarga archivo válido
- [ ] CSV incluye solo las conversaciones filtradas
- [ ] Skeleton de 3 filas mientras carga
- [ ] Estado vacío cuando no hay resultados
      FE-7 — Gestión de Asesores

HEADER:

- [ ] Título y subtítulo visibles
- [ ] Badge "🔑 ADMIN" en rojo visible
- [ ] Botón "Crear Nuevo" azul con ícono +
      FILTROS:
- [ ] Campo búsqueda con ícono lupa
- [ ] Select rol funciona
- [ ] Select área funciona
- [ ] Búsqueda filtra por nombre y email
      TABLA:
- [ ] overflow-x-auto para scroll en móvil
- [ ] Avatar con iniciales 32px
- [ ] Nombre en bold truncado
- [ ] Email truncado en #8B8FA8
- [ ] Chip rol: asesor=#01A4E3 / admin=#FF5B5B
- [ ] Chip área: administrativa=#00D4AA / comercial=#01A4E3
- [ ] Límite conversaciones con " máx." en gris
- [ ] Toggle activo/inactivo funciona
- [ ] Al desactivar abre modal de advertencia
- [ ] Cancelar en modal revierte el toggle
- [ ] Botón "Editar" en #01A4E3
- [ ] Skeleton de 3 filas mientras carga
      MODAL CREAR:
- [ ] Campos: nombre, email, contraseña, rol, área,
      especialidad, límite
- [ ] Select especialidad es dinámico según el área:
      administrativa → financiera / mantenimiento / general
      comercial → comercial / general
      ambas → solo general
- [ ] Select límite va de 1 a 10, default 3
- [ ] Nota amarilla sobre contraseña temporal visible
- [ ] Email duplicado muestra error en el modal
- [ ] Botón "Crear asesor" con spinner al guardar
      MODAL EDITAR:
- [ ] Email solo lectura con ícono candado
- [ ] Especialidad dinámica según área
- [ ] Botón "Guardar cambios" con spinner
      MODAL DESACTIVAR:
- [ ] Ícono advertencia en #FFB84D con animate-pulse
- [ ] Texto sobre conversaciones activas visible
- [ ] Botón rojo "Desactivar de todas formas"
- [ ] Botón outline "Cancelar"
      PANEL DE ALERTAS DE COMPORTAMIENTO:
- [ ] Solo visible para admin
- [ ] Badge con número de alertas sin revisar
- [ ] Select filtro por asesor funciona
- [ ] Select filtro por severidad funciona
- [ ] Chip tipo: lenguaje_inapropiado=#FF5B5B /
      tono_agresivo=#FFB84D
- [ ] Chip severidad: alta=#FF5B5B / media=#FFB84D / baja=#8B8FA8
- [ ] Fechas en formato Bogotá (Hoy/Ayer/DD/MM/YYYY)
- [ ] "Ver conversación" navega al chat correcto
- [ ] "Marcar revisada" elimina la alerta de la lista
- [ ] Badge del sidebar se decrementa al marcar revisada
- [ ] Estado vacío con ícono check verde
- [ ] Skeleton mientras carga
      FE-8 — Perfil del Asesor

CARD DE INFORMACIÓN:

- [ ] Avatar circular con borde #01A4E3
- [ ] Si no tiene foto muestra iniciales
- [ ] Botón cámara en esquina inferior derecha del avatar
- [ ] Nombre editable al hacer clic en él o en el lápiz
- [ ] Borde del nombre aparece al hacer hover/focus
- [ ] Borde cambia a #01A4E3 al editar
- [ ] Enter guarda el nombre automáticamente
- [ ] Escape cancela sin guardar
- [ ] Spinner mientras guarda el nombre
- [ ] Email con ícono candado no editable
- [ ] Badge de rol con color correcto
- [ ] Badge de área con tooltip explicativo
- [ ] Skeleton mientras carga
      SECCIÓN MI DISPONIBILIDAD:
- [ ] Dot + texto con color correcto según estado actual
- [ ] Si hay status_until muestra "Disponible a las HH:MM"
- [ ] Tres pills seleccionables: Disponible/En descanso/
      No disponible
- [ ] Pill seleccionado tiene color correcto
- [ ] Selector de timer aparece solo para break y offline
- [ ] Opciones de timer: 15min / 30min / 1hora / Sin límite
- [ ] Con timer → texto verde informativo
- [ ] Sin límite → texto amarillo de advertencia
- [ ] Botón "Aplicar" con spinner al guardar
- [ ] Dot del sidebar se actualiza vía WebSocket
      CARD DE CONTRASEÑA:
- [ ] Grid 2 columnas: actual + nueva
- [ ] Contraseña actual incorrecta → error descriptivo
- [ ] Contraseña actualizada → mensaje verde 3s
- [ ] Botón con spinner al guardar
      CARD DE HORARIOS:
- [ ] Título e subtítulo visibles
- [ ] Lista de intervalos existentes
- [ ] Horario en font-mono (HH:MM - HH:MM)
- [ ] Días activos en azul, inactivos en gris
- [ ] Toggle activa/desactiva con optimistic update
- [ ] Toggle revierte si falla la actualización
- [ ] Botón eliminar abre modal de confirmación
- [ ] Confirmar eliminación quita el item
- [ ] Botón "Agregar intervalo" outline azul
- [ ] Modal valida hora fin > hora inicio
- [ ] Modal valida al menos un día seleccionado
- [ ] Estado vacío cuando no hay intervalos
- [ ] Skeleton mientras carga
      FE-9 — Grabación de audio

- [ ] Botón micrófono mismo estilo que botón adjuntar
- [ ] Estado idle: solo botón visible
- [ ] Estado requesting_permission: spinner
- [ ] Estado recording: dot rojo pulsante + MM:SS + botón stop
- [ ] Aviso "Límite próximo" cuando quedan 30 segundos
- [ ] Se detiene automáticamente a los 2 minutos
- [ ] Estado preview: reproductor + botón enviar + cancelar
- [ ] Estado sending: spinner + texto
- [ ] Estado error: mensaje + botón reintentar
- [ ] Permiso denegado muestra mensaje descriptivo
- [ ] Botón deshabilitado cuando variant !== 'assigned'
- [ ] Al desmontar el componente se libera el stream
      FE-10 — WebSocket en tiempo real

- [ ] Conexión se establece al abrir el panel
- [ ] Token inválido cierra con código 4001 sin reconectar
- [ ] Reconnexión automática con delays 1/2/4/8/30s
- [ ] Ping cada 30s mantiene la conexión activa
- [ ] escalation.new → bandeja recarga conversaciones
- [ ] message.new → chat agrega mensaje al feed
- [ ] conversation.returned → chat recarga conversación
- [ ] behavior.alert → badge de alertas se incrementa
- [ ] advisor.connected → indicador de asesores actualiza
- [ ] advisor.disconnected → indicador de asesores actualiza
- [ ] advisor.status_changed → dot del sidebar actualiza
- [ ] Sonido ping cuando llega escalation.new
      y el panel no está en foco
- [ ] Al desmontar el WS se cierra limpio
      FE-11 — Modal sesión expirada

- [ ] Overlay cubre toda la UI incluyendo el sidebar
- [ ] z-index mayor que cualquier otro elemento
- [ ] Click fuera del card NO cierra el modal
- [ ] Escape NO cierra el modal
- [ ] Ícono candado en rojo
- [ ] Título "Tu sesión ha expirado"
- [ ] Texto explicativo visible
- [ ] Botón "Ir al login" ancho completo azul h-12
- [ ] Botón limpia sessionExpired, cierra sesión
      de Supabase y navega a /login
- [ ] Después del login el modal no vuelve a aparecer
- [ ] Aparece automáticamente cuando el backend
      devuelve 401
      FE-16 — Toast nueva escalación

- [ ] Aparece al llegar escalation.new vía WS
- [ ] Posición fixed top-24 right-4
- [ ] Borde izquierdo #FF5B5B
- [ ] Ícono campana con animate-bounce
- [ ] Nombre del cliente visible
- [ ] Motivo en font-mono color #FF5B5B
- [ ] Botón "Ignorar" descarta manualmente
- [ ] Botón "Atender ya" navega a /chat/{id} y descarta
- [ ] Se auto-descarta a los 8 segundos
- [ ] Animación slide-in desde la derecha
- [ ] No se superpone con SuccessToast
      FE-17 — Toast operaciones exitosas

- [ ] Posición fixed top-24 right-4
- [ ] Borde izquierdo #00D4AA
- [ ] Ícono check verde
- [ ] Título "Operación Exitosa"
- [ ] Mensaje dinámico correcto por operación:
      Crear asesor → "Asesor creado exitosamente"
      Editar asesor → "Cambios guardados"
      Cambiar contraseña → "Contraseña actualizada"
      Marcar alerta → "Alerta marcada como revisada"
      Reconexión WS → "✅ Conexión restaurada"
- [ ] Se auto-descarta a los 4 segundos
- [ ] z-index menor que EscalationToast
      FE-18 — Adjuntar archivos

- [ ] Dropdown muestra 3 opciones con íconos y colores:
      Imagen → azul / Documento → amarillo / Video → verde
- [ ] "JPG, PNG, WEBP" / "PDF, DOCX, XLSX" / "MP4" visibles
- [ ] Dropdown se cierra al hacer clic fuera
- [ ] File picker se abre con el accept correcto por tipo
- [ ] Archivo > límite muestra error antes de enviar:
      imagen > 5MB / video > 16MB / documento > 20MB
- [ ] Preview muestra nombre, tamaño e ícono correcto
- [ ] Botón X elimina la selección
- [ ] Textarea se deshabilita con archivo seleccionado
- [ ] Botón adjuntar deshabilitado con archivo seleccionado
- [ ] El archivo llega al cliente en WhatsApp
- [ ] El mensaje aparece en el feed del chat
      GENERAL — Aplica a todas las pantallas

TIPOGRAFÍA Y COLORES:

- [ ] Solo se usan colores de la paleta aprobada
- [ ] Texto principal en #F0F0F5
- [ ] Texto secundario en #8B8FA8
- [ ] Fondos: #1D1D1B / #252522 / #2E2E2B
- [ ] Bordes siempre en #3A3A37
- [ ] Chips siempre con patrón bg-[color]/15 text-[color]
      RESPONSIVE:
- [ ] Ninguna pantalla tiene scroll horizontal en desktop
- [ ] Todas las tablas tienen overflow-x-auto en móvil
- [ ] Los modales son usables en móvil
      ESTADOS DE CARGA:
- [ ] Skeleton aparece en todas las listas mientras cargan
- [ ] Spinner en todos los botones de acción mientras guardan
- [ ] Estado vacío en todas las listas cuando no hay datos
      TYPESCRIPT:
- [ ] npx tsc --noEmit sin errores en todo el proyecto
      ACCESIBILIDAD BÁSICA:
- [ ] Todos los botones tienen title o aria-label
- [ ] Los toggles tienen role="switch" y aria-checked
- [ ] Los modales bloquean el scroll del body al abrirse
