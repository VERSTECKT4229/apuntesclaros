# ApuntesClaros: resumen del progreso

## Estado general

Se completó una versión funcional, instalable y preparada para demostración.

## Nuevas mejoras incorporadas

- Tablero general con total de apuntes, apuntes revisados, progreso y materias.
- Barra visual de progreso por materia en las tarjetas principales.
- Captura de fotografías desde la cámara del celular.
- Carga múltiple de imágenes.
- Compresión automática de fotografías.
- Botón para girar apuntes desde la vista principal.
- Clasificación automática por materia.
- Organización por materia y tres cortes académicos.
- Notas de voz mediante Web Speech API.
- Texto editable antes de guardar una nota.
- Respaldo completo exportable e importable.
- Recuperación de datos dañados por codificación anterior.
- Resumen e impresión para generar PDF.
- Diseño responsive para escritorio, tabletas y celulares.
- Modo claro y modo oscuro.
- Aplicación instalable como PWA.
- Funcionamiento sin conexión mediante caché.
- Indicador de estado de conexión.
- Icono personalizado y página preparada para GitHub Pages.

## Funciones validadas

- Apertura de la aplicación.
- Creación de materias.
- Carga, clasificación, edición y eliminación de fotografías.
- Marcado de apuntes como revisados.
- Guardado local mediante IndexedDB.
- Exportación e importación de respaldos.
- Generación del paquete de impresión/PDF.
- Instalación como aplicación web.
- Uso principal sin conexión.

## Nota técnica

La sincronización automática entre dispositivos requiere una infraestructura de cuentas, autenticación, base de datos remota y reglas de seguridad. Para compartir datos entre dispositivos sin esa infraestructura se mantiene disponible la exportación/importación de respaldos completa.
