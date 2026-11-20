# Casos de prueba

Los resultados son parciales cuando no se cubrió cada paso del caso. Ninguno se declara aprobado si queda pendiente la prueba real de micrófono, grabación o cuota.

## PF-01 — Flujo de nota, texto, imagen y voz

- **Propósito:** verificar alta/consulta/edición de una nota de texto con imagen, dictado en vivo dentro de la nota, grabación, reproducción y eliminación del audio asociado; confirmar que el dictado no aparece en Materias.
- **Precondiciones:** Chrome o Edge actualizado; sitio servido en `localhost` o HTTPS; IndexedDB disponible; permiso de micrófono y dispositivo de audio funcional.
- **Pasos:** abrir Notas; crear título, texto y etiqueta; seleccionar una imagen y pegar otra; dictar una frase en español; iniciar/detener grabación; guardar; reproducir; recargar; editar la nota y quitar una grabación; guardar.
- **Esperado:** la búsqueda/filtro encuentra la nota; imágenes comprimidas y audio quedan asociados; el dictado agrega texto al contenido solo dentro de la nota; el audio se reproduce tras recargar y muestra que no se transcribe; edición se persiste.
- **Obtenido:** En navegador integrado se creó, consultó, editó, recargó y eliminó una nota de texto; se seleccionó una imagen y se simuló el evento `paste` con archivo de imagen. Dictado y grabación física no se ejecutaron.
- **Estado:** Parcial.
- **Evidencia:** ejecución interactiva en `file://`; rutas implementadas en `app.js`. Falta validar micrófono, MediaRecorder y persistencia de un audio real.

## PF-02 — Nota vacía y archivo inválido

- **Propósito:** confirmar que no se guardan notas incompletas y que se rechazan archivos que no sean imágenes o no se puedan decodificar.
- **Precondiciones:** aplicación abierta y almacenamiento local disponible.
- **Pasos:** intentar guardar con título vacío; intentar guardar con título pero sin contenido ni imagen; seleccionar un archivo de texto renombrado como imagen; pegar un archivo no-imagen, si el navegador permite probarlo.
- **Esperado:** mensajes visibles para título requerido y contenido/imagen requeridos; archivos inválidos se rechazan de forma controlada y la interfaz sigue disponible.
- **Obtenido:** En navegador se verificaron los mensajes por título vacío, nota sin contenido/imagen y rechazo de `README.md` como archivo no-imagen. No se probó una imagen MIME válida cuyo contenido no decodifique.
- **Estado:** Parcial.
- **Evidencia:** ejecución interactiva en `file://`; validación y compresión en `app.js`.

## PF-03 — Navegador sin voz y cuota agotada

- **Propósito:** comprobar la alternativa sin SpeechRecognition y el manejo de errores de cuota.
- **Precondiciones:** navegador sin `SpeechRecognition`/`webkitSpeechRecognition` o entorno de prueba que lo desactive; cuota local agotada o simulada mediante DevTools.
- **Pasos:** abrir editor sin API de voz; comprobar mensaje y guardar una nota escrita; forzar error de cuota al guardar una nota/imagen/audio.
- **Esperado:** la escritura manual sigue disponible; se muestra error amigable de soporte; al agotarse cuota se informa que el almacenamiento está lleno sin romper la interfaz.
- **Obtenido:** El navegador de prueba sí expone SpeechRecognition; no se probó navegador sin la API ni agotamiento real/simulado de cuota.
- **Estado:** Pendiente.
- **Evidencia:** ramas de soporte y `QuotaExceededError` en `app.js`; falta evidencia de navegador.

## PF-04 — Persistencia, edición y eliminación tras recarga

- **Propósito:** verificar CRUD y persistencia de metadatos, imágenes y blobs de audio.
- **Precondiciones:** IndexedDB habilitado; al menos una nota con imagen y una grabación guardadas.
- **Pasos:** recargar la página; localizar la nota por título/etiqueta/contenido; editar título o etiqueta; guardar y recargar; eliminar la nota y confirmar.
- **Esperado:** cambios sobreviven recargas; eliminar la nota elimina también sus grabaciones asociadas; el resto de datos no cambia.
- **Obtenido:** Se recargó el navegador y se confirmó persistencia de una nota de texto; luego se editó, volvió a recargar y eliminó. Persistencia y reproducción de audio real aún sin comprobar.
- **Estado:** Parcial.
- **Evidencia:** ejecución interactiva en `file://`; stores y transacción de IndexedDB en `app.js`.

## Validaciones técnicas ejecutadas

- `node --check` no disponible: Node.js no está instalado en el entorno. En el navegador se compiló el contenido de `app.js` y `sw.js` con `new Function` y ambos pasaron; además se cargó la aplicación sin errores de ejecución.
- Se cargaron los recursos por HTTP local; se verificaron las rutas de CSS, JavaScript, manifest e icono.
- Se comprobó navegación y carga de recursos sin red mediante el Service Worker.
- La carga de datos de prueba se invocó dos veces con una nota de muestra previa (ID aleatorio del formato anterior): quedaron tres notas en total, la previa se conservó y no se duplicó.
- No se ha probado micrófono/dispositivo real, navegador sin Web Speech API, cuota agotada ni comportamiento offline en Chrome/Edge físicos.
