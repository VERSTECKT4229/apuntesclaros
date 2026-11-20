# Matriz de etapas del proyecto

Esta matriz registra evidencia observada en el repositorio actual. No reconstruye fechas, reuniones, prototipos ni decisiones históricas sin artefactos que las acrediten.

| Etapa | Resultado verificable | Aprendizaje / decisión | Evidencia del repositorio | Estado |
|---|---|---|---|---|
| Descubrimiento | Alcance de cliente local, notas y medios identificado para este incremento. | Mantener el requisito client-side; no introducir servicios externos. | `README.md`, `docs/backlog_y_dod.md` | Documentado para el incremento; descubrimiento histórico no verificable |
| Propuesta | Incremento sobre la aplicación HTML/CSS/JS existente. | Reutilizar la navegación y IndexedDB existentes. | `index.html`, `app.js` | Implementado parcialmente |
| Prototipado | Interfaz funcional existente con navegación, tarjetas y formularios. | No hay artefactos de prototipos visuales previos en el repositorio inspeccionado. | `index.html`, `styles.css` | Prototipos históricos no verificables |
| Diseño técnico | IndexedDB local versionada para notas y blobs, Canvas para compresión y MediaRecorder para audio. | Separar metadatos/imagenes de audio binario; no usar `localStorage` para blobs. | `app.js` | Implementado |
| Backlog/planeación | Elementos terminados, pendientes y descartados clasificados. | Mantener transcripción local como pendiente técnica explícita; no fingir resultados. | `docs/backlog_y_dod.md` | Documentado |
| Iteraciones | Cambios acotados al incremento final y conservación de funciones previas de fotos/materias. | Invalidar caché de assets al cambiar JS. | `app.js`, `sw.js` | Implementado en este incremento; historial de iteraciones no inferido |
| Gestión/desarrollo individual | Estructura de aplicación estática y flujo Git disponible. | Ajustar GitHub Flow al trabajo individual, sin atribuir revisiones inexistentes. | `app.js`, `.github/workflows/pages.yml` | Parcial; evidencia de colaboración no encontrada |
| Pruebas/calidad | Se ejecutaron flujos parciales de CRUD, búsqueda/filtro, validación de entradas, imágenes y carga offline. | Micrófono, grabación real y cuota necesitan ejecución en dispositivos/navegadores reales. | `docs/casos_de_prueba.md`, `app.js`, `sw.js` | Parcial; PF-03 y medios de voz pendientes |
| Incremento final | Aplicación y documentación actualizadas; transcripción de archivo declarada como bloqueo técnico. | No declarar completa la entrega hasta resolver pruebas reales y publicación. | `README.md`, `docs/`, `index.html`, `app.js` | Parcial hasta completar pruebas y publicación |
