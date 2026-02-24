# NestJS E-Commerce

Este es un proyecto backend de comercio electrónico desarrollado con [NestJS](https://nestjs.com/).

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalados:

- [Node.js](https://nodejs.org/) (versión 16 o superior recomendada)
- [Docker](https://www.docker.com/) y Docker Compose (para la base de datos local)

## Instalación

1. Clona el repositorio.
2. Instala las dependencias del proyecto:

```bash
npm install
```

## Configuración de Entorno

Asegúrate de tener tu archivo de variables de entorno configurado.
El proyecto utiliza por defecto el archivo `development.env` para el entorno de desarrollo y la configuración de Docker.

## Levantar la Base de Datos

El proyecto usa PostgreSQL. Para levantar la base de datos en local usando Docker, ejecuta el siguiente comando en la raíz del proyecto:

```bash
docker-compose up -d
```

Esto iniciará un contenedor de Postgres en el puerto `5432` de acuerdo a tu `docker-compose.yml`. Todos los datos se guardarán localmente en la carpeta `database-data`.

## Migraciones y Seeds (Opcional)

Si necesitas estructurar tu base de datos y/o poblarla con datos iniciales, ejecuta los siguientes comandos:

**Para correr las migraciones (crear las tablas):**
```bash
npm run migration:run
```

**Para correr los seeders (poblar la base de datos):**
```bash
npm run seed:run
```

## Ejecutar la Aplicación

Una vez que la base de datos esté corriendo y las dependencias estén instaladas, puedes levantar el servidor de desarrollo de NestJS:

```bash
# Modo desarrollo (con recarga automática de cambios)
npm run start:dev
```

La aplicación comenzará a escuchar peticiones generalmente en el puerto configurado en tus variables de entorno (por defecto, comúnmente en `http://localhost:3000`).

## Otros comandos útiles

```bash
# Ejecutar en modo producción
npm run start:prod

# Ejecutar pruebas (Unitarias)
npm run test

# Ejecutar pruebas (e2e)
npm run test:e2e

# Generar una nueva migración
npm run migration:generate --name=NombreDeMigracion
```