# 🎓 Stays API — Sistema de Gestión de Estadías UT Tecamachalco

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![Sequelize](https://img.shields.io/badge/ORM-Sequelize-blue)](https://sequelize.org/)
[![Security](https://img.shields.io/badge/Security-Hardened-orange)](#seguridad)

API REST robusta diseñada para la gestión integral del proceso de estadías profesionales. Facilita la vinculación entre alumnos, empresas y la universidad, automatizando el flujo de documentos y la asignación de plazas.

---

##  Tecnologías Core

*   **Runtime:** [Node.js 20+](https://nodejs.org/) con Express.
*   **Base de Datos:** MySQL / [TiDB Cloud](https://pingcap.com/tidb-cloud) (Distribuida).
*   **ORM:** [Sequelize](https://sequelize.org/) con soporte de migraciones y transacciones.
*   **Almacenamiento:** [Amazon S3](https://aws.amazon.com/s3/) para gestión documental privada.
*   **Seguridad:** JWT (Stateless), bcryptjs (Hashing), express-rate-limit.
*   **Emailing:** [Resend](https://resend.com/) para notificaciones y OTP.

---

##  Arquitectura y Seguridad

Este proyecto implementa prácticas de seguridad de nivel industrial:

### Hardening de Seguridad
*   **Protección contra Race Conditions:** Las asignaciones de empresas utilizan transacciones SQL con **bloqueo pesimista (`SELECT FOR UPDATE`)** para garantizar que nunca se supere el cupo máximo por peticiones simultáneas.
*   **Control de Acceso Basado en Roles (RBAC):** Diferenciación estricta entre `ROOT`, `ADMIN`, `ENCARGADO_CARRERA` y `STUDENT`.
*   **Validación de Identidad:** Los alumnos solo pueden acceder y gestionar documentos vinculados a su propia matrícula mediante verificaciones cruzadas en el middleware.
*   **Criptografía Segura:** Generación de OTPs mediante `crypto.randomInt` y hashing de contraseñas con salt dinámico.
*   **Prevención de Fuga de Información:** En producción, la API oculta detalles internos de errores y trazas de la base de datos.
*   **Rate Limiting:** Límites diferenciados para login, envío de correos y consultas generales para prevenir ataques de fuerza bruta y DoS.

---

##  Estructura del Proyecto

```text
stays-api/
├── src/
│   ├── controllers/    # Lógica de negocio por recurso
│   ├── middleware/     # Seguridad, validación y upload
│   ├── models/         # Definición de esquemas Sequelize
│   ├── routes/         # Definición de endpoints
│   └── utils/          # Helpers (JWT, Mailer, etc.)
├── server.js           # Punto de entrada y configuración Express
└── ecosystem.config.js # Configuración para PM2 (Producción)
```

---

##  API Reference (Endpoints Principales)

### Autenticación
| Ruta | Método | Acceso | Descripción |
| :--- | :--- | :--- | :--- |
| `/api/auth/check-matricula` | `POST` | Público | Verifica si el alumno existe y su estado. |
| `/api/auth/send-code` | `POST` | Público | Envía código OTP para onboarding/reset. |
| `/api/auth/login/student` | `POST` | Alumno | Login con matrícula y contraseña. |
| `/api/auth/login/admin` | `POST` | Admin | Login administrativo. |

### Gestión de Alumnos
| Ruta | Método | Acceso | Descripción |
| :--- | :--- | :--- | :--- |
| `/api/students` | `GET` | Admin | Listado paginado con filtros de carrera. |
| `/api/students/:mat` | `GET` | Propio/Admin | Detalle completo del alumno. |
| `/api/students/:mat/select-company` | `PUT` | Propio | Asignación de plaza (con validación de cupo). |
| `/api/students/:mat/advance-stage` | `PUT` | Admin | Avanza al alumno en las etapas del proceso. |

### Gestión Documental (Amazon S3)
| Ruta | Método | Acceso | Descripción |
| :--- | :--- | :--- | :--- |
| `/api/documents/upload` | `POST` | Propio | Sube archivo directamente a S3. |
| `/api/documents/:id/download` | `GET` | Propio/Admin | Genera URL temporal prefirmada (15 min). |
| `/api/documents/:id/review` | `PATCH` | Admin | Aprueba o rechaza un documento. |

---

##  Instalación y Desarrollo

1.  **Clonar y configurar:**
    ```bash
    git clone https://github.com/PonchoSaldana/stays-api.git
    npm install
    ```
2.  **Variables de Entorno:**
    Crea un archivo `.env` basado en `.env.example`.
3.  **Ejecución:**
    ```bash
    # Desarrollo
    npm run dev
    
    # Producción (PM2)
    pm2 start ecosystem.config.js --env production
    ```

---

##  Notas de Producción
En entornos de producción (`NODE_ENV=production`):
*   La sincronización automática de modelos (`sync({alter:true})`) está **desactivada** por seguridad.
*   CORS está restringido a la lista blanca definida en `FRONTEND_URL`.
*   Se requiere configuración de certificados SSL en el balanceador de carga o proxy inverso.
