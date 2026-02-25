# NestJS E-Commerce Backend

Backend RESTful de comercio electrónico desarrollado con [NestJS](https://nestjs.com/), PostgreSQL y arquitectura orientada a eventos mediante AWS EventBridge + SQS + SES + WebSockets.

## Tabla de Contenidos

- [Tecnologías](#tecnologías)
- [Arquitectura](#arquitectura)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Variables de Entorno](#variables-de-entorno)
- [Base de Datos](#base-de-datos)
- [Ejecutar la Aplicación](#ejecutar-la-aplicación)
- [API Endpoints](#api-endpoints)
- [AWS — Arquitectura de Eventos](#aws--arquitectura-de-eventos)
- [WebSockets](#websockets)
- [Seguridad](#seguridad)
- [Scripts Útiles](#scripts-útiles)
- [Deploy en Producción](#deploy-en-producción)
- [Colección Postman](#colección-postman)

---

## Tecnologías

| Categoría       | Tecnología                                    |
|-----------------|-----------------------------------------------|
| Framework       | NestJS 9, Node.js                             |
| Lenguaje        | TypeScript                                    |
| Base de datos   | PostgreSQL 15 (TypeORM)                       |
| Autenticación   | JWT (JSON Web Tokens) + Bcrypt                |
| Eventos         | AWS EventBridge → SQS (consumer en NestJS)   |
| Email           | AWS SES                                       |
| WebSockets      | Socket.io (EventsGateway)                     |
| Seguridad       | Helmet, Rate Limiting (@nestjs/throttler)     |
| Contenedores    | Docker / Docker Compose                       |
| Process Manager | PM2                                           |
| Reverse Proxy   | Nginx                                         |

---

## Arquitectura

```
src/
├── api/
│   ├── auth/          # Registro, login, guards JWT y Roles
│   ├── user/          # Perfil de usuario
│   ├── product/       # CRUD de productos + activación
│   ├── role/          # Asignación de roles
│   └── aws/           # EventBridge, SQS Consumer, SES, EventsGateway
├── common/            # Decoradores, filtros y utilidades globales
├── config/            # Configuración de variables de entorno
├── database/
│   ├── migration/     # Historial de migraciones
│   └── seed/          # Datos iniciales (seeder)
└── main.ts            # Bootstrap de la aplicación
```

El proyecto sigue una **arquitectura orientada a eventos**: cuando ocurren acciones críticas (registro de usuario, activación de producto), se publica un evento en **AWS EventBridge**, que lo enruta a una cola **SQS**. Un worker interno de NestJS consume los mensajes y delega a **AWS SES** el envío de emails transaccionales o al **EventsGateway** para notificaciones en tiempo real vía WebSockets.

---

## Requisitos Previos

- [Node.js](https://nodejs.org/) v16 o superior
- [Docker](https://www.docker.com/) y Docker Compose (para PostgreSQL local)
- Cuenta de AWS con acceso a EventBridge, SQS y SES

---

## Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/LucasSoftware12/nestjs-ecommerce
cd nestjs-ecommerce

# 2. Instalar dependencias
npm install
```

---

## Variables de Entorno

Crea un archivo `development.env` en la raíz del proyecto para desarrollo local:

```env
# Servidor
PORT=3000
BASE_URL=http://localhost:3000

# Base de datos (TypeORM)
DATABASE_HOST=localhost
DATABASE_NAME=ecommerce
DATABASE_USER=tu_usuario
DATABASE_PASSWORD=tu_contraseña
DATABASE_PORT=5432
DATABASE_ENTITIES=dist/**/*.entity.{ts,js}

# JWT
JWT_SECRET=una-clave-secreta-segura

# Usuario administrador (seed)
ADMIN_EMAIL=admin@admin.com
ADMIN_PASSWORD=tu_contraseña_admin

# Docker Postgres
POSTGRES_USER=tu_usuario
POSTGRES_PASSWORD=tu_contraseña
POSTGRES_DB=postgres

# AWS Credenciales
AWS_ACCESS_KEY_ID=TU_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=TU_SECRET_KEY
AWS_REGION=us-east-2

# AWS SQS
AWS_SQS_QUEUE_URL=https://sqs.<region>.amazonaws.com/<account-id>/<nombre-queue>

# AWS SES
AWS_SES_SENDER_EMAIL=no-reply@tudominio.com

# Frontend (para CORS en producción)
FRONTEND_URL=http://localhost:5173
```

> ⚠️ **Nunca subas tus credenciales reales al repositorio.** Agrega `*.env` a tu `.gitignore`.

---

## Base de Datos

El proyecto usa **PostgreSQL 15** gestionado con **TypeORM** y soporte completo de migraciones.

### Levantar Postgres con Docker

```bash
docker-compose up -d
```

Esto inicia un contenedor de Postgres en el puerto `5432`. Los datos persisten en la carpeta `database-data/`.

### Migraciones

```bash
# Aplicar todas las migraciones pendientes
npm run migration:run

# Generar una nueva migración a partir de los cambios en entidades
npm run migration:generate --name=NombreDeMigracion

# Revertir la última migración
npm run migration:revert
```

### Seeder (Datos Iniciales)

Crea el usuario administrador y los roles base (Customer, Merchant, Admin):

```bash
npm run seed:run
```

---

## Ejecutar la Aplicación

```bash
# Modo desarrollo (hot-reload)
npm run start:dev

# Modo producción
npm run start:prod
```

La API quedará disponible en: `http://localhost:3000`

---

## API Endpoints

> Todos los endpoints protegidos requieren el header `Authorization: Bearer <token>`.
> El token se obtiene desde `POST /auth/login`.

### 🔐 Auth

| Método | Endpoint           | Descripción                      | Acceso  |
|--------|--------------------|----------------------------------|---------|
| POST   | `/auth/register`   | Registrar un nuevo usuario. Dispara evento `user.registered` → SES | Público |
| POST   | `/auth/login`      | Iniciar sesión (retorna JWT)     | Público |

### 👤 User

| Método | Endpoint          | Descripción                           | Acceso          |
|--------|-------------------|---------------------------------------|-----------------|
| GET    | `/user/profile`   | Perfil del usuario autenticado        | 🔒 Cualquier usuario |

### 📦 Product

| Método | Endpoint                    | Descripción                                                        | Acceso               |
|--------|-----------------------------|--------------------------------------------------------------------|----------------------|
| GET    | `/product`                  | Listar todos los productos                                         | Público              |
| GET    | `/product/:id`              | Obtener producto por ID                                            | Público              |
| POST   | `/product/create`           | Crear un nuevo producto                                            | 🔒 Admin / Merchant  |
| POST   | `/product/:id/details`      | Agregar detalles a un producto existente                           | 🔒 Admin / Merchant  |
| POST   | `/product/:id/activate`     | Activar producto. Dispara evento `product.activated` → WebSocket   | 🔒 Admin / Merchant  |
| DELETE | `/product/:id`              | Eliminar un producto                                               | 🔒 Admin / Merchant  |

### 🎭 Role

| Método | Endpoint        | Descripción               | Acceso       |
|--------|-----------------|---------------------------|--------------|
| POST   | `/role/assign`  | Asignar un rol a un usuario | 🔒 Solo Admin |

---

## AWS — Arquitectura de Eventos

```
[NestJS Service]
      │
      ▼ putEvents()
[AWS EventBridge]
      │
      ▼ Regla de enrutamiento
[AWS SQS Queue]
      │
      ▼ Long Polling (SqsConsumerService)
      │
      ├──▶ [AWS SES] ──▶ 📧 Email al usuario
      │
      └──▶ [EventsGateway] ──▶ 🔔 WebSocket broadcast a clientes
```

### Eventos implementados

| Evento              | Trigger                   | Acción resultante                                        |
|---------------------|---------------------------|----------------------------------------------------------|
| `user.registered`   | Nuevo registro de usuario | Email de bienvenida vía AWS SES                          |
| `product.activated` | Producto marcado activo   | Broadcast WebSocket en tiempo real a todos los clientes conectados |

### Configuración en AWS

1. Crear un **Event Bus** en EventBridge (o usar el default).
2. Crear una **regla** que enrute los eventos con source `ecommerce.app` a la cola SQS.
3. Crear la **cola SQS** y configurar la variable `AWS_SQS_QUEUE_URL`.
4. Verificar el email remitente en **AWS SES** (en sandbox, también el destinatario).
5. Asignar al IAM User los permisos:
   - `events:PutEvents`
   - `sqs:ReceiveMessage`
   - `sqs:DeleteMessage`
   - `ses:SendEmail`

---

## WebSockets

El servidor expone un **WebSocket Gateway** via Socket.io en el mismo puerto que la API (`:3000`).

### Eventos disponibles

| Evento                | Dirección         | Descripción                                                    |
|-----------------------|-------------------|----------------------------------------------------------------|
| `newProductActivated` | Server → Client   | Se emite cuando un producto se activa. El cliente recibe la notificación en tiempo real sin polling. |

### Cómo probarlo

1. Abrí dos ventanas del navegador en `http://localhost:3000` (o la URL de producción).
2. Desde una sesión con rol Admin/Merchant, activá un producto via `POST /product/:id/activate`.
3. En la otra ventana, observá el toast de notificación en tiempo real sin refrescar la página.

### Conexión desde el cliente

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

socket.on('newProductActivated', (data) => {
  console.log('Nuevo producto activado:', data);
});
```

---

## Seguridad

- **Helmet**: cabeceras HTTP seguras en todas las respuestas. Protege contra clickjacking, sniffing y otros ataques comunes.
- **CORS**: restrictivo en producción (solo `FRONTEND_URL`), abierto en desarrollo. Evita requests cross-origin no autorizados.
- **JWT Guards**: rutas protegidas requieren token válido.
- **Role Guards**: endpoints de administración restringidos por rol.
- **Rate Limiting**: throttling global de 100 req/60s por IP con `@nestjs/throttler`. Protege contra fuerza bruta y DDoS básico.
- **Validation Pipe**: `whitelist: true` + `forbidNonWhitelisted: true` para evitar Mass Assignment y campos no esperados.
- **Bcrypt**: `saltRounds = 12` — 4x más costoso que el valor default (10), sin impacto perceptible para el usuario legítimo.

---

## Scripts Útiles

```bash
npm run start:dev          # Desarrollo con hot-reload
npm run start:prod         # Producción
npm run build              # Compilar TypeScript
npm run lint               # Análisis estático + autofix
npm run format             # Formateo con Prettier
npm run test               # Tests unitarios
npm run test:e2e           # Tests end-to-end
npm run test:cov           # Reporte de cobertura
npm run migration:run      # Aplicar migraciones
npm run migration:generate # Generar nueva migración
npm run migration:revert   # Revertir última migración
npm run seed:run           # Ejecutar seeder
```

---

## Deploy en Producción

### URLs públicas

- **Backend API**: http://3.145.134.208:3000
- **Frontend**: http://3.145.134.208

### Infraestructura AWS

| Servicio        | Uso                                      |
|-----------------|------------------------------------------|
| EC2 `t3.micro`  | Servidor donde corre NestJS              |
| RDS `db.t3.micro` | PostgreSQL gestionado                  |
| EventBridge     | Bus de eventos central                   |
| SQS             | Cola de mensajes con retry automático    |
| SES             | Envío de emails transaccionales          |

### Stack de deploy

- **PM2**: process manager que mantiene el proceso Node.js corriendo, lo reinicia si cae y arranca automáticamente con el sistema operativo.
- **Nginx**: reverse proxy que sirve el frontend estático en puerto 80 y redirige el tráfico HTTP y WebSocket al puerto 3000.

### ¿Por qué EC2 y no Lambda?

- **WebSockets** requieren conexiones persistentes. Lambda es stateless y se apaga después de cada ejecución.
- El **SqsConsumerService** corre un bucle infinito de long polling. Lambda tiene límite de 15 minutos, imposible para un proceso continuo.
- NestJS tiene cold start pesado (~500ms–2s). En Lambda ese costo pega en cada request. En EC2 arranca una vez y queda en memoria.

### Comandos de deploy

```bash
# En el servidor EC2
git pull origin main
npm install
npm run build
pm2 restart nestjs-ecommerce --update-env
```

---

## Colección Postman

Dentro de la carpeta `documentation/` se encuentra el archivo `Nestjs Ecommerce.postman_collection.json` con todos los endpoints listos para importar en Postman.

```
documentation/
└── Nestjs Ecommerce.postman_collection.json
```

Importá el archivo en Postman y configurá la variable `base_url` apuntando a tu servidor local (`http://localhost:3000`) o de producción (`http://3.145.134.208:3000`).