-- ============================================================
--  SISTEMA DE ESTADÍAS PROFESIONALES — UT TECAMACHALCO
--  Motor: MySQL 8.x / MariaDB 10.x
--  Generado: 2026-02-19
--
--  Instrucciones MySQL Workbench:
--    1. Abre MySQL Workbench
--    2. Conéctate a tu servidor
--    3. File → Open SQL Script → selecciona este archivo
--    4. Ejecuta con Ctrl+Shift+Enter (ejecutar todo)
-- ============================================================

-- Crear y usar la base de datos
CREATE DATABASE IF NOT EXISTS `stays_uttecam`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE `stays_uttecam`;

-- Deshabilitar checks de FK durante la creación
SET FOREIGN_KEY_CHECKS = 0;


-- ────────────────────────────────────────────────────────────
-- TABLA: companies
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `companies` (
    `id`            INT             NOT NULL AUTO_INCREMENT,
    `name`          VARCHAR(255)    NOT NULL            COMMENT 'Nombre de la empresa',
    `address`       VARCHAR(255)    DEFAULT ''          COMMENT 'Dirección',
    `contact`       VARCHAR(255)    DEFAULT ''          COMMENT 'Nombre del responsable',
    `businessLine`  VARCHAR(255)    DEFAULT ''          COMMENT 'Giro empresarial',
    `email`         VARCHAR(255)    DEFAULT ''          COMMENT 'Correo de la empresa',
    `phone`         VARCHAR(50)     DEFAULT ''          COMMENT 'Teléfono',
    `available`     TINYINT(1)      NOT NULL DEFAULT 1  COMMENT '1 = con cupo disponible',
    `maxStudents`   INT             NOT NULL DEFAULT 5  COMMENT 'Capacidad máxima de alumnos',
    `createdAt`     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Empresas disponibles para estadías';


-- ────────────────────────────────────────────────────────────
-- TABLA: students
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `students` (
    -- Datos importados del Excel
    `matricula`                   VARCHAR(50)     NOT NULL            COMMENT 'Matrícula única del alumno (PK)',
    `name`                        VARCHAR(255)    NOT NULL            COMMENT 'Nombre completo',
    `careerName`                  VARCHAR(255)    DEFAULT ''          COMMENT 'Carrera (del Excel)',
    `grade`                       VARCHAR(20)     DEFAULT ''          COMMENT 'Grado / Cuatrimestre',
    `group`                       VARCHAR(20)     DEFAULT ''          COMMENT 'Grupo / Sección',
    `shift`                       VARCHAR(30)     DEFAULT ''          COMMENT 'Turno',
    `generation`                  VARCHAR(50)     DEFAULT ''          COMMENT 'Generación',
    `director`                    VARCHAR(255)    DEFAULT ''          COMMENT 'Director de carrera',

    -- Relación con empresa
    `companyId`                   INT             DEFAULT NULL        COMMENT 'FK → companies.id',

    -- Estado del proceso de estadía
    `status`                      ENUM(
                                    'Pendiente',
                                    'Empresa Seleccionada',
                                    'Documentos Iniciales Enviados',
                                    'En Revisión Inicial',
                                    'Documentos Generados',
                                    'Documentos Finales Enviados',
                                    'En Revisión Final',
                                    'Finalizado',
                                    'Rechazado'
                                  ) NOT NULL DEFAULT 'Pendiente'      COMMENT 'Estado actual del proceso',

    `currentStage`                VARCHAR(100)    DEFAULT 'catalogo-empresas' COMMENT 'Ruta/etapa actual',

    -- Autenticación (onboarding de primer ingreso)
    `email`                       VARCHAR(255)    DEFAULT NULL        COMMENT 'Correo personal del alumno',
    `password`                    VARCHAR(255)    DEFAULT NULL        COMMENT 'Hash bcrypt de la contraseña',
    `isFirstLogin`                TINYINT(1)      NOT NULL DEFAULT 1  COMMENT '1 = nunca configuró su cuenta',
    `emailVerified`               TINYINT(1)      NOT NULL DEFAULT 0  COMMENT '1 = correo verificado con OTP',

    -- Código OTP temporal (se borra tras verificar)
    `verificationCode`            VARCHAR(10)     DEFAULT NULL        COMMENT 'Código de 6 dígitos enviado por correo',
    `verificationCodeExpires`     DATETIME        DEFAULT NULL        COMMENT 'Fecha/hora de expiración del OTP',

    -- Notas del administrador
    `adminNotes`                  TEXT            DEFAULT NULL        COMMENT 'Comentarios o notas del revisor',

    `createdAt`                   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`                   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (`matricula`),
    INDEX `idx_students_company`  (`companyId`),
    INDEX `idx_students_status`   (`status`),
    INDEX `idx_students_email`    (`email`),

    CONSTRAINT `fk_students_company`
        FOREIGN KEY (`companyId`)
        REFERENCES `companies` (`id`)
        ON DELETE SET NULL
        ON UPDATE CASCADE

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Alumnos importados desde Excel con datos de autenticación';


-- ────────────────────────────────────────────────────────────
-- TABLA: documents
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `documents` (
    `id`                INT             NOT NULL AUTO_INCREMENT,
    `studentMatricula`  VARCHAR(50)     NOT NULL            COMMENT 'FK → students.matricula',

    `stage`             VARCHAR(50)     NOT NULL            COMMENT 'Etapa: upload_1 | upload_2',
    `documentName`      VARCHAR(255)    NOT NULL            COMMENT 'Nombre lógico: Documento 1, Carta...',
    `filename`          VARCHAR(255)    NOT NULL            COMMENT 'Nombre físico guardado en disco',
    `filePath`          VARCHAR(500)    NOT NULL            COMMENT 'Ruta relativa desde /uploads',
    `mimeType`          VARCHAR(100)    DEFAULT 'application/octet-stream',
    `fileSize`          INT             DEFAULT 0           COMMENT 'Tamaño en bytes',

    `status`            ENUM('Pendiente','Aprobado','Rechazado')
                                        NOT NULL DEFAULT 'Pendiente' COMMENT 'Estado de revisión',
    `reviewNote`        TEXT            DEFAULT NULL        COMMENT 'Comentario del revisor al aprobar/rechazar',

    `createdAt`         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    INDEX `idx_documents_student` (`studentMatricula`),
    INDEX `idx_documents_stage`   (`stage`),
    INDEX `idx_documents_status`  (`status`),

    CONSTRAINT `fk_documents_student`
        FOREIGN KEY (`studentMatricula`)
        REFERENCES `students` (`matricula`)
        ON DELETE CASCADE
        ON UPDATE CASCADE

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Documentos subidos por los alumnos en cada etapa del proceso';


-- ────────────────────────────────────────────────────────────
-- TABLA: admins
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `admins` (
    `id`        INT             NOT NULL AUTO_INCREMENT,
    `username`  VARCHAR(100)    NOT NULL                    COMMENT 'Nombre de usuario (único)',
    `password`  VARCHAR(255)    NOT NULL                    COMMENT 'Hash bcrypt',
    `email`     VARCHAR(255)    DEFAULT NULL,
    `role`      ENUM('ADMIN','ROOT') NOT NULL DEFAULT 'ADMIN' COMMENT 'Rol del usuario',
    `isActive`  TINYINT(1)      NOT NULL DEFAULT 1          COMMENT '0 = cuenta desactivada',

    `createdAt` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_admins_username` (`username`)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Usuarios administrativos del sistema';


-- Re-habilitar checks de FK
SET FOREIGN_KEY_CHECKS = 1;


-- ============================================================
-- DATOS DE EJEMPLO (opcional — descomenta para probar)
-- ============================================================

-- INSERT INTO `companies` (name, address, contact, businessLine, email, phone, available, maxStudents) VALUES
--   ('TECAM Software SA de CV',  'Av. Principal 100, Tecamachalco', 'Ing. García',   'Desarrollo de Software', 'contacto@tecamsw.mx',  '222-100-0001', 1, 3),
--   ('Grupo Industrial Puebla',   'Blvd. Norte 500, Puebla',         'Lic. Martínez', 'Manufactura',            'rrhh@grupopuebla.mx', '222-200-0002', 1, 5),
--   ('Hospital Regional IMSS',    'Calle Salud 200, Tehuacán',       'Dr. López',     'Salud',                  'imss@salud.mx',       '238-300-0003', 1, 2);

-- INSERT INTO `students` (matricula, name, careerName, grade, `group`, shift, generation, director) VALUES
--   ('20230001', 'Juan Pérez López',        'Ing. Software',   '9', 'A', 'Matutino',  '2023-2026', 'Dr. Ramírez'),
--   ('20230002', 'María García Hernández',  'Ing. Industrial', '9', 'B', 'Vespertino','2023-2026', 'Dra. Flores'),
--   ('20230003', 'Carlos Soto Díaz',        'Lic. Contaduría', '9', 'A', 'Matutino',  '2023-2026', 'Lic. Torres');
