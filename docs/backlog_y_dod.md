# Backlog y Definition of Done

## Elementos terminados en este incremento

- [x] Navegación y CRUD local de notas con título, contenido, etiqueta e imágenes.
- [x] Búsqueda por título, etiqueta y contenido; filtro de etiqueta.
- [x] Selección y pegado de imágenes, validación MIME/decodificación y compresión con Canvas.
- [x] Dictado en vivo en español con indicación de estado y mensajes de soporte/permisos.
- [x] Grabación local mediante MediaRecorder; blobs y metadatos persisten en IndexedDB; reproducción y eliminación asociadas a la nota.
- [x] Manejo visible de notas incompletas y errores de persistencia, incluida cuota agotada.
- [x] Tres notas de prueba distinguibles, con imágenes generadas como data URL base64 y etiquetas; carga idempotente que no borra, reemplaza ni duplica datos.
- [x] Botón de transcripción con explicación honesta del bloqueo; no presenta dictado en vivo como transcripción del archivo.
- [x] Documentación del alcance, limitaciones, flujo y casos de prueba.

## Pendientes (v2)

- [ ] Elegir, integrar y evaluar un motor/modelo local para transcribir archivos de audio. Un modelo Whisper pequeño implica pesos del orden de decenas de MB (la variante `tiny` multilingüe ronda 75 MB), runtime adicional y consumo considerable de memoria/CPU; falta decidir carga inicial frente a descarga bajo demanda, licencia, idiomas y dispositivos mínimos.
- [ ] Ejecutar pruebas manuales de micrófono, permisos, grabación, reproducción, cuota agotada, portapapeles y operación sin red en Chrome y Edge reales.
- [ ] Definir estrategia de exportación/importación para notas y blobs de audio. El respaldo previo solo cubre materias y fotos.
- [ ] Evaluar accesibilidad con teclado/lector de pantalla y añadir confirmación/recuperación para acciones destructivas si los usuarios lo requieren.

## Descartados para este alcance

- **Backend, cuentas, sincronización y nube:** se descartan porque la consigna delimita la entrega a una aplicación 100 % client-side, sin servicios ni bases de datos externas. Implicarían infraestructura y envío de datos que contradicen el alcance y las expectativas de privacidad.
- **Trabajo colaborativo remoto y flujo de múltiples ramas:** se descartan para esta entrega individual. GitHub Flow se adapta a una persona mediante cambios acotados, historial y publicación del incremento; no se atribuyen revisiones o colaboración que no estén verificadas.
- **Transcripción simulada o envío del audio grabado a un proveedor externo:** descartados por no ser una transcripción genuinamente local y contradecir el requisito de no subir audio.

## DoD aplicado

- Funcionalidad implementada en la aplicación existente, en español, preservando el flujo previo de fotos y materias.
- Validaciones visibles para entradas requeridas y archivos; errores de persistencia no se ocultan.
- Imágenes comprimidas antes de guardar; blobs de audio se guardan en IndexedDB, no en `localStorage`.
- Documentación describe soporte, privacidad, limitaciones y resultados de pruebas sin afirmar verificaciones manuales no ejecutadas.
- Rutas de recursos y sintaxis comprobadas. La interacción real con hardware, cuotas del navegador y prueba offline se mantiene pendiente hasta ejecutarse en un navegador/dispositivo.
- Cambios revisados con `git status` y `git diff`; commit/tag/publicación se registran solo si se completan.
