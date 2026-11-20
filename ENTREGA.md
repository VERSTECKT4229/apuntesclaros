# ApuntesClaros: entrega y estado de validación

## Enlaces

- Repositorio público: https://github.com/VERSTECKT4229/apuntesclaros
- Demo HTTPS para compartir: https://raw.githack.com/VERSTECKT4229/apuntesclaros/main/index.html (si aparece la advertencia, pulsa **Open the page**).
- GitHub Pages: https://versteckt4229.github.io/apuntesclaros/ (requiere habilitar Pages con **GitHub Actions** en Settings → Pages).

## Alcance implementado

- Notas de texto con etiquetas, CRUD, búsqueda y filtros.
- Imágenes seleccionadas o pegadas, validadas y comprimidas con Canvas.
- El contenido de las notas se escribe manualmente; el dictado por voz se excluyó por falta de fiabilidad en la demo.
- Grabación MediaRecorder asociada a notas, con reproducción y eliminación local; sin transcripción automática.
- Tres notas de prueba, cargadas sin reemplazar datos existentes.

## Estado y limitaciones

- Las notas e imágenes se conservan en el navegador de cada persona; no se sincronizan entre usuarios.
- El dictado por voz se retiró porque dependía de permisos, navegador y servicios externos, y no se verificó de forma fiable. La aplicación no sube notas, imágenes ni audios a un servidor propio.
- La transcripción de archivos de audio grabados está pendiente de elegir e integrar un modelo local; no se simulan transcripciones ni se presenta un control que no funciona.
- Los casos PF-01 a PF-04 y sus resultados parciales o pendientes están en [`docs/casos_de_prueba.md`](./docs/casos_de_prueba.md). Las pruebas de micrófono, grabación real, permisos y cuota requieren dispositivos y navegador reales.
- El despliegue de Pages falló porque el sitio aún no está habilitado para Actions. El log indica que el token del workflow no tiene permiso para crear el sitio; el propietario debe seleccionarlo en Settings → Pages.
