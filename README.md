# ApuntesClaros

Aplicación web en español para organizar apuntes de estudio con notas de texto, etiquetas, imágenes y grabaciones de audio. Es una aplicación estática HTML5, CSS3 y JavaScript Vanilla: no necesita servidor de aplicación, cuentas ni bases de datos externas. Las notas, las imágenes comprimidas, las materias y los archivos de audio se guardan localmente en IndexedDB.

**Autor:** Daniel Alejandro Benítez Morales

## Probar y compartir

Abre la demo HTTPS y envía este enlace a quien vaya a probarla:

**https://raw.githack.com/VERSTECKT4229/apuntesclaros/main/index.html**

Si aparece el aviso de raw.githack, pulsa **Open the page**. Cada persona guarda sus notas, imágenes y audios únicamente en su propio navegador; esta demo no sincroniza datos entre usuarios. Para probar la grabación de audio, concede permiso de micrófono en Chrome o Edge.

La URL oficial de GitHub Pages es https://versteckt4229.github.io/apuntesclaros/. Si muestra 404, el propietario debe abrir [Settings → Pages](https://github.com/VERSTECKT4229/apuntesclaros/settings/pages), elegir **GitHub Actions** como fuente y guardar. El workflow del repositorio no puede habilitar Pages por sí solo con los permisos actuales.

## Alcance

- CRUD de notas: crear, consultar, editar y eliminar.
- Búsqueda por título, etiqueta/categoría y contenido; filtro por etiqueta.
- Adjuntar imágenes seleccionadas o pegadas desde el portapapeles. Se valida el tipo y la decodificación, y se comprime antes de guardarlas.
- Ingreso manual del contenido de cada nota.
- Grabación con MediaRecorder, reproducción y eliminación de archivos asociados a notas.
- Carga no destructiva de tres notas de prueba.
- Aplicación instalable (PWA) y recursos estáticos almacenables en caché para uso sin conexión.

No se envían notas, imágenes ni grabaciones a un servidor de ApuntesClaros. La aplicación no incorpora dictado por voz; el texto de las notas se ingresa manualmente. La grabación local con MediaRecorder requiere permiso de micrófono.

## Requisitos

- Google Chrome o Microsoft Edge actualizado para la mejor compatibilidad.
- Para grabar audio, abrir la aplicación en `localhost` o HTTPS y conceder permiso de micrófono.
- El navegador debe permitir almacenamiento local (IndexedDB) y disponer de espacio suficiente.

## Instalación y ejecución

Clona el repositorio y abre la carpeta del proyecto en Visual Studio Code:

```bash
git clone https://github.com/VERSTECKT4229/apuntesclaros.git
cd apuntesclaros
```

Abre `index.html` directamente para revisar la interfaz, o usa **Live Server** en VS Code para habilitar un origen local seguro y las funciones de micrófono. No hay `npm install`, compilación, backend ni configuración de base de datos. Para instalar la PWA o probar micrófono, usa `localhost` o HTTPS en lugar de `file://`.

## Uso

1. En **Notas**, crea una nota con título y contenido o al menos una imagen; añade una etiqueta opcional.
2. Escribe el contenido de la nota. Selecciona imágenes o pega una captura con `Ctrl+V`.
3. Usa **Iniciar grabación** y **Detener grabación** para adjuntar audio. Guarda la nota para persistir la grabación. Cada archivo se puede reproducir o eliminar desde la edición de la nota; las grabaciones no se transcriben.
4. Busca por título, etiqueta o contenido; abre una nota para editarla o eliminarla.
5. Pulsa **Cargar datos de prueba** para agregar tres notas identificadas como pruebas. La acción no elimina ni reemplaza datos existentes, y volver a pulsarla no duplica las muestras.

El dictado por voz se excluyó de esta entrega porque su disponibilidad dependía del navegador, sus permisos y un servicio externo, y no se pudo verificar de forma fiable. El contenido debe escribirse manualmente. Tampoco se ofrece transcripción automática de grabaciones: integrar un modelo local requeriría decidir y distribuir o descargar sus pesos, además de incorporar runtime y consumo de memoria/CPU. No se simula la transcripción ni se sube el audio.

## Almacenamiento y limitaciones

Los datos permanecen en el almacenamiento del perfil del navegador y no se sincronizan entre dispositivos. Borrar los datos del sitio o cambiar de navegador/perfil puede eliminarlos. El navegador impone una cuota que puede variar; al agotarse, la aplicación informa del error y conserva la interfaz operativa. IndexedDB guarda blobs de audio para evitar colocar archivos grandes en `localStorage`.

La grabación local con MediaRecorder no requiere enviar el archivo a un servicio remoto. La transcripción de audio grabado no está implementada.

## Flujo técnico

```text
Interfaz HTML/CSS
       |
       v
JavaScript Vanilla ----> MediaRecorder (captura local de audio)
       |                 Canvas (validación/compresión de imagen)
       v
IndexedDB local (notas, materias, imágenes y blobs de audio)
       |
       +---- Service Worker: caché de recursos estáticos
```
