# ApuntesClaros

Aplicación web para organizar fotografías de apuntes por materia, corte y estado de revisión. Funciona completamente en el navegador y guarda los datos con IndexedDB.

## Ejecutar

Abre la carpeta en Visual Studio Code y ejecuta `index.html` con Live Server.

## Funciones

- Subir fotografías y comprimirlas automáticamente.
- Clasificar apuntes por materia.
- Filtrar por corte y buscar notas.
- Marcar apuntes como revisados.
- Tomar notas con dictado por voz compatible con Chrome y Edge.
- Ejecutar el dictado desde `localhost` o una dirección HTTPS para habilitar el micrófono.
- Exportar e importar respaldos JSON.
- Crear un paquete imprimible y PDF de estudio.

## Publicar en GitHub

```bash
git init
git add .
git commit -m "Primer commit: ApuntesClaros"
git branch -M main
git remote add origin URL_DEL_REPOSITORIO
git push -u origin main
```
