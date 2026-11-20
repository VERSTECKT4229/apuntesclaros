# ApuntesClaros: entrega y estado de validación

## Enlaces

- Repositorio público: https://github.com/VERSTECKT4229/apuntesclaros
- Demo HTTPS para compartir: https://raw.githack.com/VERSTECKT4229/apuntesclaros/be3f1222ee2844a656cd728c737a51eb0c6c1f48/index.html (si aparece la advertencia, pulsa **Open the page**).
- GitHub Pages: https://versteckt4229.github.io/apuntesclaros/ (requiere habilitar Pages con **GitHub Actions** en Settings → Pages).

## Alcance implementado

- Notas de texto con etiquetas, CRUD, búsqueda y filtros.
- Imágenes seleccionadas o pegadas, validadas y comprimidas con Canvas.
- Dictado en español cuando Web Speech API está disponible.
- Grabación MediaRecorder y persistencia local en IndexedDB.
- Tres notas de prueba, cargadas sin reemplazar datos existentes.

## Estado y limitaciones

- Las notas e imágenes se conservan en el navegador de cada persona; no se sincronizan entre usuarios.
- Web Speech API puede depender de un servicio del navegador. La aplicación no sube notas, imágenes ni audios a un servidor propio.
- La transcripción de archivos de audio grabados está pendiente de elegir e integrar un modelo local. El botón informa la limitación; no inventa transcripciones.
- Los casos PF-01 a PF-04 y sus resultados parciales o pendientes están en [`docs/casos_de_prueba.md`](./docs/casos_de_prueba.md). Las pruebas de micrófono, grabación real, permisos y cuota requieren dispositivos y navegador reales.
- El despliegue de Pages falló porque el sitio aún no está habilitado para Actions. El log indica que el token del workflow no tiene permiso para crear el sitio; el propietario debe seleccionarlo en Settings → Pages.
